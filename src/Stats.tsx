import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function Stats() {
  const stats = useQuery(api.debtors.getStats);

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-600 mb-1">Total Debtors</div>
        <div className="text-3xl font-bold text-primary">{stats.total}</div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-600 mb-1">Total Debt</div>
        <div className="text-3xl font-bold text-blue-600">
          ${stats.totalDebt.toFixed(2)}
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-600 mb-1">Total Paid</div>
        <div className="text-3xl font-bold text-green-600">
          ${stats.totalPaid.toFixed(2)}
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-600 mb-1">Outstanding</div>
        <div className="text-3xl font-bold text-orange-600">
          ${stats.totalOutstanding.toFixed(2)}
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-600 mb-1">Overdue</div>
        <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
      </div>
    </div>
  );
}
