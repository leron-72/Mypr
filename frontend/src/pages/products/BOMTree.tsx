import React, { useState } from "react";
import { ChevronRight, ChevronDown, Package, Trash2 } from "lucide-react";
import type { BOMTreeNode } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface BOMTreeNodeProps {
  node: BOMTreeNode;
  depth?: number;
  onDelete?: (itemId: number) => void;
  canWrite?: boolean;
}

function BOMTreeNodeComponent({ node, depth = 0, onDelete, canWrite }: BOMTreeNodeProps) {
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
        {/* Expand toggle */}
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

        <Package size={16} className="text-gray-400 flex-shrink-0" />

        <code className="text-blue-600 font-mono text-sm font-medium">
          {node.child_part_number}
        </code>

        <span className="text-gray-700 text-sm flex-1">{node.child_name}</span>

        <div className="flex items-center gap-2">
          <Badge variant="default">
            {node.quantity} {node.unit || "pcs"}
          </Badge>
          {node.is_optional && (
            <Badge variant="warning">optional</Badge>
          )}
        </div>

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
            <BOMTreeNodeComponent
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

interface BOMTreeProps {
  nodes: BOMTreeNode[];
  onDelete?: (itemId: number) => void;
  canWrite?: boolean;
}

export function BOMTree({ nodes, onDelete, canWrite }: BOMTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Package size={48} className="mx-auto mb-3 opacity-30" />
        <p>No BOM items. Add components to build the bill of materials.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <BOMTreeNodeComponent
          key={node.id}
          node={node}
          onDelete={onDelete}
          canWrite={canWrite}
        />
      ))}
    </div>
  );
}
