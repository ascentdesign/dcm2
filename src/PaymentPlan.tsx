import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

export function PaymentPlan({ debtorId }: { debtorId: Id<"debtors"> }) {
  const paymentPlan = useQuery(api.paymentPlans.getForDebtor, { debtorId });
  const createPaymentPlan = useMutation(api.paymentPlans.create);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [installments, setInstallments] = useState(2);
  const [startDate, setStartDate] = useState("");

  const handleCreatePlan = async () => {
    if (!startDate) {
      toast.error("Please select a start date");
      return;
    }
    try {
      await createPaymentPlan({
        debtorId,
        installments,
        startDate: new Date(startDate).getTime(),
      });
      toast.success("Payment plan created");
      setShowCreateForm(false);
    } catch (error) {
      toast.error("Failed to create payment plan");
      console.error(error);
    }
  };

  if (paymentPlan) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Plan</h2>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-gray-500">Installments</div>
              <div className="text-lg font-semibold">{paymentPlan.installments.length}</div>
            </div>
            <div>
              <div className="text-gray-500">Status</div>
              <div className="text-lg font-semibold">{paymentPlan.status}</div>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Installments</h3>
            <ul className="space-y-2">
              {paymentPlan.installments.map((installment, index) => (
                <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                  <div>
                    <span className="font-semibold">Installment {index + 1}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      Due: {format(new Date(installment.dueDate), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div className={`px-2 py-1 text-xs rounded-full ${installment.paid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {installment.paid ? "Paid" : "Unpaid"}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Plan</h2>
      {showCreateForm ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Installments</label>
              <input
                type="number"
                value={installments}
                onChange={(e) => setInstallments(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100">
              Cancel
            </button>
            <button onClick={handleCreatePlan} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Create Plan
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowCreateForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
          Create Payment Plan
        </button>
      )}
    </div>
  );
}
