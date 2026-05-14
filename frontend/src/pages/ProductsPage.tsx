import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Download, Trash2, Eye } from "lucide-react";
import { productsApi } from "@/api/products";
import { groupsApi } from "@/api/groups";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { ProductForm } from "./products/ProductForm";
import { useAuthStore } from "@/store/authStore";
import type { ProductStatus } from "@/types";
import { formatDate } from "@/lib/utils";

export function ProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canWrite = user?.role === "admin" || user?.role === "engineer";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "">("");
  const [groupFilter, setGroupFilter] = useState<number | "">("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["products", { page, size: 20, search, status: statusFilter || undefined, group_id: groupFilter || undefined }],
    queryFn: () =>
      productsApi.list({
        page,
        size: 20,
        search: search || undefined,
        status: (statusFilter as ProductStatus) || undefined,
        group_id: (groupFilter as number) || undefined,
      }),
  });

  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupsApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage product nomenclature</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/export/products/csv"
            download
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download size={16} />
            Export CSV
          </a>
          {canWrite && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              New Product
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="px-4 py-3 flex flex-wrap gap-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
            <Input
              placeholder="Search by name, part number..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="outline" size="md">
              <Search size={16} />
            </Button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as ProductStatus | ""); setPage(1); }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="obsolete">Obsolete</option>
          </select>

          <select
            value={groupFilter}
            onChange={(e) => { setGroupFilter(e.target.value ? Number(e.target.value) : ""); setPage(1); }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">All groups</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.code})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Part Number</TableHeader>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Unit</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Updated</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.items.map((product) => (
                  <TableRow
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <TableCell>
                      <code className="text-blue-600 font-mono font-medium">
                        {product.part_number}
                      </code>
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.unit || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={product.status} />
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {formatDate(product.updated_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.id}`); }}
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-500"
                        >
                          <Eye size={15} />
                        </button>
                        {canWrite && (
                          <button
                            onClick={(e) => handleDelete(product.id, e)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-400"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {data?.items.length === 0 && (
                  <TableRow>
                    <TableCell className="text-center text-gray-400 py-12 col-span-6">
                      <span className="block col-span-6">No products found</span>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {data && data.total > 0 && (
              <Pagination
                page={data.page}
                pages={data.pages}
                total={data.total}
                size={data.size}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="New Product"
        className="max-w-2xl"
      >
        <ProductForm
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ["products"] });
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
}
