"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { initSatellite, onAuthStateChange, listDocs, getDoc, setDoc, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DepositRequest, Wallet, InvestorProfile } from "@/schemas";

type User = {
  key: string;
} | null | undefined;

type DepositDoc = Doc<DepositRequest>;

interface DepositWithInvestor extends DepositDoc {
  investorName?: string;
  investorEmail?: string;
}

export default function AdminDepositsPage() {
  const [user, setUser] = useState<User>(undefined);
  const [deposits, setDeposits] = useState<DepositWithInvestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositWithInvestor | null>(null);
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
      fetchDeposits();
    }
  }, [user]);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      
      const result = await listDocs<DepositRequest>({
        collection: "deposit_requests",
        filter: {}
      });

      if (result && result.items) {
        // Fetch investor names for each deposit
        const depositsWithInvestors = await Promise.all(
          result.items.map(async (deposit) => {
            try {
              // Try individual profiles first
              let investorDoc = await getDoc<InvestorProfile>({
                collection: "individual_investor_profiles",
                key: deposit.key.split('_')[0], // Assuming key format: userId_timestamp
              });

              if (!investorDoc) {
                investorDoc = await getDoc<InvestorProfile>({
                  collection: "corporate_investor_profiles",
                  key: deposit.key.split('_')[0],
                });
              }

              return {
                ...deposit,
                investorName: investorDoc?.data.investorType === 'individual' 
                  ? investorDoc.data.fullName 
                  : investorDoc?.data.companyName || 'Unknown',
                investorEmail: investorDoc?.data.email || '',
              };
            } catch (error) {
              return {
                ...deposit,
                investorName: 'Unknown',
                investorEmail: '',
              };
            }
          })
        );

        setDeposits(depositsWithInvestors);
      }
    } catch (error) {
      console.error("Error fetching deposits:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDeposit = async (deposit: DepositWithInvestor) => {
    if (processing) return;

    try {
      setProcessing(true);
      const userId = deposit.key.split('_')[0];

      // 1. Update deposit request status
      await setDoc({
        collection: "deposit_requests",
        doc: {
          key: deposit.key,
          data: {
            ...deposit.data,
            status: 'approved',
            approvedAt: BigInt(Date.now()),
            approvedBy: user?.key || '',
          },
          version: deposit.version,
        }
      });

      // 2. Update wallet balance
      let walletDoc = await getDoc<Wallet>({
        collection: "wallets",
        key: userId,
      });

      if (walletDoc) {
        const currentBalance = walletDoc.data.availableBalance;
        const newBalance = currentBalance + deposit.data.amount;

        await setDoc({
          collection: "wallets",
          doc: {
            key: userId,
            data: {
              ...walletDoc.data,
              availableBalance: newBalance,
              totalBalance: walletDoc.data.totalBalance + deposit.data.amount,
            },
            version: walletDoc.version,
          }
        });
      } else {
        // Create wallet if it doesn't exist
        await setDoc({
          collection: "wallets",
          doc: {
            key: userId,
            data: {
              userId,
              availableBalance: deposit.data.amount,
              pendingBalance: 0,
              totalBalance: deposit.data.amount,
              totalInvested: 0,
              totalReturns: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }
          }
        });
      }

      // 3. Create transaction record
      await setDoc({
        collection: "transactions",
        doc: {
          key: `${userId}_${Date.now()}`,
          data: {
            userId,
            type: 'deposit',
            status: 'completed',
            amount: deposit.data.amount,
            description: `Deposit via ${deposit.data.paymentMethod}`,
            reference: deposit.data.paymentReference,
            createdAt: Date.now(),
            metadata: {
              paymentMethod: deposit.data.paymentMethod,
              depositRequestId: deposit.key,
            }
          }
        }
      });

      await fetchDeposits();
      setSelectedDeposit(null);
      alert(`Deposit of ₦${deposit.data.amount.toLocaleString()} approved successfully!`);
    } catch (error) {
      console.error('Error approving deposit:', error);
      alert('Failed to approve deposit. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectDeposit = async (deposit: DepositWithInvestor) => {
    if (processing) return;

    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      setProcessing(true);

      await setDoc({
        collection: "deposit_requests",
        doc: {
          key: deposit.key,
          data: {
            ...deposit.data,
            status: 'rejected',
            rejectionReason: reason,
            processedAt: Date.now(),
            processedBy: user?.key || '',
          },
          version: deposit.version,
        }
      });

      await fetchDeposits();
      setSelectedDeposit(null);
      alert('Deposit rejected successfully.');
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      alert('Failed to reject deposit. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredDeposits = deposits.filter(deposit => {
    return filterStatus === 'all' || deposit.data.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400';
      case 'pending':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400';
      case 'rejected':
        return 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400';
      default:
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'fpx':
        return 'FPX Online Banking';
      case 'credit_card':
        return 'Credit/Debit Card';
      default:
        return method;
    }
  };

  if (user === undefined || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading deposits...</p>
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
                    Deposit Management
                  </h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Review & Approve Deposits
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
              {deposits.filter(d => d.data.status === 'pending').length}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              ₦{deposits.filter(d => d.data.status === 'pending').reduce((sum, d) => sum + d.data.amount, 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Approved</span>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-3xl font-bold text-success-600 dark:text-success-400">
              {deposits.filter(d => d.data.status === 'approved').length}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              ₦{deposits.filter(d => d.data.status === 'approved').reduce((sum, d) => sum + d.data.amount, 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Rejected</span>
              <span className="text-2xl">❌</span>
            </div>
            <p className="text-3xl font-bold text-error-600 dark:text-error-400">
              {deposits.filter(d => d.data.status === 'rejected').length}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Requests</span>
              <span className="text-2xl">📥</span>
            </div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {deposits.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 mb-6">
          <div className="flex gap-2">
            {['pending', 'approved', 'rejected', 'all'].map((status) => (
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

        {/* Deposits List */}
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
                    Payment Method
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
                {filteredDeposits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                      No deposit requests found
                    </td>
                  </tr>
                ) : (
                  filteredDeposits.map((deposit) => (
                    <tr key={deposit.key} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            {deposit.investorName}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">{deposit.investorEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-lg text-neutral-900 dark:text-white">
                          RM {deposit.data.amount.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-neutral-900 dark:text-white">
                          {getPaymentMethodLabel(deposit.data.paymentMethod)}
                        </p>
                        {deposit.data.paymentReference && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                            {deposit.data.paymentReference}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-neutral-900 dark:text-white">
                          {deposit.data.createdAt ? new Date(Number(deposit.data.createdAt) / 1000000).toLocaleDateString() : 'N/A'}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {deposit.data.createdAt ? new Date(Number(deposit.data.createdAt) / 1000000).toLocaleTimeString() : 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(deposit.data.status)}`}>
                          {deposit.data.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedDeposit(deposit)}
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
      {selectedDeposit && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b-2 border-neutral-200 dark:border-neutral-800 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  Deposit Review
                </h3>
                <button
                  onClick={() => setSelectedDeposit(null)}
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
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedDeposit.investorName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Email</p>
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedDeposit.investorEmail}</p>
                  </div>
                </div>
              </div>

              {/* Deposit Details */}
              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-4">Deposit Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Amount</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                      ₦{selectedDeposit.data.amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Status</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedDeposit.data.status)}`}>
                      {selectedDeposit.data.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Payment Method</p>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {getPaymentMethodLabel(selectedDeposit.data.paymentMethod)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Reference Number</p>
                    <p className="font-medium text-neutral-900 dark:text-white font-mono">
                      {selectedDeposit.data.paymentReference || 'N/A'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Submitted At</p>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {selectedDeposit.data.createdAt ? new Date(Number(selectedDeposit.data.createdAt) / 1000000).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Evidence */}
              {selectedDeposit.data.paymentEvidence && selectedDeposit.data.paymentEvidence.length > 0 && (
                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-4">Payment Evidence ({selectedDeposit.data.paymentEvidence.length} file{selectedDeposit.data.paymentEvidence.length > 1 ? 's' : ''})</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedDeposit.data.paymentEvidence.map((evidence, index) => (
                      <div key={index} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 flex-shrink-0 bg-primary-100 dark:bg-primary-900/30 rounded flex items-center justify-center">
                            {evidence.fileType.startsWith('image/') ? (
                              <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-neutral-900 dark:text-white truncate">{evidence.fileName}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {evidence.uploadedAt ? new Date(Number(evidence.uploadedAt)).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {selectedDeposit.data.notes && (
                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">Additional Notes</h4>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{selectedDeposit.data.notes}</p>
                  </div>
                </div>
              )}

              {/* Bank Details (if bank transfer) */}
              {selectedDeposit.data.paymentMethod === 'bank_transfer' && selectedDeposit.data.bankDetails && (
                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-4">Bank Transfer Details</h4>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Bank Name:</span>
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">
                        {selectedDeposit.data.bankDetails.bankName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Account Number:</span>
                      <span className="text-sm font-medium text-neutral-900 dark:text-white font-mono">
                        {selectedDeposit.data.bankDetails.accountNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Account Name:</span>
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">
                        {selectedDeposit.data.bankDetails.accountName}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedDeposit.data.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <button
                    onClick={() => handleApproveDeposit(selectedDeposit)}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-success-600 hover:bg-success-700 disabled:bg-neutral-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {processing ? 'Processing...' : '✓ Approve Deposit'}
                  </button>
                  <button
                    onClick={() => handleRejectDeposit(selectedDeposit)}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-error-600 hover:bg-error-700 disabled:bg-neutral-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {processing ? 'Processing...' : '✗ Reject Deposit'}
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
