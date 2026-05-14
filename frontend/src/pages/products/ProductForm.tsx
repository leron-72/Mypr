import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { productsApi } from "@/api/products";
import { groupsApi } from "@/api/groups";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Product, ProductCreate, ProductUpdate, ProductStatus } from "@/types";

const PART_NUMBER_REGEX = /^\d{3}\.(0[1-9]|[12]\d|30)\.\d{4}$/;

interface ProductFormProps {
  product?: Product;
  onSuccess: (product: Product) => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const isEdit = !!product;

  const [formData, setFormData] = useState({
    part_number: product?.part_number ?? "",
    name: product?.name ?? "",
    description: product?.description ?? "",
    group_id: product?.group_id?.toString() ?? "",
    unit: product?.unit ?? "",
    weight: product?.weight ?? "",
    material: product?.material ?? "",
    status: (product?.status ?? "draft") as ProductStatus,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: ProductCreate) => productsApi.create(data),
    onSuccess,
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProductUpdate) => productsApi.update(product!.id, data),
    onSuccess,
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEdit) {
      if (!formData.part_number) {
        newErrors.part_number = "Part number is required";
      } else if (!PART_NUMBER_REGEX.test(formData.part_number)) {
        newErrors.part_number =
          "Format: NNN.CC.SSSS (NNN=000-129, CC=01-30, SSSS=0001-9999)";
      } else {
        const parts = formData.part_number.split(".");
        if (parseInt(parts[0]) > 129) {
          newErrors.part_number = "NNN must be 000-129";
        }
      }
    }

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEdit) {
      updateMutation.mutate({
        name: formData.name,
        description: formData.description || undefined,
        group_id: formData.group_id ? Number(formData.group_id) : null,
        unit: formData.unit || undefined,
        weight: formData.weight || null,
        material: formData.material || undefined,
        status: formData.status,
      });
    } else {
      createMutation.mutate({
        part_number: formData.part_number,
        name: formData.name,
        description: formData.description || undefined,
        group_id: formData.group_id ? Number(formData.group_id) : undefined,
        unit: formData.unit || undefined,
        weight: formData.weight || undefined,
        material: formData.material || undefined,
        status: formData.status,
      });
    }
  };

  const loading = createMutation.isPending || updateMutation.isPending;
  const apiError = (createMutation.error || updateMutation.error) as { response?: { data?: { detail?: string } } } | null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEdit && (
        <Input
          label="Part Number *"
          value={formData.part_number}
          onChange={(e) => setFormData((d) => ({ ...d, part_number: e.target.value }))}
          placeholder="042.12.0001"
          error={errors.part_number}
        />
      )}

      <Input
        label="Name *"
        value={formData.name}
        onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
        placeholder="Product name"
        error={errors.name}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData((d) => ({ ...d, description: e.target.value }))}
          placeholder="Product description"
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Group</label>
          <select
            value={formData.group_id}
            onChange={(e) => setFormData((d) => ({ ...d, group_id: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No group</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.code})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData((d) => ({ ...d, status: e.target.value as ProductStatus }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="obsolete">Obsolete</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Unit"
          value={formData.unit}
          onChange={(e) => setFormData((d) => ({ ...d, unit: e.target.value }))}
          placeholder="pcs, kg, m"
        />
        <Input
          label="Weight"
          type="number"
          step="0.0001"
          value={formData.weight}
          onChange={(e) => setFormData((d) => ({ ...d, weight: e.target.value }))}
          placeholder="0.0000"
        />
        <Input
          label="Material"
          value={formData.material}
          onChange={(e) => setFormData((d) => ({ ...d, material: e.target.value }))}
          placeholder="Steel, Plastic..."
        />
      </div>

      {apiError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {apiError?.response?.data?.detail || "An error occurred"}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
