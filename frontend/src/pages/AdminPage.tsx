import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Trash2, Shield } from "lucide-react";
import { apiClient } from "@/api/client";
import { authApi, type RegisterParams } from "@/api/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/authStore";
import { Navigate } from "react-router-dom";
import type { User, UserRole } from "@/types";
import { formatDate } from "@/lib/utils";

const roleColors: Record<UserRole, "default" | "info" | "success" | "warning" | "error"> = {
  admin: "error",
  engineer: "info",
  production: "success",
  accounting: "warning",
  viewer: "default",
};

export function AdminPage() {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<RegisterParams>({
    email: "",
    username: "",
    password: "",
    role: "viewer",
  });
  const [formError, setFormError] = useState("");

  if (currentUser?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const response = await apiClient.get<User[]>("/api/admin/users");
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setShowCreateModal(false);
      setFormData({ email: "", username: "", password: "", role: "viewer" });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setFormError(err?.response?.data?.detail || "Failed to create user");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiClient.delete(`/api/admin/users/${userId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const handleDelete = (userId: number) => {
    if (confirm("Delete this user?")) {
      deleteMutation.mutate(userId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield size={24} className="text-blue-600" />
            Admin Panel
          </h1>
          <p className="text-gray-500 mt-1">User management</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <UserPlus size={16} /> New User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users ({users?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>ID</TableHeader>
                  <TableHeader>Username</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Role</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Created</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {users?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-gray-400 text-xs">{u.id}</TableCell>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell className="text-gray-500">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleColors[u.role] || "default"}>{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.is_active ? "success" : "error"}>
                        {u.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {formatDate(u.created_at)}
                    </TableCell>
                    <TableCell>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-400"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {users?.length === 0 && (
                  <TableRow>
                    <TableCell className="text-center text-gray-400 py-8">
                      No users
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setFormError("");
            createMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <Input
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
            required
          />
          <Input
            label="Username *"
            value={formData.username}
            onChange={(e) => setFormData((d) => ({ ...d, username: e.target.value }))}
            required
          />
          <Input
            label="Password *"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData((d) => ({ ...d, password: e.target.value }))}
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData((d) => ({ ...d, role: e.target.value as UserRole }))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="viewer">Viewer</option>
              <option value="production">Production</option>
              <option value="accounting">Accounting</option>
              <option value="engineer">Engineer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {formError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
