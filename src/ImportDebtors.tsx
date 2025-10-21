import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export function ImportDebtors({ onSuccess }: { onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const importDebtors = useMutation(api.debtors.importDebtors);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file to import.");
      return;
    }
    setIsSubmitting(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);

          const debtorsToImport = json.map((row: any) => ({
            name: row.name,
            email: row.email,
            debtAmount: parseFloat(row.debtAmount),
            paymentDueDate: new Date(row.paymentDueDate).getTime(),
            notes: row.notes,
          }));

          await importDebtors({ debtors: debtorsToImport });
          toast.success("Debtors imported successfully");
          onSuccess();
        } catch (error) {
          toast.error("Failed to parse or import file.");
          console.error(error);
        } finally {
          setIsSubmitting(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      toast.error("Failed to read file.");
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Import Debtors</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload File
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />
          <p className="text-xs text-gray-500 mt-1">
            File should have columns: name, email, debtAmount, paymentDueDate (YYYY-MM-DD), notes (optional)
          </p>
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !file}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
        >
          {isSubmitting ? "Importing..." : "Import Debtors"}
        </button>
      </form>
    </div>
  );
}
