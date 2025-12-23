"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, listDocs, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Transaction } from "@/schemas";

type User = {
  key: string;
} | null | undefined;

export default function TransactionsPage() {
  const [user, setUser] = useState<User>(undefined);
  const [transactions, setTransactions] = useState<Doc<Transaction>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

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
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user || user === null) return;
    
    try {
      setLoading(true);
      const result = await listDocs<Transaction>({
        collection: "transactions",
        filter: {}
      });

      if (result && result.items) {
        // Filter transactions for current user
        const userTransactions = result.items.filter(
          (item) => item.data.userId === user.key
        );
        
        // Sort by created date (newest first)
        userTransactions.sort((a, b) => 
          Number(b.created_at || 0) - Number(a.created_at || 0)
        );
        
        setTransactions(userTransactions);
        console.log("📊 Transactions fetched:", userTransactions.length);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesType = filterType === 'all' || tx.data.type === filterType;
    const matchesStatus = filterStatus === 'all' || tx.data.status === filterStatus;
    const matchesSearch = 
      tx.data.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.data.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.data.metadata?.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    return matchesType && matchesStatus && matchesSearch;
  });

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
    const date = new Date(Number(timestamp) / 1000000); // Convert nanoseconds to milliseconds
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'investment':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'profit_distribution':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'deposit':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case 'withdrawal':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
      case 'fee':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'refund':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'investment':
        return 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300';
      case 'profit_distribution':
        return 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300';
      case 'deposit':
        return 'bg-business-100 dark:bg-business-900/30 text-business-700 dark:text-business-300';
      case 'withdrawal':
        return 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300';
      case 'fee':
        return 'bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300';
      case 'refund':
        return 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400';
      case 'pending':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400';
      case 'failed':
        return 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400';
      case 'cancelled':
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400';
      default:
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400';
    }
  };

  const getAmountDisplay = (tx: Transaction) => {
    const isCredit = ['profit_distribution', 'deposit', 'refund'].includes(tx.type);
    const prefix = isCredit ? '+' : '-';
    const colorClass = isCredit 
      ? 'text-success-600 dark:text-success-400' 
      : 'text-error-600 dark:text-error-400';
    
    return (
      <span className={`font-mono font-bold ${colorClass}`}>
        {prefix}{formatCurrency(tx.amount)}
      </span>
    );
  };

  // Calculate summary stats
  const summaryStats = {
    totalInvested: transactions
      .filter(tx => tx.data.type === 'investment' && tx.data.status === 'completed')
      .reduce((sum, tx) => sum + tx.data.amount, 0),
    totalProfits: transactions
      .filter(tx => tx.data.type === 'profit_distribution' && tx.data.status === 'completed')
      .reduce((sum, tx) => sum + tx.data.amount, 0),
    totalDeposits: transactions
      .filter(tx => tx.data.type === 'deposit' && tx.data.status === 'completed')
      .reduce((sum, tx) => sum + tx.data.amount, 0),
    totalWithdrawals: transactions
      .filter(tx => tx.data.type === 'withdrawal' && tx.data.status === 'completed')
      .reduce((sum, tx) => sum + tx.data.amount, 0),
  };

  if (user === undefined || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading transactions...</p>
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
                    Transaction History
                  </h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    All your financial activity
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
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Invested</span>
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-2xl font-mono font-bold text-neutral-900 dark:text-white">
              {formatCurrency(summaryStats.totalInvested)}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Profits Earned</span>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-2xl font-mono font-bold text-success-600 dark:text-success-400">
              +{formatCurrency(summaryStats.totalProfits)}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Deposits</span>
              <span className="text-2xl">⬇️</span>
            </div>
            <p className="text-2xl font-mono font-bold text-business-600 dark:text-business-400">
              {formatCurrency(summaryStats.totalDeposits)}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Withdrawals</span>
              <span className="text-2xl">⬆️</span>
            </div>
            <p className="text-2xl font-mono font-bold text-warning-600 dark:text-warning-400">
              {formatCurrency(summaryStats.totalWithdrawals)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by reference, description, or business name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="all">All Types</option>
                <option value="investment">Investments</option>
                <option value="profit_distribution">Profits</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="fee">Fees</option>
                <option value="refund">Refunds</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-neutral-400 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                No Transactions Found
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                {transactions.length === 0 
                  ? "You haven't made any transactions yet. Start investing to see your transaction history." 
                  : "No transactions match your current filters. Try adjusting your search criteria."}
              </p>
              <Link
                href="/member/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
              >
                Browse Opportunities
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.key} className="p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTypeColor(transaction.data.type)}`}>
                        {getTypeIcon(transaction.data.type)}
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                              {transaction.data.description}
                            </h3>
                            {transaction.data.metadata?.businessName && (
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {transaction.data.metadata.businessName}
                                {transaction.data.metadata.contractType && (
                                  <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-500">
                                    • {transaction.data.metadata.contractType}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xl mb-1">
                              {getAmountDisplay(transaction.data)}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.data.status)}`}>
                              {transaction.data.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                          <span className="font-mono">{transaction.data.reference}</span>
                          <span>•</span>
                          <span>{formatDate(transaction.created_at)}</span>
                          <span>•</span>
                          <span className="capitalize">{transaction.data.type.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
