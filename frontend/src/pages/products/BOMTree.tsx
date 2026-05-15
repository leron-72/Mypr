import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronDown, Package, Trash2, ExternalLink } from "lucide-react";
import type { BOMTreeNode } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const DEPTH_STYLES = [
  { border: "border-blue-400",   bg: "bg-blue-50/60",   text: "text-blue-700",   label: "bg-blue-100 text-blue-600" },
  { border: "border-violet-400", bg: "bg-violet-50/60", text: "text-violet-700", label: "bg-violet-100 text-violet-600" },
  { border: "border-emerald-400",bg: "bg-emerald-50/60",text: "text-emerald-700",label: "bg-emerald-100 text-emerald-600" },
  { border: "border-amber-400",  bg: "bg-amber-50/60",  text: "text-amber-700",  label: "bg-amber-100 text-amber-600" },
];

function depthStyle(depth: number) {
  return DEPTH_STYLES[Math.min(depth, DEPTH_STYLES.length - 1)];
}

interface BOMTreeNodeProps {
  node: BOMTreeNode;
  depth?: number;
  onDelete?: (itemId: number) => void;
  canWrite?: boolean;
}

function BOMTreeNodeComponent({ node, depth = 0, onDelete, canWrite }: BOMTreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const ds = depthStyle(depth);

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-lg group border-l-4 transition-colors",
          ds.border,
          ds.bg,
          "hover:brightness-95"
        )}
        style={{ marginLeft: depth * 24 }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : (
            <span className="w-4" />
          )}
        </button>

        <Package size={15} className={cn("flex-shrink-0", ds.text)} />

        {/* Part number + link icon */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <code className={cn("font-mono text-sm font-semibold", ds.text)}>
            {node.child_part_number}
          </code>
          <Link
            to={`/products/${node.child_product_id}`}
            className={cn("opacity-0 group-hover:opacity-100 transition-opacity", ds.text)}
            title="Відкрити картку компонента"
          >
            <ExternalLink size={13} />
          </Link>
        </div>

        <span className="text-gray-800 text-sm flex-1 truncate">{node.child_name}</span>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", ds.label)}>
            {node.quantity} {node.unit || "шт"}
          </span>
          {node.is_optional && (
            <Badge variant="warning">optional</Badge>
          )}
        </div>

        {canWrite && onDelete && (
          <button
            onClick={() => onDelete(node.id)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-400 transition-opacity"
            title="Видалити"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="mt-1 space-y-1">
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
        <p>Немає компонентів. Додайте складові до специфікації.</p>
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
