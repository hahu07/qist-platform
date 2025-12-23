"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, getDoc, listDocs, setDoc, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Wallet, DepositRequest, WithdrawalRequest } from "@/schemas";
import { initiatePaystackPayment, initiateStripePayment, verifyPaystackPayment, verifyStripePayment } from "@/utils/payment-providers";

type User = {
  key: string;
} | null | undefined;

export default function WalletPage() {
  const [user, setUser] = useState<User>(undefined);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [depositRequests, setDepositRequests] = useState<Doc<DepositRequest>[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<Doc<WithdrawalRequest>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const router = useRouter();

  // Deposit form state
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState<"bank_transfer" | "card" | "crypto">("bank_transfer");
  const [depositReference, setDepositReference] = useState("");
  const [depositNotes, setDepositNotes] = useState("");
  const [paymentFiles, setPaymentFiles] = useState<File[]>([]);
  const [paymentProvider, setPaymentProvider] = useState<"paystack" | "stripe">("paystack");
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  
  // Card details state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  // Withdrawal form state
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalBankName, setWithdrawalBankName] = useState("");
  const [withdrawalAccountNumber, setWithdrawalAccountNumber] = useState("");
  const [withdrawalAccountName, setWithdrawalAccountName] = useState("");
  const [withdrawalSubmitting, setWithdrawalSubmitting] = useState(false);

  useEffect(() => {
    (async () => await initSatellite({ workers: { auth: true } }))();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user && user !== null) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    if (!user || user === null) return;
    
    try {
      setLoading(true);
      
      // Fetch wallet
      const walletDoc = await getDoc<Wallet>({
        collection: "wallets",
        key: user.key,
      });

      if (walletDoc) {
        setWallet(walletDoc.data);
      } else {
        // Create new wallet if doesn't exist
        const newWallet: Wallet = {
          userId: user.key,
          availableBalance: 0,
          pendingBalance: 0,
          totalBalance: 0,
          totalInvested: 0,
          totalReturns: 0,
          currency: "NGN",
          status: "active",
        };
        setWallet(newWallet);
      }

      // Fetch deposit requests
      const depositsResult = await listDocs<DepositRequest>({
        collection: "deposit_requests",
        filter: {}
      });
      if (depositsResult && depositsResult.items) {
        const userDeposits = depositsResult.items.filter(d => d.data.userId === user.key);
        userDeposits.sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0));
        setDepositRequests(userDeposits);
      }

      // Fetch withdrawal requests
      const withdrawalsResult = await listDocs<WithdrawalRequest>({
        collection: "withdrawal_requests",
        filter: {}
      });
      if (withdrawalsResult && withdrawalsResult.items) {
        const userWithdrawals = withdrawalsResult.items.filter(w => w.data.userId === user.key);
        userWithdrawals.sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0));
        setWithdrawalRequests(userWithdrawals);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async () => {
    if (!user || depositSubmitting) return;

    const amount = parseFloat(depositAmount);
    if (!amount || amount < 1000) {
      alert("Minimum deposit amount is ₦1,000");
      return;
    }

    try {
      setDepositSubmitting(true);

      if (paymentProvider === 'paystack') {
        // Get user email (you might want to fetch this from user profile)
        const userEmail = `user_${user.key}@amanatrade.com`; // Replace with actual user email

        await initiatePaystackPayment(
          {
            amount,
            email: userEmail,
            userId: user.key,
            metadata: {
              depositType: 'wallet',
              platform: 'AmanaTrade'
            }
          },
          async (reference) => {
            // Payment successful, verify and create deposit request
            const verification = await verifyPaystackPayment(reference);
            
            if (verification.success) {
              const depositRequest: DepositRequest = {
                userId: user.key,
                amount,
                currency: "NGN",
                paymentMethod: "card",
                paymentReference: reference,
                status: "approved", // Auto-approve card payments after verification
              };

              await setDoc({
                collection: "deposit_requests",
                doc: {
                  key: `deposit_${user.key}_${Date.now()}`,
                  data: depositRequest,
                }
              });

              // Update wallet balance
              const currentWallet = await getDoc<Wallet>({
                collection: "wallets",
                key: `wallet_${user.key}`
              });

              const newBalance = (currentWallet?.data.availableBalance || 0) + amount;
              
              await setDoc({
                collection: "wallets",
                doc: {
                  key: `wallet_${user.key}`,
                  data: {
                    ...currentWallet?.data,
                    userId: user.key,
                    availableBalance: newBalance,
                    totalBalance: newBalance,
                    currency: "NGN"
                  } as Wallet,
                  version: currentWallet?.version
                }
              });

              alert(`Payment successful! ₦${amount.toLocaleString()} has been added to your wallet.`);
              setShowDepositModal(false);
              setDepositAmount("");
              await fetchWalletData();
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          },
          () => {
            // Payment closed/cancelled
            setDepositSubmitting(false);
          }
        );
      } else {
        // Stripe integration
        const userEmail = `user_${user.key}@amanatrade.com`; // Replace with actual user email

        await initiateStripePayment(
          {
            amount,
            email: userEmail,
            userId: user.key,
            metadata: {
              depositType: 'wallet',
              platform: 'AmanaTrade'
            }
          },
          async (reference) => {
            // Payment successful, verify and create deposit request
            const verification = await verifyStripePayment(reference);
            
            if (verification.success) {
              const depositRequest: DepositRequest = {
                userId: user.key,
                amount,
                currency: "NGN",
                paymentMethod: "card",
                paymentReference: reference,
                status: "approved", // Auto-approve card payments after verification
              };

              await setDoc({
                collection: "deposit_requests",
                doc: {
                  key: `deposit_${user.key}_${Date.now()}`,
                  data: depositRequest,
                }
              });

              // Update wallet balance
              const currentWallet = await getDoc<Wallet>({
                collection: "wallets",
                key: `wallet_${user.key}`
              });

              const newBalance = (currentWallet?.data.availableBalance || 0) + amount;
              
              await setDoc({
                collection: "wallets",
                doc: {
                  key: `wallet_${user.key}`,
                  data: {
                    ...currentWallet?.data,
                    userId: user.key,
                    availableBalance: newBalance,
                    totalBalance: newBalance,
                    currency: "NGN"
                  } as Wallet,
                  version: currentWallet?.version
                }
              });

              alert(`Payment successful! ₦${amount.toLocaleString()} has been added to your wallet.`);
              setShowDepositModal(false);
              setDepositAmount("");
              await fetchWalletData();
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          },
          () => {
            // Payment closed/cancelled
            setDepositSubmitting(false);
          }
        );
      }
    } catch (error) {
      console.error("Error processing card payment:", error);
      alert("Payment failed. Please try again.");
      setDepositSubmitting(false);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || depositSubmitting) return;

    try {
      setDepositSubmitting(true);

      // Simulate file upload (in production, upload to storage service)
      const paymentEvidence = paymentFiles.map((file, index) => ({
        fileName: file.name,
        fileUrl: `evidence_${user.key}_${Date.now()}_${index}`, // In production: actual storage URL
        fileType: file.type,
        uploadedAt: BigInt(Date.now()),
      }));

      const depositRequest: DepositRequest = {
        userId: user.key,
        amount: parseFloat(depositAmount),
        currency: "NGN",
        paymentMethod: depositMethod,
        paymentReference: depositReference,
        paymentEvidence: paymentEvidence.length > 0 ? paymentEvidence : undefined,
        notes: depositNotes || undefined,
        status: "pending",
      };

      await setDoc({
        collection: "deposit_requests",
        doc: {
          key: `deposit_${user.key}_${Date.now()}`,
          data: depositRequest,
        }
      });

      alert("Deposit request submitted successfully! It will be reviewed by our team.");
      setShowDepositModal(false);
      setDepositAmount("");
      setDepositReference("");
      setDepositNotes("");
      setPaymentFiles([]);
      await fetchWalletData();
    } catch (error) {
      console.error("Error submitting deposit:", error);
      alert("Failed to submit deposit request. Please try again.");
    } finally {
      setDepositSubmitting(false);
    }
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !wallet || withdrawalSubmitting) return;

    const amount = parseFloat(withdrawalAmount);
    if (amount > wallet.availableBalance) {
      alert("Insufficient balance for this withdrawal.");
      return;
    }

    try {
      setWithdrawalSubmitting(true);

      const withdrawalRequest: WithdrawalRequest = {
        userId: user.key,
        amount,
        currency: "NGN",
        bankDetails: {
          bankName: withdrawalBankName,
          accountNumber: withdrawalAccountNumber,
          accountName: withdrawalAccountName,
        },
        status: "pending",
      };

      await setDoc({
        collection: "withdrawal_requests",
        doc: {
          key: `withdrawal_${user.key}_${Date.now()}`,
          data: withdrawalRequest,
        }
      });

      alert("Withdrawal request submitted successfully! Processing typically takes 1-3 business days.");
      setShowWithdrawalModal(false);
      setWithdrawalAmount("");
      setWithdrawalBankName("");
      setWithdrawalAccountNumber("");
      setWithdrawalAccountName("");
      await fetchWalletData();
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      alert("Failed to submit withdrawal request. Please try again.");
    } finally {
      setWithdrawalSubmitting(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: bigint | undefined): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400';
      case 'pending':
      case 'processing':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400';
      case 'rejected':
      case 'cancelled':
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
          <p className="text-neutral-600 dark:text-neutral-400">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (user === null) {
    router.push("/auth/signin");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/member/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <div>
                  <h1 className="font-display font-bold text-xl text-neutral-900 dark:text-white">
                    My Wallet
                  </h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Manage your funds
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/member/dashboard"
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                ← Back to Dashboard
              </Link>
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-8 text-white shadow-2xl">
            <p className="text-primary-100 text-sm font-medium mb-2">Available Balance</p>
            <p className="text-4xl font-mono font-bold mb-4">
              {formatCurrency(wallet?.availableBalance || 0)}
            </p>
            <button
              onClick={() => setShowWithdrawalModal(true)}
              className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-colors"
            >
              Withdraw Funds
            </button>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800">
            <p className="text-neutral-600 dark:text-neutral-400 text-sm font-medium mb-2">Pending Balance</p>
            <p className="text-4xl font-mono font-bold text-neutral-900 dark:text-white mb-4">
              {formatCurrency(wallet?.pendingBalance || 0)}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500">Awaiting clearance</p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800">
            <p className="text-neutral-600 dark:text-neutral-400 text-sm font-medium mb-2">Total Invested</p>
            <p className="text-4xl font-mono font-bold text-neutral-900 dark:text-white mb-4">
              {formatCurrency(wallet?.totalInvested || 0)}
            </p>
            <p className="text-xs text-success-600 dark:text-success-400">+{formatCurrency(wallet?.totalReturns || 0)} returns</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setShowDepositModal(true)}
            className="p-6 bg-success-600 hover:bg-success-700 text-white rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Funds
          </button>

          <Link
            href="/member/transactions"
            className="p-6 bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 hover:border-primary-600 dark:hover:border-primary-400 text-neutral-900 dark:text-white rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View All Transactions
          </Link>
        </div>

        {/* Recent Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deposit Requests */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Recent Deposits</h2>
            {depositRequests.length === 0 ? (
              <p className="text-neutral-500 dark:text-neutral-400 text-sm py-8 text-center">No deposit requests yet</p>
            ) : (
              <div className="space-y-3">
                {depositRequests.slice(0, 5).map((deposit) => (
                  <div key={deposit.key} className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">
                        {formatCurrency(deposit.data.amount)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(deposit.data.status)}`}>
                        {deposit.data.status}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      <p>Ref: {deposit.data.paymentReference}</p>
                      <p>{formatDate(deposit.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Withdrawal Requests */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Recent Withdrawals</h2>
            {withdrawalRequests.length === 0 ? (
              <p className="text-neutral-500 dark:text-neutral-400 text-sm py-8 text-center">No withdrawal requests yet</p>
            ) : (
              <div className="space-y-3">
                {withdrawalRequests.slice(0, 5).map((withdrawal) => (
                  <div key={withdrawal.key} className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">
                        {formatCurrency(withdrawal.data.amount)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(withdrawal.data.status)}`}>
                        {withdrawal.data.status}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      <p>To: {withdrawal.data.bankDetails.accountName}</p>
                      <p>{withdrawal.data.bankDetails.bankName} - {withdrawal.data.bankDetails.accountNumber}</p>
                      <p>{formatDate(withdrawal.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 max-w-lg w-full shadow-2xl max-h-[95vh] overflow-y-auto my-4">
            <div className="sticky top-0 bg-white dark:bg-neutral-900 p-6 border-b border-neutral-200 dark:border-neutral-800 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Add Funds</h3>
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleDepositSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Amount (NGN)
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="100"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Payment Method
                </label>
                <select
                  value={depositMethod}
                  onChange={(e) => setDepositMethod(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card Payment</option>
                  <option value="crypto">Cryptocurrency</option>
                </select>
              </div>

              {/* Payment Provider Selection for Card */}
              {depositMethod === 'card' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Payment Provider
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentProvider('paystack')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        paymentProvider === 'paystack'
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          paymentProvider === 'paystack' ? 'bg-[#00C3F7]' : 'bg-neutral-200 dark:bg-neutral-700'
                        }`}>
                          <span className="text-white font-bold text-lg">P</span>
                        </div>
                        <span className="font-semibold text-sm text-neutral-900 dark:text-white">Paystack</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">Instant payment</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentProvider('stripe')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        paymentProvider === 'stripe'
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          paymentProvider === 'stripe' ? 'bg-[#635BFF]' : 'bg-neutral-200 dark:bg-neutral-700'
                        }`}>
                          <span className="text-white font-bold text-lg">S</span>
                        </div>
                        <span className="font-semibold text-sm text-neutral-900 dark:text-white">Stripe</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">Global payments</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Platform Bank Details */}
              {depositMethod === 'bank_transfer' && (
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-2 border-primary-300 dark:border-primary-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-primary-700 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h4 className="font-bold text-primary-900 dark:text-primary-200">Make Transfer To:</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-1.5 border-b border-primary-200 dark:border-primary-700/50">
                      <span className="text-primary-700 dark:text-primary-400 font-medium">Bank Name:</span>
                      <span className="font-bold text-primary-900 dark:text-primary-100">Guarantee Trust Bank</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-primary-200 dark:border-primary-700/50">
                      <span className="text-primary-700 dark:text-primary-400 font-medium">Account Number:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg text-primary-900 dark:text-primary-100">0123456789</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('0123456789');
                            alert('Account number copied!');
                          }}
                          className="p-1 hover:bg-primary-200 dark:hover:bg-primary-700 rounded transition-colors"
                          title="Copy account number"
                        >
                          <svg className="w-4 h-4 text-primary-700 dark:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-primary-700 dark:text-primary-400 font-medium">Account Name:</span>
                      <span className="font-bold text-primary-900 dark:text-primary-100">AmanaTrade Investment Ltd</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Card Payment Button */}
              {depositMethod === 'card' && (
                <div className="space-y-4">
                  {/* Card Input Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Card Number
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s/g, '');
                          const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                          setCardNumber(formatted);
                        }}
                        className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 font-mono"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2, 4);
                            }
                            setCardExpiry(value);
                          }}
                          className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 font-mono"
                          placeholder="MM/YY"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setCardCvv(value);
                          }}
                          className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 font-mono"
                          placeholder="123"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 uppercase"
                        placeholder="JOHN DOE"
                      />
                    </div>
                  </div>

                  {/* Payment Button */}
                  <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-2 border-primary-300 dark:border-primary-700 rounded-xl p-6 text-center">
                    <div className="mb-4">
                      <div className="w-16 h-16 mx-auto bg-primary-600 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-lg text-primary-900 dark:text-primary-200 mb-2">
                        Pay with {paymentProvider === 'paystack' ? 'Paystack' : 'Stripe'}
                      </h4>
                      <p className="text-sm text-primary-700 dark:text-primary-300 mb-4">
                        Click the button below to complete your payment securely
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCardPayment}
                      disabled={!depositAmount || parseFloat(depositAmount) < 1000 || !cardNumber || !cardExpiry || !cardCvv || !cardName || depositSubmitting}
                      className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-neutral-400 disabled:to-neutral-400 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:transform-none disabled:cursor-not-allowed"
                    >
                      {depositSubmitting ? '⏳ Processing Payment...' : 
                       !depositAmount || parseFloat(depositAmount) < 1000 ? 
                       '💳 Enter Amount to Continue' :
                       !cardNumber || !cardExpiry || !cardCvv || !cardName ?
                       '💳 Complete Card Details' :
                       (paymentProvider === 'paystack' ? '💳 Pay with Paystack' : '💳 Pay with Stripe')}
                    </button>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3">
                      🔒 Secure payment powered by {paymentProvider === 'paystack' ? 'Paystack' : 'Stripe'} • SSL Encrypted
                    </p>
                  </div>
                </div>
              )}

              {depositMethod !== 'card' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Payment Reference
                    </label>
                    <input
                      type="text"
                      required
                      value={depositReference}
                      onChange={(e) => setDepositReference(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                      placeholder="Enter transaction reference"
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Enter the reference from your bank transfer confirmation
                    </p>
                  </div>

                  {/* Payment Evidence Upload */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Payment Evidence (Optional - Multiple Files)
                    </label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setPaymentFiles(prev => [...prev, ...files]);
                        }}
                        className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-600 file:text-white file:font-medium hover:file:bg-primary-700 transition-colors"
                      />
                      {paymentFiles.length > 0 && (
                        <div className="space-y-1">
                          {paymentFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                              <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate flex-1">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => setPaymentFiles(prev => prev.filter((_, i) => i !== index))}
                                className="ml-2 p-1 hover:bg-error-100 dark:hover:bg-error-900/30 rounded text-error-600 dark:text-error-400"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Upload bank receipt, screenshot, or any proof of payment (Images or PDF)
                      </p>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={depositNotes}
                      onChange={(e) => setDepositNotes(e.target.value)}
                      maxLength={500}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
                      placeholder="Any additional information..."
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {depositNotes.length}/500 characters
                    </p>
                  </div>

                  <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                    <p className="text-xs text-primary-800 dark:text-primary-300">
                      <strong>Note:</strong> After making the payment, your deposit request will be reviewed by our team. Approval typically takes 2-4 hours during business hours.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={depositSubmitting}
                    className="w-full px-6 py-3 bg-success-600 hover:bg-success-700 disabled:bg-neutral-400 text-white font-semibold rounded-lg transition-colors"
                  >
                    {depositSubmitting ? "Submitting..." : "Submit Deposit Request"}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 max-w-lg w-full shadow-2xl">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Withdraw Funds</h3>
                <button
                  onClick={() => setShowWithdrawalModal(false)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleWithdrawalSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Amount (NGN)
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  max={wallet?.availableBalance || 0}
                  step="100"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Enter amount"
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Available: {formatCurrency(wallet?.availableBalance || 0)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  required
                  value={withdrawalBankName}
                  onChange={(e) => setWithdrawalBankName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Enter bank name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  required
                  minLength={10}
                  maxLength={10}
                  value={withdrawalAccountNumber}
                  onChange={(e) => setWithdrawalAccountNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Enter account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  required
                  value={withdrawalAccountName}
                  onChange={(e) => setWithdrawalAccountName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Enter account name"
                />
              </div>

              <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
                <p className="text-xs text-warning-800 dark:text-warning-300">
                  <strong>Note:</strong> Withdrawal requests are typically processed within 1-3 business days. Funds will be transferred to the bank account specified above.
                </p>
              </div>

              <button
                type="submit"
                disabled={withdrawalSubmitting}
                className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white font-semibold rounded-lg transition-colors"
              >
                {withdrawalSubmitting ? "Submitting..." : "Submit Withdrawal Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
