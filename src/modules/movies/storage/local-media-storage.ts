import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { MediaStorage } from './media-storage.interface';

@Injectable()
export class LocalMediaStorage implements MediaStorage {
  private readonly root: string;
  private readonly publicBaseUrl: string;

  constructor(config: ConfigService) {
    this.root = resolve(config.getOrThrow<string>('MEDIA_ROOT'));
    this.publicBaseUrl = config.getOrThrow<string>('MEDIA_PUBLIC_BASE_URL').replace(/\/+$/, '');
  }

  async save(key: string, data: Buffer): Promise<string> {
    const target = this.resolveInsideRoot(key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, data, { flag: 'wx' });
    return `${this.publicBaseUrl}/${key}`;
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolveInsideRoot(key), { force: true });
  }

  private resolveInsideRoot(key: string): string {
    const target = resolve(this.root, key);
    if (!target.startsWith(this.root + sep)) {
      throw new InternalServerErrorException('Invalid storage key');
    }
    return target;
  }
}
