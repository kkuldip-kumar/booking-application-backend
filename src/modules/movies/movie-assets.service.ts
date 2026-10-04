import {
  BadRequestException, Inject, Injectable, Logger, UnsupportedMediaTypeException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { MovieAssetType } from '../../common/enums/movie-asset-type.enum';
import { DetectedImage, detectImage } from '../../common/utils/image-signature';
import { assertNotArchived, lockMovieOrFail } from './domain/movie-persistence';
import { AdminMovieDetailDto } from './dto/movie-response.dto';
import { MovieAsset } from './entities/movie-asset.entity';
import { MovieAuditService } from './movie-audit.service';
import { MAX_IMAGE_BYTES, MEDIA_STORAGE } from './movies.constants';
import { MoviesService } from './movies.service';
import { MediaStorage } from './storage/media-storage.interface';

export interface UploadedImageFile {
  readonly buffer: Buffer;
  readonly size: number;
}

export interface UploadAssetInput {
  readonly actorId: string;
  readonly movieId: string;
  readonly type: MovieAssetType;
  readonly file: UploadedImageFile | undefined;
}

interface StoredObject {
  readonly key: string;
  readonly url: string;
  readonly image: DetectedImage;
  readonly sizeBytes: number;
}

@Injectable()
export class MovieAssetsService {
  private readonly logger = new Logger(MovieAssetsService.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
    private readonly audit: MovieAuditService,
    private readonly movies: MoviesService,
  ) {}

  async upload(input: UploadAssetInput): Promise<AdminMovieDetailDto> {
    const image = this.validate(input.file);
    await this.assertEditable(input.movieId);
    const stored = await this.store(input, image);
    const previousKey = await this.persist(input, stored).catch(async (error: unknown) => {
      await this.discard(stored.key);
      throw error;
    });
    if (previousKey) await this.discard(previousKey);
    await this.audit.record({
      actorId: input.actorId, action: 'movie.asset_uploaded', movieId: input.movieId,
      metadata: { type: input.type, mime: stored.image.mime, sizeBytes: stored.sizeBytes },
    });
    return this.movies.getAdmin(input.movieId);
  }

  private validate(file: UploadedImageFile | undefined): { file: UploadedImageFile; image: DetectedImage } {
    if (!file || file.size === 0) throw new BadRequestException('An image file is required');
    if (file.size > MAX_IMAGE_BYTES) throw new BadRequestException('Image exceeds the 5 MB limit');
    const image = detectImage(file.buffer);
    if (!image) throw new UnsupportedMediaTypeException('Only JPEG, PNG or WebP images are accepted');
    return { file, image };
  }

  private async assertEditable(movieId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      assertNotArchived(await lockMovieOrFail(manager, movieId));
    });
  }

  // The key is built from ids and a random UUID only; the client filename never reaches the filesystem.
  private async store(
    input: UploadAssetInput,
    validated: { file: UploadedImageFile; image: DetectedImage },
  ): Promise<StoredObject> {
    const { file, image } = validated;
    const key = `movies/${input.movieId}/${input.type.toLowerCase()}-${randomUUID()}.${image.extension}`;
    const url = await this.storage.save(key, file.buffer, image.mime);
    return { key, url, image, sizeBytes: file.size };
  }

  private persist(input: UploadAssetInput, stored: StoredObject): Promise<string | null> {
    return this.dataSource.transaction(async (manager) => {
      assertNotArchived(await lockMovieOrFail(manager, input.movieId));
      const existing = await manager.findOneBy(MovieAsset, { movieId: input.movieId, assetType: input.type });
      const fields = {
        url: stored.url, storageKey: stored.key, mimeType: stored.image.mime, sizeBytes: stored.sizeBytes,
      };
      if (existing) {
        await manager.update(MovieAsset, { id: existing.id }, fields);
        return existing.storageKey;
      }
      await manager.insert(MovieAsset, { movieId: input.movieId, assetType: input.type, ...fields });
      return null;
    });
  }

  private async discard(key: string): Promise<void> {
    try {
      await this.storage.delete(key);
    } catch (error: unknown) {
      this.logger.warn(`Failed to delete orphaned media object ${key}: ${String(error)}`);
    }
  }
}
