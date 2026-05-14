import { apiClient } from "./client";
import type {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductListResponse,
  PaginationParams,
  ChangeLog,
  ProductVersion,
  FileAttachment,
} from "@/types";

export const productsApi = {
  list: async (params: PaginationParams = {}): Promise<ProductListResponse> => {
    const response = await apiClient.get<ProductListResponse>("/api/products", {
      params,
    });
    return response.data;
  },

  get: async (id: number): Promise<Product> => {
    const response = await apiClient.get<Product>(`/api/products/${id}`);
    return response.data;
  },

  create: async (data: ProductCreate): Promise<Product> => {
    const response = await apiClient.post<Product>("/api/products", data);
    return response.data;
  },

  update: async (id: number, data: ProductUpdate): Promise<Product> => {
    const response = await apiClient.put<Product>(`/api/products/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/products/${id}`);
  },

  history: async (id: number): Promise<ChangeLog[]> => {
    const response = await apiClient.get<ChangeLog[]>(`/api/products/${id}/history`);
    return response.data;
  },

  versions: async (id: number): Promise<ProductVersion[]> => {
    const response = await apiClient.get<ProductVersion[]>(`/api/products/${id}/versions`);
    return response.data;
  },

  files: async (id: number): Promise<FileAttachment[]> => {
    const response = await apiClient.get<FileAttachment[]>(`/api/products/${id}/files`);
    return response.data;
  },

  uploadFile: async (id: number, file: File): Promise<FileAttachment> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<FileAttachment>(`/api/products/${id}/files`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  exportCsv: (): string => {
    const token = localStorage.getItem("access_token");
    return `${apiClient.defaults.baseURL || ""}/api/export/products/csv?token=${token}`;
  },
};
