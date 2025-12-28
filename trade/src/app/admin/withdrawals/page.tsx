"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { initSatellite, onAuthStateChange, listDocs, getDoc, setDoc, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { WithdrawalRequest, Wallet, InvestorProfile } from "@/schemas";

type User = {
  key: string;
} | null | undefined;

type WithdrawalDoc = Doc<WithdrawalRequest>;

interface WithdrawalWithInvestor extends WithdrawalDoc {
  investorName?: string;
  investorEmail?: string;
}

export default function AdminWithdrawalsPage() {
  const [user, setUser] = useState<User>(undefined);
  const [withdrawals, setWithdrawals] = useState<WithdrawalWithInvestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalWithInvestor | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => await initSatellite({ workers: { auth: true } }))();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      if (!authUser) {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchWithdrawals();
    }
  }, [user]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      
      const result = await listDocs<WithdrawalRequest>({
        collection: "withdrawal_requests",
        filter: {}
      });

      if (result && result.items) {
        // Fetch investor names for each withdrawal
        const withdrawalsWithInvestors = await Promise.all(
          result.items.map(async (withdrawal) => {
            try {
              // Try individual profiles first
              let investorDoc = await getDoc<InvestorProfile>({
                collection: "individual_investor_profiles",
                key: withdrawal.key.split('_')[0], // Assuming key format: userId_timestamp
              });

              if (!investorDoc) {
                investorDoc = await getDoc<InvestorProfile>({
                  collection: "corporate_investor_profiles",
                  key: withdrawal.key.split('_')[0],
                });
              }

              return {
                ...withdrawal,
                investorName: investorDoc?.data.investorType === 'individual' 
                  ? investorDoc.data.fullName 
                  : investorDoc?.data.companyName || 'Unknown',
                investorEmail: investorDoc?.data.email || '',
              };
            } catch (error) {
              return {
                ...withdrawal,
                investorName: 'Unknown',
                investorEmail: '',
              };
            }
          })
        );

        setWithdrawals(withdrawalsWithInvestors);
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawal: WithdrawalWithInvestor) => {
    if (processing) return;

    try {
      setProcessing(true);
      const userId = withdrawal.key.split('_')[0];

      // 1. Check wallet balance
      const walletDoc = await getDoc<Wallet>({
        collection: "wallets",
        key: userId,
      });

      if (!walletDoc) {
        alert('Wallet not found for this user.');
        setProcessing(false);
        return;
      }

      if (walletDoc.data.availableBalance < withdrawal.data.amount) {
        alert('Insufficient balance. Cannot approve withdrawal.');
        setProcessing(false);
        return;
      }

      // 2. Update withdrawal request status
      await setDoc({
        collection: "withdrawal_requests",
        doc: {
          key: withdrawal.key,
          data: {
            ...withdrawal.data,
            status: 'completed',
            processedAt: Date.now(),
            processedBy: user?.key || '',
          },
          version: withdrawal.version,
        }
      });

      // 3. Update wallet balance
      const newBalance = walletDoc.data.availableBalance - withdrawal.data.amount;

      await setDoc({
        collection: "wallets",
        doc: {
          key: userId,
          data: {
            ...walletDoc.data,
            availableBalance: newBalance,
            totalBalance: walletDoc.data.totalBalance - withdrawal.data.amount,
          },
          version: walletDoc.version,
        }
      });

      // 4. Create transaction record
      await setDoc({
        collection: "transactions",
        doc: {
          key: `${userId}_${Date.now()}`,
          data: {
            userId,
            type: 'withdrawal',
            status: 'completed',
            amount: withdrawal.data.amount,
            description: `Withdrawal to ${withdrawal.data.bankDetails.bankName}`,
            reference: `WD-${withdrawal.key}`,
            createdAt: Date.now(),
            metadata: {
              bankName: withdrawal.data.bankDetails.bankName,
              accountNumber: withdrawal.data.bankDetails.accountNumber,
              accountName: withdrawal.data.bankDetails.accountName,
              withdrawalRequestId: withdrawal.key,
            }
          }
        }
      });

      await fetchWithdrawals();
      setSelectedWithdrawal(null);
      alert(`Withdrawal of ₦${withdrawal.data.amount.toLocaleString()} approved successfully!`);
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      alert('Failed to approve withdrawal. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectWithdrawal = async (withdrawal: WithdrawalWithInvestor) => {
    if (processing) return;

    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      setProcessing(true);

      await setDoc({
        collection: "withdrawal_requests",
        doc: {
          key: withdrawal.key,
          data: {
            ...withdrawal.data,
            status: 'rejected',
            rejectionReason: reason,
            processedAt: Date.now(),
            processedBy: user?.key || '',
          },
          version: withdrawal.version,
        }
      });

      await fetchWithdrawals();
      setSelectedWithdrawal(null);
      alert('Withdrawal rejected successfully.');
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      alert('Failed to reject withdrawal. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    return filterStatus === 'all' || withdrawal.data.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400';
      case 'pending':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400';
      case 'rejected':
        return 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400';
      default:
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400';
    }
  };

  if (user === undefined || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading withdrawals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <div>
                  <h1 className="font-display font-bold text-xl text-neutral-900 dark:text-white">
                    Withdrawal Management
                  </h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Review & Approve Withdrawals
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/dashboard"
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                ← Back to Dashboard
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Pending</span>
              <span className="text-2xl">⏳</span>
            </div>
            <p className="text-3xl font-bold text-warning-600 dark:text-warning-400">
              {withdrawals.filter(w => w.data.status === 'pending').length}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              ₦{withdrawals.filter(w => w.data.status === 'pending').reduce((sum, w) => sum + w.data.amount, 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Approved</span>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-3xl font-bold text-success-600 dark:text-success-400">
              {withdrawals.filter(w => w.data.status === 'completed').length}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              ₦{withdrawals.filter(w => w.data.status === 'completed').reduce((sum, w) => sum + w.data.amount, 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Rejected</span>
              <span className="text-2xl">❌</span>
            </div>
            <p className="text-3xl font-bold text-error-600 dark:text-error-400">
              {withdrawals.filter(w => w.data.status === 'rejected').length}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Requests</span>
              <span className="text-2xl">📤</span>
            </div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {withdrawals.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 mb-6">
          <div className="flex gap-2">
            {['pending', 'completed', 'rejected', 'all'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filterStatus === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Withdrawals List */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Bank Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                      No withdrawal requests found
                    </td>
                  </tr>
                ) : (
                  filteredWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.key} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            {withdrawal.investorName}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">{withdrawal.investorEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-lg text-neutral-900 dark:text-white">
                          RM {withdrawal.data.amount.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-neutral-900 dark:text-white">
                          {withdrawal.data.bankDetails.bankName}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                          {withdrawal.data.bankDetails.accountNumber}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-neutral-900 dark:text-white">
                          {withdrawal.data.createdAt ? new Date(Number(withdrawal.data.createdAt)).toLocaleDateString() : 'N/A'}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {withdrawal.data.createdAt ? new Date(Number(withdrawal.data.createdAt)).toLocaleTimeString() : 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(withdrawal.data.status)}`}>
                          {withdrawal.data.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedWithdrawal(withdrawal)}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm"
                        >
                          Review →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b-2 border-neutral-200 dark:border-neutral-800 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  Withdrawal Review
                </h3>
                <button
                  onClick={() => setSelectedWithdrawal(null)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Member Information */}
              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-4">Member Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Name</p>
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedWithdrawal.investorName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Email</p>
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedWithdrawal.investorEmail}</p>
                  </div>
                </div>
              </div>

              {/* Withdrawal Details */}
              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-4">Withdrawal Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Amount</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                      ₦{selectedWithdrawal.data.amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Status</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedWithdrawal.data.status)}`}>
                      {selectedWithdrawal.data.status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Submitted At</p>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {selectedWithdrawal.data.createdAt ? new Date(Number(selectedWithdrawal.data.createdAt)).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-4">Bank Account Details</h4>
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Bank Name:</span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                      {selectedWithdrawal.data.bankDetails.bankName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Account Number:</span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white font-mono">
                      {selectedWithdrawal.data.bankDetails.accountNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Account Name:</span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                      {selectedWithdrawal.data.bankDetails.accountName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedWithdrawal.data.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <button
                    onClick={() => handleApproveWithdrawal(selectedWithdrawal)}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-success-600 hover:bg-success-700 disabled:bg-neutral-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {processing ? 'Processing...' : '✓ Approve Withdrawal'}
                  </button>
                  <button
                    onClick={() => handleRejectWithdrawal(selectedWithdrawal)}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-error-600 hover:bg-error-700 disabled:bg-neutral-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {processing ? 'Processing...' : '✗ Reject Withdrawal'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
