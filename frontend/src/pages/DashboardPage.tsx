import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, FolderTree, Clock, TrendingUp } from "lucide-react";
import { productsApi } from "@/api/products";
import { groupsApi } from "@/api/groups";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/utils";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="text-white" size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products", { page: 1, size: 5 }],
    queryFn: () => productsApi.list({ page: 1, size: 5 }),
  });

  const { data: allProducts } = useQuery({
    queryKey: ["products-count"],
    queryFn: () => productsApi.list({ page: 1, size: 1 }),
  });

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupsApi.list(),
  });

  const activeCount = 0; // Could be fetched separately

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of the nomenclature system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="Total Products"
          value={allProducts?.total ?? "—"}
          color="bg-blue-500"
        />
        <StatCard
          icon={FolderTree}
          label="Product Groups"
          value={groups?.length ?? "—"}
          color="bg-indigo-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Active Products"
          value={activeCount}
          color="bg-green-500"
        />
        <StatCard
          icon={Clock}
          label="Recent Changes"
          value="—"
          color="bg-orange-500"
        />
      </div>

      {/* Recent Products */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Products</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {productsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Part Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products?.items.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-blue-600 font-medium">
                      {p.part_number}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{p.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {formatDate(p.updated_at)}
                    </td>
                  </tr>
                ))}
                {products?.items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                      No products yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
