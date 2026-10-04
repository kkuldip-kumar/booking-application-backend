export interface Paginated<T> {
  items: T[];
  meta: { page: number; limit: number; total: number };
}

export function paginate<T>(items: T[], total: number, page: number, limit: number): Paginated<T> {
  return { items, meta: { page, limit, total } };
}
