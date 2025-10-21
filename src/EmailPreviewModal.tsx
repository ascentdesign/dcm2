import { format } from "date-fns";

interface EmailPreviewModalProps {
  debtor: {
    _id: any;
    name: string;
    email: string;
    debtAmount: number;
    paymentDueDate: number;
    status: "pending" | "overdue" | "paid" | "partial";
    amountPaid?: number;
  };
  onClose: () => void;
  onSend: () => void;
}

export function EmailPreviewModal({ debtor, onClose, onSend }: EmailPreviewModalProps) {
  const now = Date.now();
  const isOverdue = debtor.paymentDueDate < now;
  const daysOverdue = isOverdue
    ? Math.floor((now - debtor.paymentDueDate) / (1000 * 60 * 60 * 24))
    : 0;
  const daysUntilDue = !isOverdue
    ? Math.floor((debtor.paymentDueDate - now) / (1000 * 60 * 60 * 24))
    : 0;

  const subject = isOverdue
    ? `Payment Reminder - ${daysOverdue} Days Overdue`
    : `Payment Reminder - Due in ${daysUntilDue} Days`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Email Preview</h2>
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

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">To:</div>
            <div className="font-medium">{debtor.email}</div>
            <div className="text-sm text-gray-600 mt-2 mb-1">Subject:</div>
            <div className="font-medium">{subject}</div>
          </div>

          <div className="border rounded-lg p-6 bg-white">
            <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
              <h2 style={{ color: isOverdue ? "#dc2626" : "#2563eb" }}>
                {isOverdue ? "Payment Overdue Notice" : "Payment Reminder"}
              </h2>
              <p>Dear {debtor.name},</p>
              <p>
                {isOverdue
                  ? `This is a reminder that your payment is now ${daysOverdue} days overdue.`
                  : `This is a friendly reminder that your payment is due in ${daysUntilDue} days.`}
              </p>
              <div
                style={{
                  backgroundColor: isOverdue ? "#fee2e2" : "#dbeafe",
                  padding: "15px",
                  borderRadius: "5px",
                  margin: "20px 0",
                }}
              >
                <p style={{ margin: "5px 0" }}>
                  <strong>Amount Due:</strong> ${debtor.debtAmount.toFixed(2)}
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Due Date:</strong> {format(new Date(debtor.paymentDueDate), "MMMM dd, yyyy")}
                </p>
                {debtor.amountPaid && (
                  <>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Amount Paid:</strong> ${debtor.amountPaid.toFixed(2)}
                    </p>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Outstanding Balance:</strong> $
                      {(debtor.debtAmount - debtor.amountPaid).toFixed(2)}
                    </p>
                  </>
                )}
              </div>
              <p>
                {isOverdue
                  ? "Please arrange payment as soon as possible to avoid further action."
                  : "Please ensure payment is made by the due date to avoid any late fees or penalties."}
              </p>
              <p>If you have already made this payment, please disregard this notice.</p>
              <p>
                Best regards,
                <br />
                Debt Collection Agency
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={onSend}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Send Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
