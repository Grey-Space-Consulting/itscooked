export type ApiConfig = {
  baseUrl: string;
};

export type ApiErrorPayload = {
  message?: string;
  error?: string;
  details?: unknown;
};

export type UserProfile = {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
};

export type RecipeSummary = {
  id: string;
  title: string;
  updatedAt: string;
  totalTimeMinutes?: number;
  servings?: number;
};

export type RecipeIngredient = {
  id?: string;
  name: string;
  quantity?: string;
  unit?: string;
  note?: string;
  aisle?: string;
};

export type RecipeStep = {
  order?: number;
  instruction: string;
};

export type RecipeDetail = {
  id: string;
  title: string;
  updatedAt: string;
  summary?: string;
  notes?: string;
  sourceUrl?: string;
  totalTimeMinutes?: number;
  servings?: number;
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
};

export type GroceryListSummary = {
  id: string;
  title: string;
  itemCount: number;
  updatedAt: string;
};

export type GroceryListItem = {
  id?: string;
  name: string;
  quantity?: string;
  unit?: string;
  notes?: string;
  aisle?: string;
  checked?: boolean;
};

export type GroceryList = {
  id: string;
  title: string;
  updatedAt: string;
  items: GroceryListItem[];
};
