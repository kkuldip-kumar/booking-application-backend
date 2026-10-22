export interface Paginated<T> {
  items: T[];
  meta: { page: number; limit: number; total: number };
}

export function paginate<T>(items: T[], total: number, page: number, limit: number): Paginated<T> {
  return { items, meta: { page, limit, total } };
}

export function toPaginated<T>(items: T[], total: number, query: { page: number; limit: number }): Paginated<T> {
  return { items, meta: { page:query.page, limit:query.limit, total } };
}


