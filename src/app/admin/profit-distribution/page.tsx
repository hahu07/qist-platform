"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { initSatellite, onAuthStateChange, listDocs, getDoc, setDoc, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OpportunityFormData, InvestmentTransaction, Wallet, ProfitDistribution } from "@/schemas";

type User = {
  key: string;
} | null | undefined;

type OpportunityDoc = Doc<OpportunityFormData>;

export default function ProfitDistributionPage() {
  const [user, setUser] = useState<User>(undefined);
  const [opportunities, setOpportunities] = useState<OpportunityDoc[]>([]);
  const [distributions, setDistributions] = useState<Doc<ProfitDistribution>[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityDoc | null>(null);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Distribution form state
  const [distributionPeriod, setDistributionPeriod] = useState("");
  const [totalProfitAmount, setTotalProfitAmount] = useState("");
  const [notes, setNotes] = useState("");

  const router = useRouter();

  useEffect(() => {
    (async () => await initSatellite({ workers: { auth: true } }))();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      if (!authUser) {
        router.push('/admin/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch active opportunities
      const oppResult = await listDocs<OpportunityFormData>({
        collection: "opportunities",
        filter: {}
      });

      if (oppResult && oppResult.items) {
        // Filter for active/completed opportunities
        const activeOpps = oppResult.items.filter(
          opp => opp.data.status === 'active' || opp.data.status === 'funded'
        );
        setOpportunities(activeOpps);
      }

      // Fetch past distributions
      const distResult = await listDocs<ProfitDistribution>({
        collection: "profit_distributions",
        filter: {}
      });

      if (distResult && distResult.items) {
        setDistributions(distResult.items);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDistributeProfit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpportunity || processing) return;

    const profitAmount = parseFloat(totalProfitAmount);
    if (isNaN(profitAmount) || profitAmount <= 0) {
      alert("Please enter a valid profit amount");
      return;
    }

    try {
      setProcessing(true);

      // 1. Fetch all investments for this opportunity
      const investmentsResult = await listDocs<InvestmentTransaction>({
        collection: "investments",
        filter: {}
      });

      const opportunityInvestments = investmentsResult.items.filter(
        inv => inv.data.opportunityId === selectedOpportunity.key && inv.data.status === 'active'
      );

      if (opportunityInvestments.length === 0) {
        alert("No active investments found for this opportunity");
        setProcessing(false);
        return;
      }

      const totalInvested = opportunityInvestments.reduce((sum, inv) => sum + inv.data.amount, 0);

      // 2. Create main distribution record
      const distributionId = `dist_${selectedOpportunity.key}_${Date.now()}`;
      await setDoc({
        collection: "profit_distributions",
        doc: {
          key: distributionId,
          data: {
            opportunityId: selectedOpportunity.key,
            businessName: selectedOpportunity.data.businessName,
            contractType: selectedOpportunity.data.contractType,
            distributionPeriod,
            totalProfitAmount: profitAmount,
            distributionDate: Date.now(),
            investorCount: opportunityInvestments.length,
            totalInvestedAmount: totalInvested,
            status: 'processing',
            processedBy: user?.key || '',
            notes,
            createdAt: Date.now(),
          }
        }
      });

      // 3. Distribute to each investor
      let successCount = 0;
      let failureCount = 0;

      for (const investment of opportunityInvestments) {
        try {
          const investorId = investment.data.investorId;
          const investedAmount = investment.data.amount;
          const investmentPercentage = (investedAmount / totalInvested) * 100;
          const investorProfitAmount = (profitAmount * investmentPercentage) / 100;
          const profitRate = (investorProfitAmount / investedAmount) * 100;

          // Create investor distribution record
          await setDoc({
            collection: "investor_distributions",
            doc: {
              key: `${distributionId}_${investorId}`,
              data: {
                distributionId,
                opportunityId: selectedOpportunity.key,
                investorId,
                investedAmount,
                investmentPercentage,
                profitAmount: investorProfitAmount,
                profitRate,
                status: 'pending',
                createdAt: Date.now(),
              }
            }
          });

          // Get investor's wallet
          let walletDoc = await getDoc<Wallet>({
            collection: "wallets",
            key: investorId,
          });

          if (walletDoc) {
            // Update wallet balance
            await setDoc({
              collection: "wallets",
              doc: {
                key: investorId,
                data: {
                  ...walletDoc.data,
                  availableBalance: walletDoc.data.availableBalance + investorProfitAmount,
                  totalBalance: walletDoc.data.totalBalance + investorProfitAmount,
                  totalReturns: walletDoc.data.totalReturns + investorProfitAmount,
                  updatedAt: Date.now(),
                },
                version: walletDoc.version,
              }
            });

            // Create transaction record
            const transactionId = `${investorId}_${Date.now()}`;
            await setDoc({
              collection: "transactions",
              doc: {
                key: transactionId,
                data: {
                  userId: investorId,
                  type: 'profit_distribution',
                  status: 'completed',
                  amount: investorProfitAmount,
                  description: `Profit distribution from ${selectedOpportunity.data.businessName} - ${distributionPeriod}`,
                  reference: distributionId,
                  createdAt: Date.now(),
                  metadata: {
                    opportunityId: selectedOpportunity.key,
                    businessName: selectedOpportunity.data.businessName,
                    contractType: selectedOpportunity.data.contractType,
                    distributionPeriod,
                    investedAmount,
                    profitRate: profitRate.toFixed(2),
                  }
                }
              }
            });

            // Update investor distribution status
            await setDoc({
              collection: "investor_distributions",
              doc: {
                key: `${distributionId}_${investorId}`,
                data: {
                  distributionId,
                  opportunityId: selectedOpportunity.key,
                  investorId,
                  investedAmount,
                  investmentPercentage,
                  profitAmount: investorProfitAmount,
                  profitRate,
                  status: 'credited',
                  transactionId,
                  creditedAt: Date.now(),
                  createdAt: Date.now(),
                }
              }
            });

            successCount++;
          } else {
            failureCount++;
            console.error(`Wallet not found for investor ${investorId}`);
          }
        } catch (error) {
          failureCount++;
          console.error(`Error distributing to investor:`, error);
        }
      }

      // 4. Update main distribution status
      await setDoc({
        collection: "profit_distributions",
        doc: {
          key: distributionId,
          data: {
            opportunityId: selectedOpportunity.key,
            businessName: selectedOpportunity.data.businessName,
            contractType: selectedOpportunity.data.contractType,
            distributionPeriod,
            totalProfitAmount: profitAmount,
            distributionDate: Date.now(),
            investorCount: opportunityInvestments.length,
            totalInvestedAmount: totalInvested,
            status: failureCount === 0 ? 'completed' : 'failed',
            processedBy: user?.key || '',
            notes: `${notes}${failureCount > 0 ? ` | ${failureCount} failures` : ''}`,
            createdAt: Date.now(),
            completedAt: Date.now(),
          }
        }
      });

      await fetchData();
      setShowDistributionModal(false);
      setSelectedOpportunity(null);
      setDistributionPeriod("");
      setTotalProfitAmount("");
      setNotes("");
      
      alert(`Profit distribution completed!\n\nSuccessful: ${successCount}\nFailed: ${failureCount}`);
    } catch (error) {
      console.error('Error distributing profit:', error);
      alert('Failed to distribute profit. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400';
      case 'processing':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400';
      case 'failed':
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
          <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>
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
                    Profit Distribution
                  </h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Distribute Returns to Investors
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
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Active Opportunities</span>
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {opportunities.length}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Distributions</span>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {distributions.length}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Completed</span>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-3xl font-bold text-success-600 dark:text-success-400">
              {distributions.filter(d => d.data.status === 'completed').length}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Distributed</span>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              ₦{distributions
                .filter(d => d.data.status === 'completed')
                .reduce((sum, d) => sum + d.data.totalProfitAmount, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>

        {/* Active Opportunities */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 mb-8">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="font-display font-bold text-lg text-neutral-900 dark:text-white">
              Active Investment Opportunities
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Select an opportunity to distribute profits to investors
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Contract Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Total Funding
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Investors
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Expected Return
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {opportunities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                      No active opportunities found
                    </td>
                  </tr>
                ) : (
                  opportunities.map((opp) => (
                    <tr key={opp.key} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{opp.data.businessName}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">{opp.data.industry}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium rounded capitalize">
                          {opp.data.contractType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-neutral-900 dark:text-white">
                          ₦{opp.data.currentFunding.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-neutral-900 dark:text-white">{opp.data.investorCount}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-neutral-900 dark:text-white">
                          {opp.data.expectedReturnMin}% - {opp.data.expectedReturnMax}%
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedOpportunity(opp);
                            setShowDistributionModal(true);
                          }}
                          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Distribute Profit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Distribution History */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="font-display font-bold text-lg text-neutral-900 dark:text-white">
              Distribution History
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Investors
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {distributions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                      No distributions yet
                    </td>
                  </tr>
                ) : (
                  distributions.map((dist) => (
                    <tr key={dist.key} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-neutral-900 dark:text-white">{dist.data.businessName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-neutral-900 dark:text-white">{dist.data.distributionPeriod}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-neutral-900 dark:text-white">
                          ₦{dist.data.totalProfitAmount.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-neutral-900 dark:text-white">{dist.data.investorCount}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-neutral-900 dark:text-white">
                          {new Date(dist.data.distributionDate).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(dist.data.status)}`}>
                          {dist.data.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Distribution Modal */}
      {showDistributionModal && selectedOpportunity && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 max-w-2xl w-full shadow-2xl">
            <div className="p-6 border-b-2 border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  Distribute Profit - {selectedOpportunity.data.businessName}
                </h3>
                <button
                  onClick={() => {
                    setShowDistributionModal(false);
                    setSelectedOpportunity(null);
                  }}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleDistributeProfit} className="p-6 space-y-6">
              {/* Opportunity Info */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Total Funding</p>
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      ₦{selectedOpportunity.data.currentFunding.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Investors</p>
                    <p className="font-bold text-lg text-neutral-900 dark:text-white">
                      {selectedOpportunity.data.investorCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Contract Type</p>
                    <p className="font-medium text-neutral-900 dark:text-white capitalize">
                      {selectedOpportunity.data.contractType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Expected Return</p>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {selectedOpportunity.data.expectedReturnMin}% - {selectedOpportunity.data.expectedReturnMax}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Distribution Form */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Distribution Period *
                </label>
                <input
                  type="text"
                  required
                  value={distributionPeriod}
                  onChange={(e) => setDistributionPeriod(e.target.value)}
                  placeholder="e.g., Q1 2024, January 2024"
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Total Profit Amount (RM) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={totalProfitAmount}
                  onChange={(e) => setTotalProfitAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  This amount will be distributed proportionally to all investors
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any additional notes about this distribution..."
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowDistributionModal(false);
                    setSelectedOpportunity(null);
                  }}
                  className="flex-1 px-4 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white rounded-lg font-medium transition-colors"
                >
                  {processing ? 'Processing...' : 'Distribute Profit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
