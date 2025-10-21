import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export function Reports() {
  const stats = useQuery(api.reports.getStats);

  if (!stats) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const debtByStatusData = {
    labels: Object.keys(stats.debtByStatus),
    datasets: [
      {
        label: "Debt by Status",
        data: Object.values(stats.debtByStatus),
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const paymentOverTimeData = {
    labels: stats.paymentsOverTime.map(p => p.date),
    datasets: [
      {
        label: 'Payments Over Time',
        data: stats.paymentsOverTime.map(p => p.amount),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Debt by Status</h3>
        <Pie data={debtByStatusData} />
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Payments Over Time</h3>
        <Bar data={paymentOverTimeData} />
      </div>
    </div>
  );
}
