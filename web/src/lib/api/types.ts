export type ApiConfig = {
  baseUrl: string;
};

export type ApiErrorPayload = {
  message?: string;
  error?: string;
  details?: unknown;
};

export type RecipeSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type GroceryListSummary = {
  id: string;
  title: string;
  itemCount: number;
  updatedAt: string;
};
