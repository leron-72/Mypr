import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit, Trash2, Plus, Upload, X } from "lucide-react";
import { productsApi } from "@/api/products";
import { bomApi } from "@/api/bom";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { BOMTree } from "./products/BOMTree";
import { ProductForm } from "./products/ProductForm";
import { useAuthStore } from "@/store/authStore";
import { formatDate, formatFileSize } from "@/lib/utils";
import type { BOMItemCreate } from "@/types";
import { Input } from "@/components/ui/Input";

type Tab = "info" | "bom" | "files" | "versions" | "history";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canWrite = user?.role === "admin" || user?.role === "engineer";
  const productId = Number(id);

  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddBOMModal, setShowAddBOMModal] = useState(false);
  const [bomForm, setBOMForm] = useState({ child_product_id: "", quantity: "1", unit: "", is_optional: false });

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productsApi.get(productId),
  });

  const { data: bomTree } = useQuery({
    queryKey: ["bom", productId],
    queryFn: () => bomApi.getTree(productId),
    enabled: activeTab === "bom",
  });

  const { data: files } = useQuery({
    queryKey: ["files", productId],
    queryFn: () => productsApi.files(productId),
    enabled: activeTab === "files",
  });

  const { data: versions } = useQuery({
    queryKey: ["versions", productId],
    queryFn: () => productsApi.versions(productId),
    enabled: activeTab === "versions",
  });

  const { data: history } = useQuery({
    queryKey: ["history", productId],
    queryFn: () => productsApi.history(productId),
    enabled: activeTab === "history",
  });

  const deleteMutation = useMutation({
    mutationFn: () => productsApi.delete(productId),
    onSuccess: () => navigate("/products"),
  });

  const addBOMMutation = useMutation({
    mutationFn: (data: BOMItemCreate) => bomApi.addItem(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bom", productId] });
      setShowAddBOMModal(false);
      setBOMForm({ child_product_id: "", quantity: "1", unit: "", is_optional: false });
    },
  });

  const deleteBOMMutation = useMutation({
    mutationFn: bomApi.deleteItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bom", productId] }),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => productsApi.uploadFile(productId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files", productId] }),
  });

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: number) =>
      import("@/api/client").then(({ apiClient }) => apiClient.delete(`/api/files/${fileId}`)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files", productId] }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p>Product not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/products")}>
          Back to products
        </Button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "info", label: "Info" },
    { key: "bom", label: "Bill of Materials" },
    { key: "files", label: "Files" },
    { key: "versions", label: "Versions" },
    { key: "history", label: "History" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/products")}>
          <ArrowLeft size={16} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <code className="text-2xl font-mono font-bold text-blue-600">
              {product.part_number}
            </code>
            <StatusBadge status={product.status} />
          </div>
          <h1 className="text-lg text-gray-700 mt-0.5">{product.name}</h1>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
              <Edit size={15} />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => confirm("Delete this product?") && deleteMutation.mutate()}
            >
              <Trash2 size={15} />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "info" && (
        <Card>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase">Part Number</dt>
                <dd className="mt-1 font-mono text-blue-600 font-medium">{product.part_number}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase">Status</dt>
                <dd className="mt-1"><StatusBadge status={product.status} /></dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs font-semibold text-gray-500 uppercase">Name</dt>
                <dd className="mt-1 text-gray-800">{product.name}</dd>
              </div>
              {product.description && (
                <div className="col-span-2">
                  <dt className="text-xs font-semibold text-gray-500 uppercase">Description</dt>
                  <dd className="mt-1 text-gray-700">{product.description}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase">Unit</dt>
                <dd className="mt-1 text-gray-700">{product.unit || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase">Weight</dt>
                <dd className="mt-1 text-gray-700">{product.weight ? `${product.weight} kg` : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase">Material</dt>
                <dd className="mt-1 text-gray-700">{product.material || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase">Group ID</dt>
                <dd className="mt-1 text-gray-700">{product.group_id || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase">Created</dt>
                <dd className="mt-1 text-gray-500 text-sm">{formatDate(product.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase">Updated</dt>
                <dd className="mt-1 text-gray-500 text-sm">{formatDate(product.updated_at)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {activeTab === "bom" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Bill of Materials</CardTitle>
              {canWrite && (
                <Button size="sm" onClick={() => setShowAddBOMModal(true)}>
                  <Plus size={15} /> Add Component
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {bomTree ? (
              <BOMTree
                nodes={bomTree}
                onDelete={(itemId) => confirm("Remove this BOM item?") && deleteBOMMutation.mutate(itemId)}
                canWrite={canWrite}
              />
            ) : (
              <Spinner />
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "files" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>File Attachments</CardTitle>
              {canWrite && (
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">
                  <Upload size={15} /> Upload
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) uploadMutation.mutate(e.target.files[0]);
                    }}
                  />
                </label>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {files && files.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Filename</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Uploaded</th>
                    {canWrite && <th className="px-4 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {files.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-blue-600">{f.filename}</td>
                      <td className="px-4 py-3 text-gray-500">{f.mime_type || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{formatFileSize(f.file_size)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(f.created_at)}</td>
                      {canWrite && (
                        <td className="px-4 py-3">
                          <button
                            onClick={() => confirm("Delete this file?") && deleteFileMutation.mutate(f.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <X size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-400">No files attached</div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "versions" && (
        <Card>
          <CardHeader>
            <CardTitle>Version History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {versions && versions.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Version</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Revision</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Changes</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {versions.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{v.version_number}</td>
                      <td className="px-4 py-3 capitalize">{v.version_type}</td>
                      <td className="px-4 py-3">{v.revision_letter || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{v.changes_description || "—"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(v.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-400">No versions recorded</div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle>Change Log</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {history && history.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Field</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Old Value</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">New Value</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 capitalize font-medium">{log.action}</td>
                      <td className="px-4 py-3 text-gray-500">{log.field_name || "—"}</td>
                      <td className="px-4 py-3 text-red-500 text-xs">{log.old_value || "—"}</td>
                      <td className="px-4 py-3 text-green-600 text-xs">{log.new_value || "—"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-400">No changes recorded</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Product"
        className="max-w-2xl"
      >
        <ProductForm
          product={product}
          onSuccess={(updated) => {
            queryClient.setQueryData(["product", productId], updated);
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setShowEditModal(false);
          }}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Add BOM Modal */}
      <Modal
        isOpen={showAddBOMModal}
        onClose={() => setShowAddBOMModal(false)}
        title="Add BOM Component"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addBOMMutation.mutate({
              child_product_id: Number(bomForm.child_product_id),
              quantity: bomForm.quantity,
              unit: bomForm.unit || undefined,
              is_optional: bomForm.is_optional,
            });
          }}
          className="space-y-4"
        >
          <Input
            label="Child Product ID"
            type="number"
            value={bomForm.child_product_id}
            onChange={(e) => setBOMForm((f) => ({ ...f, child_product_id: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              step="0.0001"
              value={bomForm.quantity}
              onChange={(e) => setBOMForm((f) => ({ ...f, quantity: e.target.value }))}
              required
            />
            <Input
              label="Unit"
              value={bomForm.unit}
              onChange={(e) => setBOMForm((f) => ({ ...f, unit: e.target.value }))}
              placeholder="pcs"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={bomForm.is_optional}
              onChange={(e) => setBOMForm((f) => ({ ...f, is_optional: e.target.checked }))}
            />
            Optional component
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddBOMModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={addBOMMutation.isPending}>
              Add
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
