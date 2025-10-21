import { format } from "date-fns";
import { useState } from "react";

interface BulkEmailModalProps {
  debtors: Array<{
    _id: any;
    name: string;
    email: string;
    debtAmount: number;
    paymentDueDate: number;
    status: "pending" | "overdue" | "paid" | "partial";
    amountPaid?: number;
  }>;
  onClose: () => void;
  onSend: () => void;
  onSchedule: (scheduledFor: number) => void;
}

export function BulkEmailModal({ debtors, onClose, onSend, onSchedule }: BulkEmailModalProps) {
  const [sendOption, setSendOption] = useState<"now" | "schedule">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const overdueCount = debtors.filter((d) => d.status === "overdue").length;
  const pendingCount = debtors.filter((d) => d.status === "pending").length;
  const totalAmount = debtors.reduce((sum, d) => sum + d.debtAmount, 0);

  const handleSubmit = () => {
    if (sendOption === "now") {
      onSend();
    } else {
      if (!scheduleDate || !scheduleTime) {
        alert("Please select both date and time");
        return;
      }
      const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).getTime();
      if (scheduledFor <= Date.now()) {
        alert("Scheduled time must be in the future");
        return;
      }
      onSchedule(scheduledFor);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Bulk Email</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Total Recipients:</span>
                <span className="font-semibold ml-2">{debtors.length}</span>
              </div>
              <div>
                <span className="text-blue-700">Total Amount:</span>
                <span className="font-semibold ml-2">${totalAmount.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-blue-700">Overdue:</span>
                <span className="font-semibold ml-2 text-red-600">{overdueCount}</span>
              </div>
              <div>
                <span className="text-blue-700">Pending:</span>
                <span className="font-semibold ml-2 text-yellow-600">{pendingCount}</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Send Options</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="sendOption"
                  value="now"
                  checked={sendOption === "now"}
                  onChange={(e) => setSendOption(e.target.value as "now")}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-medium">Send Now</div>
                  <div className="text-sm text-gray-500">
                    Emails will be sent immediately
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="sendOption"
                  value="schedule"
                  checked={sendOption === "schedule"}
                  onChange={(e) => setSendOption(e.target.value as "schedule")}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <div className="font-medium">Schedule for Later</div>
                  <div className="text-sm text-gray-500 mb-2">
                    Choose a specific date and time
                  </div>
                  {sendOption === "schedule" && (
                    <div className="flex gap-3 mt-2">
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="px-3 py-2 border rounded-lg text-sm"
                      />
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Recipients ({debtors.length})</h3>
            <div className="max-h-60 overflow-y-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {debtors.map((debtor) => (
                    <tr key={debtor._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{debtor.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{debtor.email}</td>
                      <td className="px-4 py-2 text-sm">${debtor.debtAmount.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            debtor.status === "overdue"
                              ? "bg-red-100 text-red-800"
                              : debtor.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
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

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              {sendOption === "now" ? "Send Now" : "Schedule Emails"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
