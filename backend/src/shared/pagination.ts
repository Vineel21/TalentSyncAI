export interface PaginationInput {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const toRange = ({ page, limit }: PaginationInput): [number, number] => {
  const from = (page - 1) * limit;
  return [from, from + limit - 1];
};

export const toPaginatedResult = <T>(
  items: T[],
  total: number,
  { page, limit }: PaginationInput,
): PaginatedResult<T> => ({
  items,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
});
