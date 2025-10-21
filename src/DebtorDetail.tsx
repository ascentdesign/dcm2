import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { EmailPreviewModal } from "./EmailPreviewModal";
import { PaymentPlan } from "./PaymentPlan";

export function DebtorDetail({ debtorId, onBack }: { debtorId: Id<"debtors">; onBack: () => void }) {
  const debtor = useQuery(api.debtors.get, { debtorId });
  const communications = useQuery(api.communications.listForDebtor, { debtorId });
  const updateStatus = useMutation(api.debtors.updateStatus);
  const sendEmail = useMutation(api.debtors.sendEmail);
  const [editingStatus, setEditingStatus] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [emailPreviewDebtor, setEmailPreviewDebtor] = useState<any | null>(null);

  if (!debtor) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSavePayment = async (status: "paid" | "partial") => {
    try {
      await updateStatus({
        debtorId,
        status,
        amountPaid: parseFloat(amountPaid),
      });
      toast.success("Payment recorded");
      setEditingStatus(false);
      setAmountPaid("");
    } catch (error) {
      toast.error("Failed to record payment");
      console.error(error);
    }
  };

  const handleSendEmail = async () => {
    try {
      await sendEmail({ debtorId });
      toast.success("Email sent successfully");
    } catch (error) {
      toast.error("Failed to send email");
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "partial": return "bg-yellow-100 text-yellow-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 text-sm text-blue-600 hover:underline">
          &larr; Back to all debtors
        </button>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{debtor.name}</h1>
              <p className="text-gray-600">{debtor.email}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(debtor.status)}`}>
              {debtor.status}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="text-gray-500">Total Debt</div>
              <div className="text-lg font-semibold text-gray-800">${debtor.debtAmount.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-500">Amount Paid</div>
              <div className="text-lg font-semibold text-green-600">${(debtor.amountPaid ?? 0).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-500">Outstanding</div>
              <div className="text-lg font-semibold text-orange-600">${(debtor.debtAmount - (debtor.amountPaid ?? 0)).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-500">Due Date</div>
              <div className="text-lg font-medium text-gray-800">{format(new Date(debtor.paymentDueDate), "MMM dd, yyyy")}</div>
            </div>
            {debtor.notes && (
              <div className="md:col-span-2">
                <div className="text-gray-500">Notes</div>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-md">{debtor.notes}</p>
              </div>
            )}
          </div>

          <div className="mt-6 border-t pt-6 flex items-center gap-4">
            {editingStatus ? (
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="Amount Paid"
                  className="w-32 px-3 py-2 border rounded-lg text-sm"
                />
                <button onClick={() => handleSavePayment("partial")} className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                  Save Partial
                </button>
                <button onClick={() => handleSavePayment("paid")} className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600">
                  Save as Paid
                </button>
                <button onClick={() => setEditingStatus(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setEditingStatus(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                Record Payment
              </button>
            )}
            <button
              onClick={() => setEmailPreviewDebtor(debtor)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100 font-semibold flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Send Email
            </button>
          </div>
        </div>

        <PaymentPlan debtorId={debtorId} />

        <AddCommunicationForm debtorId={debtorId} />

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Communication History</h2>
          <div className="space-y-6">
            {communications?.map((comm) => (
              <CommunicationItem key={comm._id} communication={comm} />
            ))}
            {communications?.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No communications logged yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {emailPreviewDebtor && (
        <EmailPreviewModal
          debtor={emailPreviewDebtor}
          onClose={() => setEmailPreviewDebtor(null)}
          onSend={async () => {
            await handleSendEmail();
            setEmailPreviewDebtor(null);
          }}
        />
      )}
    </>
  );
}

function AddCommunicationForm({ debtorId }: { debtorId: Id<"debtors"> }) {
  const [type, setType] = useState<"call" | "email" | "note" | "letter">("note");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateUploadUrl = useMutation(api.communications.generateUploadUrl);
  const addCommunication = useMutation(api.communications.add);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) {
      toast.error("Please enter some content for the communication log.");
      return;
    }
    setIsSubmitting(true);

    try {
      let fileId;
      if (file) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const json = await result.json();
        if (!result.ok) {
          throw new Error(`Upload failed: ${JSON.stringify(json)}`);
        }
        fileId = json.storageId;
      }

      await addCommunication({
        debtorId,
        type,
        content,
        fileId,
        fileName: file?.name,
      });

      toast.success("Communication logged successfully");
      setContent("");
      setFile(null);
    } catch (error) {
      toast.error("Failed to log communication");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Log a Communication</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="note">Note</option>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="letter">Letter</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            placeholder="Log call details, summary of email, etc."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Attach File (Optional)</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold disabled:opacity-50"
        >
          {isSubmitting ? "Logging..." : "Add Log Entry"}
        </button>
      </form>
    </div>
  );
}

function CommunicationItem({ communication }: { communication: any }) {
  const getIcon = (type: string) => {
    switch (type) {
      case "call": return "📞";
      case "email": return "📧";
      case "letter": return "📄";
      default: return "📝";
    }
  };

  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
        {getIcon(communication.type)}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center">
          <div className="text-sm">
            <span className="font-semibold text-gray-800">{communication.author}</span>
            <span className="text-gray-600"> logged a {communication.type}</span>
          </div>
          <span className="text-xs text-gray-500">
            {format(new Date(communication._creationTime), "MMM dd, yyyy h:mm a")}
          </span>
        </div>
        <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
          <p className="text-gray-800 whitespace-pre-wrap">{communication.content}</p>
          {communication.fileUrl && (
            <div className="mt-3 pt-3 border-t">
              <a
                href={communication.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {communication.fileName ?? "Download Attachment"}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
