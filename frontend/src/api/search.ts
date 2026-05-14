import { apiClient } from "./client";
import type { Product } from "@/types";

export const searchApi = {
  search: async (q: string, limit = 20): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>("/api/search", {
      params: { q, limit },
    });
    return response.data;
  },
};
