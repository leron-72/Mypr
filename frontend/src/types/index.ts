export type UserRole = "admin" | "engineer" | "production" | "accounting" | "viewer";
export type ProductStatus = "draft" | "active" | "obsolete";
export type VersionType = "minor" | "major";

export interface User {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  deleted_at?: string | null;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ProductGroup {
  id: number;
  name: string;
  code: string;
  parent_id?: number | null;
  description?: string | null;
  created_at: string;
  deleted_at?: string | null;
}

export interface ProductGroupTree extends ProductGroup {
  children: ProductGroupTree[];
}

export interface Product {
  id: number;
  part_number: string;
  name: string;
  description?: string | null;
  group_id?: number | null;
  unit?: string | null;
  weight?: string | null;
  material?: string | null;
  status: ProductStatus;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ProductCreate {
  part_number: string;
  name: string;
  description?: string;
  group_id?: number;
  unit?: string;
  weight?: string;
  material?: string;
  status?: ProductStatus;
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  group_id?: number | null;
  unit?: string;
  weight?: string | null;
  material?: string;
  status?: ProductStatus;
}

export interface ProductVersion {
  id: number;
  product_id: number;
  version_type: VersionType;
  version_number: string;
  revision_letter?: string | null;
  changes_description?: string | null;
  approved_by?: number | null;
  approved_at?: string | null;
  created_by?: number | null;
  created_at: string;
}

export interface BOMItem {
  id: number;
  parent_product_id: number;
  child_product_id: number;
  quantity: string;
  unit?: string | null;
  is_optional: boolean;
  notes?: string | null;
  version_id?: number | null;
  created_at: string;
  deleted_at?: string | null;
}

export interface BOMTreeNode {
  id: number;
  parent_product_id: number;
  child_product_id: number;
  child_part_number: string;
  child_name: string;
  quantity: string;
  unit?: string | null;
  is_optional: boolean;
  notes?: string | null;
  children: BOMTreeNode[];
}

export interface BOMItemCreate {
  child_product_id: number;
  quantity: string;
  unit?: string;
  is_optional?: boolean;
  notes?: string;
  version_id?: number;
}

export interface FileAttachment {
  id: number;
  product_id: number;
  filename: string;
  file_path: string;
  file_size?: number | null;
  mime_type?: string | null;
  uploaded_by?: number | null;
  created_at: string;
}

export interface ChangeLog {
  id: number;
  product_id: number;
  user_id?: number | null;
  action: string;
  field_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  search?: string;
  group_id?: number;
  status?: ProductStatus;
}
