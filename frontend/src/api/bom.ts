import { apiClient } from "./client";
import type { BOMTreeNode, BOMItemCreate, BOMItem } from "@/types";

export interface BOMItemUpdate {
  quantity?: string;
  unit?: string | null;
  is_optional?: boolean;
  notes?: string | null;
  version_id?: number | null;
}

export const bomApi = {
  getTree: async (productId: number): Promise<BOMTreeNode[]> => {
    const response = await apiClient.get<BOMTreeNode[]>(`/api/products/${productId}/bom`);
    return response.data;
  },

  addItem: async (productId: number, data: BOMItemCreate): Promise<BOMItem> => {
    const response = await apiClient.post<BOMItem>(`/api/products/${productId}/bom/items`, data);
    return response.data;
  },

  updateItem: async (itemId: number, data: BOMItemUpdate): Promise<BOMItem> => {
    const response = await apiClient.put<BOMItem>(`/api/bom/${itemId}`, data);
    return response.data;
  },

  deleteItem: async (itemId: number): Promise<void> => {
    await apiClient.delete(`/api/bom/${itemId}`);
  },
};
