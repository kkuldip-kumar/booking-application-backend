import { BadRequestException } from '@nestjs/common';
import { EntityManager, EntityTarget, FindOptionsWhere, In } from 'typeorm';

export async function loadAllOrFail<T extends { id: string }>(
  manager: EntityManager,
  target: EntityTarget<T>,
  ids: readonly string[],
  label: string,
): Promise<T[]> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return [];
  const found = await manager.find(target, { where: { id: In(unique) } as FindOptionsWhere<T> });
  if (found.length !== unique.length) {
    throw new BadRequestException(`One or more ${label} do not exist`);
  }
  return found;
}
