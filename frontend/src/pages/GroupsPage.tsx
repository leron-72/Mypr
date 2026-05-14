import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FolderTree, ChevronRight, ChevronDown, Trash2, Edit } from "lucide-react";
import { groupsApi, type GroupCreate } from "@/api/groups";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/authStore";
import type { ProductGroupTree } from "@/types";
import { cn } from "@/lib/utils";

interface TreeNodeProps {
  node: ProductGroupTree;
  depth?: number;
  onDelete?: (id: number) => void;
  canWrite?: boolean;
}

function TreeNode({ node, depth = 0, onDelete, canWrite }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg group",
          depth > 0 && "ml-6"
        )}
      >
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400"
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : (
            <span className="w-4" />
          )}
        </button>

        <FolderTree size={16} className="text-indigo-500 flex-shrink-0" />

        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">
          {node.code}
        </code>

        <span className="text-gray-800 text-sm flex-1">{node.name}</span>

        {node.description && (
          <span className="text-xs text-gray-400 truncate max-w-48">{node.description}</span>
        )}

        {canWrite && onDelete && (
          <button
            onClick={() => onDelete(node.id)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-400 transition-opacity"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="border-l border-gray-200 ml-8">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onDelete={onDelete}
              canWrite={canWrite}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function GroupsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canWrite = user?.role === "admin" || user?.role === "engineer";

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<GroupCreate>({
    name: "",
    code: "",
    parent_id: null,
    description: "",
  });
  const [formError, setFormError] = useState("");

  const { data: tree, isLoading } = useQuery({
    queryKey: ["groups-tree"],
    queryFn: () => groupsApi.tree(),
  });

  const { data: flatGroups } = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: GroupCreate) => groupsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups-tree"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setShowCreateModal(false);
      setFormData({ name: "", code: "", parent_id: null, description: "" });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setFormError(err?.response?.data?.detail || "Failed to create group");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: groupsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups-tree"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Delete this group?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Groups</h1>
          <p className="text-gray-500 mt-1">Hierarchical classification of products</p>
        </div>
        {canWrite && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> New Group
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Group Tree</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : tree && tree.length > 0 ? (
            <div className="space-y-1">
              {tree.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  onDelete={handleDelete}
                  canWrite={canWrite}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <FolderTree size={48} className="mx-auto mb-3 opacity-30" />
              <p>No groups yet. Create one to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="New Product Group"
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
            label="Name *"
            value={formData.name}
            onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
            required
          />
          <Input
            label="Code *"
            value={formData.code}
            onChange={(e) => setFormData((d) => ({ ...d, code: e.target.value.toUpperCase() }))}
            placeholder="EG. ELECTRONICS"
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Parent Group</label>
            <select
              value={formData.parent_id ?? ""}
              onChange={(e) =>
                setFormData((d) => ({
                  ...d,
                  parent_id: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No parent (root group)</option>
              {flatGroups?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((d) => ({ ...d, description: e.target.value }))}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
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
              Create Group
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
