import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import type { Id } from "../convex/_generated/dataModel";
import { EmailPreviewModal } from "./EmailPreviewModal";
import { BulkEmailModal } from "./BulkEmailModal";

export function DebtorsList({ onSelectDebtor }: { onSelectDebtor: (id: Id<"debtors">) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const debtors = useQuery(api.debtors.list, { searchQuery });
  const sendBulkEmails = useMutation(api.debtors.sendBulkEmails);
  const scheduleEmails = useMutation(api.scheduledEmails.scheduleEmails);
  const [selectedDebtors, setSelectedDebtors] = useState<Set<Id<"debtors">>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);

  if (!debtors) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (debtors.length === 0 && !searchQuery) {
    return (
      <div className="bg-white p-12 rounded-lg shadow text-center">
        <p className="text-gray-500 text-lg">
          No debtors yet. Add your first debtor to get started.
        </p>
      </div>
    );
  }

  const handleBulkSend = async () => {
    try {
      const result = await sendBulkEmails({ debtorIds: Array.from(selectedDebtors) });
      toast.success(`Scheduled ${result.count} emails to be sent`);
      setSelectedDebtors(new Set());
      setShowBulkModal(false);
    } catch (error) {
      toast.error("Failed to send bulk emails");
      console.error(error);
    }
  };

  const handleScheduleBulk = async (scheduledFor: number) => {
    try {
      await scheduleEmails({
        debtorIds: Array.from(selectedDebtors),
        scheduledFor,
      });
      toast.success(`Scheduled ${selectedDebtors.size} emails for ${format(new Date(scheduledFor), "MMM dd, yyyy 'at' h:mm a")}`);
      setSelectedDebtors(new Set());
      setShowBulkModal(false);
    } catch (error) {
      toast.error("Failed to schedule emails");
      console.error(error);
    }
  };

  const toggleSelection = (debtorId: Id<"debtors">) => {
    const newSelection = new Set(selectedDebtors);
    if (newSelection.has(debtorId)) {
      newSelection.delete(debtorId);
    } else {
      newSelection.add(debtorId);
    }
    setSelectedDebtors(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedDebtors.size === debtors.length) {
      setSelectedDebtors(new Set());
    } else {
      setSelectedDebtors(new Set(debtors.map((d) => d._id)));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const selectedDebtorsList = debtors.filter((d) => selectedDebtors.has(d._id));

  return (
    <>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search debtors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>
      {selectedDebtors.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-blue-900">
              {selectedDebtors.size} debtor{selectedDebtors.size !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => setSelectedDebtors(new Set())}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear selection
            </button>
          </div>
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Send Bulk Emails
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedDebtors.size === debtors.length && debtors.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debt Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {debtors.map((debtor) => (
                <tr
                  key={debtor._id}
                  className={`hover:bg-gray-50 cursor-pointer ${selectedDebtors.has(debtor._id) ? "bg-blue-50" : ""}`}
                  onClick={() => onSelectDebtor(debtor._id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedDebtors.has(debtor._id)}
                      onChange={() => toggleSelection(debtor._id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {debtor.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {debtor.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${debtor.debtAmount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(debtor.paymentDueDate), "MMM dd, yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(debtor.status)}`}
                    >
                      {debtor.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showBulkModal && (
        <BulkEmailModal
          debtors={selectedDebtorsList}
          onClose={() => setShowBulkModal(false)}
          onSend={handleBulkSend}
          onSchedule={handleScheduleBulk}
        />
      )}
    </>
  );
}
