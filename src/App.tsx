import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { DebtorsList } from "./DebtorsList";
import { AddDebtorForm } from "./AddDebtorForm";
import { ImportDebtors } from "./ImportDebtors";
import { Stats } from "./Stats";
import { ScheduledEmailsView } from "./ScheduledEmailsView";
import { DebtorDetail } from "./DebtorDetail";
import { useState, useEffect } from "react";
import type { Id } from "../convex/_generated/dataModel";
import { Reports } from "./Reports";

export default function App() {
  const [menuCollapsed, setMenuCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMenuCollapsed(!menuCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-primary">Debt Collection Manager</h2>
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1 flex">
        <Content menuCollapsed={menuCollapsed} setMenuCollapsed={setMenuCollapsed} />
      </main>
      <Toaster />
    </div>
  );
}

function Content({ menuCollapsed, setMenuCollapsed }: { menuCollapsed: boolean; setMenuCollapsed: (collapsed: boolean) => void }) {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const initializeDemoData = useMutation(api.debtors.initializeDemoData);

  useEffect(() => {
    if (loggedInUser) {
      initializeDemoData();
    }
  }, [loggedInUser, initializeDemoData]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [activeTab, setActiveTab] = useState<"debtors" | "scheduled" | "reports">("debtors");
  const [selectedDebtorId, setSelectedDebtorId] = useState<Id<"debtors"> | null>(null);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Unauthenticated>
        <div className="max-w-md mx-auto w-full p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">Debt Collection Manager</h1>
            <p className="text-xl text-secondary">Sign in to manage your debtors</p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>

      <Authenticated>
        {/* Sidebar */}
        <aside
          className={`bg-white border-r shadow-sm transition-all duration-300 ${
            menuCollapsed ? "w-20" : "w-64"
          } fixed top-0 left-0 h-screen pt-16 z-10`}
        >
          <nav className="p-4 space-y-2">
            <button
              onClick={() => {
                setActiveTab("debtors");
                setSelectedDebtorId(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "debtors"
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              title="Debtors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {!menuCollapsed && <span className="font-semibold">Debtors</span>}
            </button>

            <button
              onClick={() => {
                setActiveTab("scheduled");
                setSelectedDebtorId(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "scheduled"
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              title="Scheduled Emails"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {!menuCollapsed && <span className="font-semibold">Scheduled Emails</span>}
            </button>

            <button
              onClick={() => {
                setActiveTab("reports");
                setSelectedDebtorId(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "reports"
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              title="Reports"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              {!menuCollapsed && <span className="font-semibold">Reports</span>}
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <div className={`flex-1 overflow-auto transition-all duration-300 ${menuCollapsed ? "ml-20" : "ml-64"}`}>
          <div className="p-8">
            {selectedDebtorId ? (
              <DebtorDetail
                debtorId={selectedDebtorId}
                onBack={() => setSelectedDebtorId(null)}
              />
            ) : (
              <>
                <div className="max-w-7xl mx-auto w-full">
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-primary mb-2">
                      {activeTab === "debtors" && "Debt Collection Dashboard"}
                      {activeTab === "scheduled" && "Scheduled Emails"}
                      {activeTab === "reports" && "Reports & Analytics"}
                    </h1>
                    <p className="text-secondary">
                      {activeTab === "debtors" && "Manage debtors and automate payment reminders"}
                      {activeTab === "scheduled" && "View and manage scheduled email campaigns"}
                      {activeTab === "reports" && "View insights and analytics"}
                    </p>
                  </div>

                  {activeTab === "debtors" && <Stats />}

                  {activeTab === "debtors" && (
                    <>
                      <div className="flex gap-4 mb-6">
                        <button
                          onClick={() => {
                            setShowAddForm(!showAddForm);
                            setShowImport(false);
                          }}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-semibold"
                        >
                          {showAddForm ? "Cancel" : "Add Debtor"}
                        </button>
                        <button
                          onClick={() => {
                            setShowImport(!showImport);
                            setShowAddForm(false);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        >
                          {showImport ? "Cancel" : "Import File"}
                        </button>
                      </div>

                      {showAddForm && (
                        <div className="mb-6">
                          <AddDebtorForm onSuccess={() => setShowAddForm(false)} />
                        </div>
                      )}

                      {showImport && (
                        <div className="mb-6">
                          <ImportDebtors onSuccess={() => setShowImport(false)} />
                        </div>
                      )}

                      <DebtorsList onSelectDebtor={setSelectedDebtorId} />
                    </>
                  )}

                  {activeTab === "scheduled" && <ScheduledEmailsView />}
                  {activeTab === "reports" && <Reports />}
                </div>
              </>
            )}
          </div>
        </div>
      </Authenticated>
    </>
  );
}
