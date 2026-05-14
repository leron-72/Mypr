import { apiClient } from "./client";
import type { Token, User, UserRole } from "@/types";

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  username: string;
  password: string;
  role: UserRole;
}

export const authApi = {
  login: async (params: LoginParams): Promise<Token> => {
    const formData = new URLSearchParams();
    formData.append("username", params.username);
    formData.append("password", params.password);
    const response = await apiClient.post<Token>("/api/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return response.data;
  },

  register: async (params: RegisterParams): Promise<User> => {
    const response = await apiClient.post<User>("/api/auth/register", params);
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get<User>("/api/auth/me");
    return response.data;
  },
};
