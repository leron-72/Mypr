import { apiClient } from "./client";
import type { ProductGroup, ProductGroupTree } from "@/types";

export interface GroupCreate {
  name: string;
  code: string;
  parent_id?: number | null;
  description?: string;
}

export interface GroupUpdate {
  name?: string;
  code?: string;
  parent_id?: number | null;
  description?: string;
}

export const groupsApi = {
  list: async (): Promise<ProductGroup[]> => {
    const response = await apiClient.get<ProductGroup[]>("/api/groups");
    return response.data;
  },

  tree: async (): Promise<ProductGroupTree[]> => {
    const response = await apiClient.get<ProductGroupTree[]>("/api/groups/tree");
    return response.data;
  },

  get: async (id: number): Promise<ProductGroup> => {
    const response = await apiClient.get<ProductGroup>(`/api/groups/${id}`);
    return response.data;
  },

  create: async (data: GroupCreate): Promise<ProductGroup> => {
    const response = await apiClient.post<ProductGroup>("/api/groups", data);
    return response.data;
  },

  update: async (id: number, data: GroupUpdate): Promise<ProductGroup> => {
    const response = await apiClient.put<ProductGroup>(`/api/groups/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/groups/${id}`);
  },
};
