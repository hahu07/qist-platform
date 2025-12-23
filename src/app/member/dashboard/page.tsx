"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { KYCAlert } from "@/components/kyc-alert";
import { DataSeeder } from "@/components/data-seeder";
import { InvestmentModal } from "@/components/investment-modal";
import { initSatellite, onAuthStateChange, getDoc, listDocs, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { InvestorProfile, Investment, OpportunityFormData, Notification } from "@/schemas";
import { useNotifications } from "@/hooks/useNotifications";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/utils/notification-actions";
import { downloadInvestmentCertificate, type CertificateData } from "@/utils/pdf-generator";

type User = {
  key: string;
} | null | undefined;

interface PortfolioStats {
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  activeInvestments: number;
  pendingReturns: number;
  businessPool: {
    invested: number;
    returns: number;
    activeCount: number;
  };
  cryptoPool: {
    invested: number;
    returns: number;
    activeCount: number;
  };
}

interface InvestmentWithDetails extends Investment {
  key: string; // Document key/ID
  businessName: string;
  contractType: string;
  industry: string;
  performanceStatus: "performing-well" | "on-track" | "needs-attention";
  termMonths?: number; // Optional term duration in months
}

interface BusinessProfile {
  businessName: string;
  legalEntityType: string;
  registrationNumber: string;
  industry: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  contactInformation: {
    email: string;
    phone: string;
  };
}

export default function MemberDashboardPage() {
  const [user, setUser] = useState<User>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications, unreadCount, loading: notificationsLoading, refetch: refetchNotifications } = useNotifications(user?.key);
  const [kycStatus, setKycStatus] = useState<"pending" | "in-review" | "verified" | "rejected">("pending");
  const [loading, setLoading] = useState(true);
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null);
  const [investments, setInvestments] = useState<InvestmentWithDetails[]>([]);
  const [opportunities, setOpportunities] = useState<Doc<OpportunityFormData>[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<{ data: OpportunityFormData; id: string } | null>(null);
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats>({
    totalInvested: 0,
    currentValue: 0,
    totalReturns: 0,
    activeInvestments: 0,
    pendingReturns: 0,
    businessPool: {
      invested: 0,
      returns: 0,
      activeCount: 0,
    },
    cryptoPool: {
      invested: 0,
      returns: 0,
      activeCount: 0,
    },
  });
  const router = useRouter();

  useEffect(() => {
    (async () =>
      await initSatellite({
        workers: {
          auth: true,
        },
      }))();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
    });

    return () => unsubscribe();
  }, [router]);

  // Helper function to determine investment performance status
  const getPerformanceStatus = (investment: Investment): "performing-well" | "on-track" | "needs-attention" => {
    if (investment.status === "active" && investment.actualReturn && investment.expectedReturn) {
      const performance = (investment.actualReturn / investment.expectedReturn) * 100;
      if (performance >= 100) return "performing-well";
      if (performance >= 80) return "on-track";
    }
    return "needs-attention";
  };

  // Fetch investor profile and investments
  useEffect(() => {
    if (!user || user === null) return;

    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user || user === null) return;
    
    try {
      setLoading(true);

      // Fetch investor profile - try individual first, then corporate
      let profileDoc = await getDoc({
        collection: "individual_investor_profiles",
        key: user.key,
      });
      
      if (!profileDoc) {
        profileDoc = await getDoc({
          collection: "corporate_investor_profiles",
          key: user.key,
        });
      }

        if (profileDoc) {
          const profile = profileDoc.data as InvestorProfile;
          setInvestorProfile(profile);
          setKycStatus(profile.kycStatus);
        }

        // Fetch user's investments
        const investmentsResult = await listDocs({
          collection: "investments",
        });

        if (investmentsResult && investmentsResult.items) {
          // Filter investments for current user
          const userInvestments = investmentsResult.items.filter(
            (item) => (item.data as Investment).investorId === user.key
          );
          // Fetch business details for each investment
          const investmentData = await Promise.all(
            userInvestments.map(async (item) => {
              const investment = item.data as Investment;
              
              // Fetch business profile for this investment
              let businessProfile: BusinessProfile | null = null;
              let contractType = "Musharakah"; // Default
              
              try {
                // Get the application to find business ID
                const applicationDoc = await getDoc({
                  collection: "applications",
                  key: investment.applicationId,
                });

                if (applicationDoc) {
                  const appData = applicationDoc.data as any;
                  contractType = appData.contractType || "Musharakah";
                  
                  // Fetch business profile
                  if (appData.businessId) {
                    const businessDoc = await getDoc({
                      collection: "business_profiles",
                      key: appData.businessId,
                    });

                    if (businessDoc) {
                      businessProfile = businessDoc.data as BusinessProfile;
                    }
                  }
                }
              } catch (err) {
                console.error("Error fetching business details:", err);
              }

              return {
                ...investment,
                key: item.key, // Include document key
                businessName: businessProfile?.businessName || `Business ${investment.applicationId.slice(0, 8)}`,
                contractType,
                industry: businessProfile?.industry || "General",
                performanceStatus: getPerformanceStatus(investment),
              } as InvestmentWithDetails;
            })
          );

          setInvestments(investmentData);
          calculatePortfolioStats(investmentData);
        }

        // Fetch active investment opportunities
        const opportunitiesResult = await listDocs<OpportunityFormData>({
          collection: "opportunities",
        });

        console.log("📊 Opportunities fetched:", opportunitiesResult?.items?.length || 0);

        if (opportunitiesResult && opportunitiesResult.items) {
          // Filter active opportunities and sort by featured first, then by creation date
          const activeOpportunities = opportunitiesResult.items.filter(
            (opp) => opp.data.status === "active"
          );
          
          console.log("✅ Active opportunities:", activeOpportunities.length);
          console.log("Opportunities data:", activeOpportunities.map(o => ({
            name: o.data.businessName,
            status: o.data.status,
            featured: o.data.featured
          })));
          
          const sortedOpportunities = activeOpportunities.sort((a, b) => {
            if (a.data.featured && !b.data.featured) return -1;
            if (!a.data.featured && b.data.featured) return 1;
            return Number(b.created_at) - Number(a.created_at);
          });
          
          // Limit to 4 opportunities for dashboard preview
          setOpportunities(sortedOpportunities.slice(0, 4));
        }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePortfolioStats = (investmentData: InvestmentWithDetails[]) => {
    const stats = investmentData.reduce((acc, inv) => {
      const invested = inv.amount;
      const returns = inv.actualReturn || inv.expectedReturn || 0;
      const currentValue = invested + returns;
      const isActive = inv.status === "active";

      // Update pool-specific stats
      if (inv.pool === "business") {
        acc.businessPool.invested += invested;
        acc.businessPool.returns += returns;
        if (isActive) acc.businessPool.activeCount += 1;
      } else if (inv.pool === "crypto") {
        acc.cryptoPool.invested += invested;
        acc.cryptoPool.returns += returns;
        if (isActive) acc.cryptoPool.activeCount += 1;
      }

      return {
        ...acc,
        totalInvested: acc.totalInvested + invested,
        currentValue: acc.currentValue + currentValue,
        totalReturns: acc.totalReturns + returns,
        activeInvestments: isActive ? acc.activeInvestments + 1 : acc.activeInvestments,
        pendingReturns: acc.pendingReturns + (inv.expectedReturn || 0),
      };
    }, {
      totalInvested: 0,
      currentValue: 0,
      totalReturns: 0,
      activeInvestments: 0,
      pendingReturns: 0,
      businessPool: {
        invested: 0,
        returns: 0,
        activeCount: 0,
      },
      cryptoPool: {
        invested: 0,
        returns: 0,
        activeCount: 0,
      },
    });

    setPortfolioStats(stats);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportReport = () => {
    // Create CSV content
    const csvContent = [
      ['Portfolio Report', `Generated: ${new Date().toLocaleDateString()}`],
      [],
      ['Summary'],
      ['Total Invested', formatCurrency(portfolioStats.totalInvested)],
      ['Current Value', formatCurrency(portfolioStats.currentValue)],
      ['Total Returns', formatCurrency(portfolioStats.totalReturns)],
      ['Active Investments', portfolioStats.activeInvestments.toString()],
      [],
      ['Business Pool'],
      ['Invested', formatCurrency(portfolioStats.businessPool.invested)],
      ['Returns', formatCurrency(portfolioStats.businessPool.returns)],
      ['Active Count', portfolioStats.businessPool.activeCount.toString()],
      [],
      ['Crypto Pool'],
      ['Invested', formatCurrency(portfolioStats.cryptoPool.invested)],
      ['Returns', formatCurrency(portfolioStats.cryptoPool.returns)],
      ['Active Count', portfolioStats.cryptoPool.activeCount.toString()],
      [],
      ['Investments'],
      ['Business Name', 'Amount', 'Contract Type', 'Pool', 'Status', 'Returns'],
      ...investments.map(inv => [
        inv.businessName,
        inv.amount.toString(),
        inv.contractType,
        inv.pool,
        inv.status,
        (inv.actualReturn || inv.expectedReturn || 0).toString()
      ])
    ].map(row => row.join(',')).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleNotificationClick = async (notification: Doc<Notification>) => {
    // Mark as read if unread
    if (!notification.data.read && notification.version) {
      await markNotificationAsRead(notification.key, notification.version);
      refetchNotifications();
    }

    // Navigate to action URL if provided
    if (notification.data.actionUrl) {
      router.push(notification.data.actionUrl);
      setNotificationsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifs = notifications
      .filter((n) => !n.data.read)
      .map((n) => ({ key: n.key, version: n.version }));

    if (unreadNotifs.length > 0) {
      await markAllNotificationsAsRead(unreadNotifs);
      refetchNotifications();
    }
  };

  const handleGenerateCertificate = (investment: InvestmentWithDetails) => {
    const investedAmount = investment.amount;
    const expectedReturn = investment.expectedReturn || 0;
    
    const certificateData: CertificateData = {
      certificateNumber: `QIST-${investment.key.substring(0, 12).toUpperCase()}`,
      investorName: getUserDisplayName(),
      investmentAmount: investedAmount,
      businessName: investment.businessName || `Business ${investment.applicationId.substring(0, 8)}`,
      contractType: investment.contractType || "Partnership",
      investmentDate: investment.allocationDate 
        ? new Date(Number(investment.allocationDate)).toLocaleDateString("en-NG", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : new Date().toLocaleDateString("en-NG", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
      expectedReturn,
      termMonths: investment.termMonths || 12,
      pool: investment.pool,
    };

    downloadInvestmentCertificate(certificateData);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "profit_distribution":
        return (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "new_opportunity":
        return (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "investment_milestone":
        return (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case "kyc_update":
        return (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case "deposit_confirmed":
      case "withdrawal_processed":
        return (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case "business_update":
        return (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case "system_announcement":
        return (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "profit_distribution":
        return "from-business-600 to-business-700";
      case "new_opportunity":
        return "from-primary-600 to-primary-700";
      case "investment_milestone":
        return "from-success-600 to-success-700";
      case "kyc_update":
        return "from-purple-600 to-purple-700";
      case "deposit_confirmed":
      case "withdrawal_processed":
        return "from-success-600 to-success-700";
      case "business_update":
        return "from-blue-600 to-blue-700";
      case "system_announcement":
        return "from-neutral-600 to-neutral-700";
      default:
        return "from-neutral-600 to-neutral-700";
    }
  };

  const formatNotificationTime = (timestamp: bigint | undefined): string => {
    if (!timestamp) return "Just now";
    
    const date = new Date(Number(timestamp) / 1000000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  };

  const formatPercentage = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Calculate portfolio distribution by contract type
  const getPortfolioDistribution = () => {
    const distribution: Record<string, { amount: number; count: number; color: string; name: string }> = {};
    
    investments.forEach((inv) => {
      const type = inv.contractType || "Musharakah";
      if (!distribution[type]) {
        distribution[type] = {
          amount: 0,
          count: 0,
          color: type === "Musharakah" ? "#10b981" : type === "Murabaha" ? "#3b82f6" : "#8b5cf6",
          name: type === "Musharakah" ? "Musharakah Partnership" : type === "Murabaha" ? "Murabaha Financing" : "Ijarah Lease"
        };
      }
      distribution[type].amount += inv.amount;
      distribution[type].count += 1;
    });

    const total = Object.values(distribution).reduce((sum, item) => sum + item.amount, 0);
    
    return Object.entries(distribution).map(([type, data]) => ({
      type,
      ...data,
      percentage: total > 0 ? (data.amount / total) * 100 : 0
    }));
  };

  const portfolioDistribution = getPortfolioDistribution();
  const totalPortfolioValue = portfolioDistribution.reduce((sum, item) => sum + item.amount, 0);

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getUserDisplayName = (): string => {
    if (!investorProfile) return "Investor";
    if (investorProfile.investorType === "individual") {
      return investorProfile.fullName.split(" ")[0]; // First name
    }
    return investorProfile.companyName;
  };

  if (user === undefined || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign in if not authenticated
  if (user === null) {
    router.push("/auth/signin");
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Dev Dashboard Switcher */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-100 dark:bg-amber-900/30 border-b border-amber-300 dark:border-amber-800">
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">DEV MODE:</span>
            <span className="px-3 py-1 bg-business-600 text-white text-xs font-medium rounded">
              Member ✓
            </span>
            <a href="/waqf/dashboard" className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-xs font-medium rounded transition-colors">
              Waqf
            </a>
            <a href="/business/dashboard" className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-xs font-medium rounded transition-colors">
              Business
            </a>
            <a href="/admin/dashboard" className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-xs font-medium rounded transition-colors">
              Admin
            </a>
            <a href="/" className="ml-auto px-3 py-1 border border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-xs font-medium rounded transition-colors">
              ← Home
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-2xl flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {mobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 top-[49px]"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-[49px] bottom-0 w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 overflow-y-auto z-50 transition-transform duration-300 lg:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-business-600 to-business-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-neutral-900 dark:text-white">AmanaTrade</h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Investor Portal</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="space-y-1.5">
            <Link
              href="#portfolio"
              className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-600/30 dark:shadow-primary-400/20 group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              My Portfolio
              <span className="ml-auto bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold">8</span>
            </Link>
            <Link
              href="#opportunities"
              className="flex items-center gap-3 px-5 py-3.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl font-medium transition-all group hover:pl-6"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Opportunities
            </Link>
            <Link
              href="/member/transactions"
              className="flex items-center gap-3 px-4 py-3 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Transaction History
            </Link>
            <Link
              href="/member/wallet"
              className="flex items-center gap-3 px-5 py-3.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl font-medium transition-all group hover:pl-6"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              My Wallet
            </Link>
            <Link
              href="/member/kyc"
              className="flex items-center gap-3 px-5 py-3.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl font-medium transition-all group hover:pl-6"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              KYC Documents
            </Link>
            <Link
              href="/member/documents"
              className="flex items-center gap-3 px-5 py-3.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl font-medium transition-all group hover:pl-6"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              My Documents
            </Link>
            <Link
              href="/member/settings"
              className="flex items-center gap-3 px-5 py-3.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl font-medium transition-all group hover:pl-6"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          </nav>

          {/* Bottom Actions */}
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2">
            <div className="mb-3">
              <ThemeToggle />
            </div>
            <AuthButton />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 mt-[49px]">
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Left Content Area */}
          <div className="flex-1 p-4 md:p-6 lg:p-8 lg:pr-4">
            {/* Welcome Header */}
            <div className="mb-6 md:mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                    {getGreeting()}, <span className="text-business-600 dark:text-business-400">{getUserDisplayName()}</span>
                  </h1>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {investorProfile ? `Your portfolio has ${portfolioStats.activeInvestments} active investment${portfolioStats.activeInvestments !== 1 ? 's' : ''}` : "Here's your portfolio performance overview"}
                  </p>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  {/* Mobile Notifications Button */}
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="lg:hidden relative px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-primary-600 dark:hover:border-primary-400 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-neutral-700 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-business-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  <button onClick={handleExportReport} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-primary-600 dark:hover:border-primary-400 rounded-lg text-xs md:text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Report
                  </button>
                  <Link href="/member/wallet" className="px-3 md:px-4 py-2 bg-business-600 hover:bg-business-700 text-white rounded-lg text-xs md:text-sm font-semibold transition-colors inline-block text-center">
                    + Add Funds
                  </Link>
                </div>
              </div>
            </div>

            {/* KYC Alert */}
            <KYCAlert kycStatus={kycStatus} />

            {/* Mobile Notifications Dropdown */}
            {notificationsOpen && (
              <div className="lg:hidden fixed inset-x-4 top-20 z-50 mb-6">
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 shadow-2xl max-h-[70vh] overflow-hidden">
                  <div className="p-4 border-b-2 border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        </div>
                        <h3 className="font-bold text-base text-neutral-900 dark:text-white">Notifications</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <span className="px-2.5 py-1 bg-business-100 dark:bg-business-900/30 text-business-700 dark:text-business-300 text-xs font-bold rounded-lg shadow-sm">
                            {unreadCount}
                          </span>
                        )}
                        <button
                          onClick={() => setNotificationsOpen(false)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
                    {notificationsLoading ? (
                      <div className="p-8 text-center">
                        <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-neutral-500">Loading notifications...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">No notifications yet</p>
                        <p className="text-xs text-neutral-500">You'll see updates about your investments here</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification.key}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer ${
                              notification.data.read ? "opacity-60" : ""
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className={`w-10 h-10 bg-gradient-to-br ${getNotificationColor(notification.data.type)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                {getNotificationIcon(notification.data.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="font-semibold text-sm text-neutral-900 dark:text-white">{notification.data.title}</p>
                                  <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                    {formatNotificationTime(notification.created_at)}
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2 line-clamp-2">{notification.data.message}</p>
                                {!notification.data.read && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium rounded">
                                    <span className="w-1.5 h-1.5 bg-primary-600 rounded-full"></span>
                                    New
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-4 border-t-2 border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-900/50 flex gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl transition-colors text-sm"
                        >
                          Mark All Read
                        </button>
                      )}
                      <Link
                        href="/member/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors text-sm text-center"
                      >
                        View All
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Portfolio Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-900/50 rounded-2xl p-4 md:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs md:text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">Total Invested</p>
                <p className="font-mono font-bold text-2xl md:text-3xl text-neutral-900 dark:text-white">
                  {formatCurrency(portfolioStats.totalInvested)}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  Across {portfolioStats.activeInvestments} investment{portfolioStats.activeInvestments !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="bg-gradient-to-br from-white to-success-50/30 dark:from-neutral-900 dark:to-neutral-900/50 rounded-2xl p-6 border border-success-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="px-2 py-1 bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 text-xs font-semibold rounded-full">
                    {formatPercentage((portfolioStats.currentValue - portfolioStats.totalInvested) / portfolioStats.totalInvested * 100 || 0)}
                  </span>
                </div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">Current Value</p>
                <p className="font-mono font-bold text-3xl text-success-600 dark:text-success-400">
                  {formatCurrency(portfolioStats.currentValue)}
                </p>
                <p className="text-xs text-success-600 dark:text-success-400 mt-2">
                  ↑ {formatCurrency(portfolioStats.currentValue - portfolioStats.totalInvested)} gain
                </p>
              </div>

              <div className="bg-gradient-to-br from-white to-business-50/30 dark:from-neutral-900 dark:to-neutral-900/50 rounded-2xl p-6 border border-business-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-business-100 dark:bg-business-900/30 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-business-600 dark:text-business-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">Total Returns</p>
                <p className="font-mono font-bold text-3xl text-business-600 dark:text-business-400">
                  +{formatCurrency(portfolioStats.totalReturns)}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  Average {((portfolioStats.totalReturns / portfolioStats.totalInvested) * 100 || 0).toFixed(1)}% ROI
                </p>
              </div>

              <div className="bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-900/50 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-secondary-600 dark:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">Active Investments</p>
                <p className="font-mono font-bold text-3xl text-neutral-900 dark:text-white">{portfolioStats.activeInvestments}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  {investments.filter(inv => inv.status === "pending").length} pending approval
                </p>
              </div>
            </div>

            {/* Pool Breakdown */}
            <div className="mb-6 md:mb-8">
              <h3 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-white mb-4">Investment Pool Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Business Pool Card */}
                <div className="bg-gradient-to-br from-success-50 to-white dark:from-success-900/10 dark:to-neutral-900 rounded-2xl border-2 border-success-200 dark:border-success-800/50 p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-success-500 dark:bg-success-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-neutral-900 dark:text-white">Business Pool</h4>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">Traditional business investments</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 text-xs font-bold rounded-full">
                      {portfolioStats.businessPool.activeCount} Active
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-success-200 dark:border-success-800/30">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Total Invested</span>
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">
                        {formatCurrency(portfolioStats.businessPool.invested)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-success-200 dark:border-success-800/30">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Returns Earned</span>
                      <span className="font-mono font-bold text-success-600 dark:text-success-400">
                        +{formatCurrency(portfolioStats.businessPool.returns)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">ROI</span>
                      <span className="font-mono font-bold text-success-600 dark:text-success-400">
                        {portfolioStats.businessPool.invested > 0 
                          ? ((portfolioStats.businessPool.returns / portfolioStats.businessPool.invested) * 100).toFixed(2)
                          : '0.00'}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-success-200 dark:border-success-800/30">
                    <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                      <span>Portfolio Share</span>
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {portfolioStats.totalInvested > 0 
                          ? ((portfolioStats.businessPool.invested / portfolioStats.totalInvested) * 100).toFixed(1)
                          : '0'}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-success-500 to-success-600 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${portfolioStats.totalInvested > 0 
                            ? (portfolioStats.businessPool.invested / portfolioStats.totalInvested) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Crypto Pool Card */}
                <div className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-neutral-900 rounded-2xl border-2 border-purple-200 dark:border-purple-800/50 p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-500 dark:bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-neutral-900 dark:text-white">Crypto Pool</h4>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">Digital asset investments</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-full">
                      {portfolioStats.cryptoPool.activeCount} Active
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-purple-200 dark:border-purple-800/30">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Total Invested</span>
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">
                        {formatCurrency(portfolioStats.cryptoPool.invested)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-purple-200 dark:border-purple-800/30">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Returns Earned</span>
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        +{formatCurrency(portfolioStats.cryptoPool.returns)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">ROI</span>
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        {portfolioStats.cryptoPool.invested > 0 
                          ? ((portfolioStats.cryptoPool.returns / portfolioStats.cryptoPool.invested) * 100).toFixed(2)
                          : '0.00'}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800/30">
                    <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                      <span>Portfolio Share</span>
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {portfolioStats.totalInvested > 0 
                          ? ((portfolioStats.cryptoPool.invested / portfolioStats.totalInvested) * 100).toFixed(1)
                          : '0'}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${portfolioStats.totalInvested > 0 
                            ? (portfolioStats.cryptoPool.invested / portfolioStats.totalInvested) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* My Investments */}
            <div className="mb-6 md:mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white mb-1">My Active Investments</h2>
                  <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400">Manage and monitor your portfolio performance</p>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <select className="px-3 md:px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs md:text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-600">
                    <option>All Pools</option>
                    <option>Business Pool</option>
                    <option>Crypto Pool</option>
                  </select>
                  <select className="px-3 md:px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs md:text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-600">
                    <option>All Contracts</option>
                    <option>Musharakah</option>
                    <option>Murabaha</option>
                    <option>Ijarah</option>
                  </select>
                  <button className="px-3 md:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs md:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap">
                    + New Investment
                  </button>
                </div>
              </div>

              {/* Portfolio Distribution Chart */}
              <div className="bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-900/50 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-4 md:p-6 lg:p-8 mb-6">
                <h3 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-white mb-4 md:mb-6">Portfolio Distribution</h3>
                {portfolioDistribution.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-neutral-600 dark:text-neutral-400">No investments yet. Start building your portfolio!</p>
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
                    {/* Pie Chart */}
                    <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0">
                      <svg viewBox="0 0 200 200" className="transform -rotate-90">
                        {(() => {
                          const radius = 80;
                          const circumference = 2 * Math.PI * radius;
                          let cumulativeOffset = 0;

                          return portfolioDistribution.map((item, index) => {
                            const dashArray = (item.percentage / 100) * circumference;
                            const dashOffset = -cumulativeOffset;
                            cumulativeOffset += dashArray;

                            return (
                              <circle
                                key={item.type}
                                cx="100"
                                cy="100"
                                r={radius}
                                fill="transparent"
                                stroke={item.color}
                                strokeWidth="40"
                                strokeDasharray={`${dashArray} ${circumference}`}
                                strokeDashoffset={dashOffset}
                                className="transition-all duration-300 hover:stroke-width-[45] cursor-pointer"
                              />
                            );
                          });
                        })()}
                      </svg>
                      {/* Center Label */}
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <p className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">
                          {formatCurrency(totalPortfolioValue)}
                        </p>
                        <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400">Total Value</p>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 w-full space-y-3 md:space-y-4">
                      {portfolioDistribution.map((item) => (
                        <div
                          key={item.type}
                          className="flex items-center justify-between p-3 md:p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-2 md:gap-3">
                            <div
                              className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <div>
                              <p className="font-semibold text-sm md:text-base text-neutral-900 dark:text-white">
                                {item.name}
                              </p>
                              <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                                {item.count} investment{item.count !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-base md:text-lg text-neutral-900 dark:text-white">
                              {formatCurrency(item.amount)}
                            </p>
                            <p
                              className="text-xs md:text-sm font-semibold"
                              style={{ color: item.color }}
                            >
                              {item.percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Investment List - Dynamic */}
              {investments.length === 0 ? (
                // Empty State
                <div className="bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center">
                  <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-neutral-400 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
                    No Active Investments Yet
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
                    Start building your Shariah-compliant investment portfolio by exploring available opportunities.
                  </p>
                  <Link
                    href="#opportunities"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Browse Investment Opportunities
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {investments.map((investment, index) => {
                    const investedAmount = investment.amount;
                    const returns = investment.actualReturn || investment.expectedReturn || 0;
                    const currentValue = investedAmount + returns;
                    const returnPercentage = ((returns / investedAmount) * 100).toFixed(2);

                    return (
                      <div
                        key={index}
                        className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-4 md:p-6 lg:p-8 hover:shadow-2xl hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-300 group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 md:mb-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 md:gap-4 mb-3">
                              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-business-600 to-business-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="font-bold text-lg md:text-xl text-neutral-900 dark:text-white mb-1">
                                  {investment.businessName || `Business ${investment.applicationId.substring(0, 8)}`}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                  <span className="inline-flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {investment.contractType || "Partnership"}
                                  </span>
                                  <span className="text-neutral-400">•</span>
                                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {investment.industry || "Business"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <span className={`px-3 py-1.5 text-sm font-semibold rounded-lg ${
                            investment.performanceStatus === "performing-well"
                              ? "bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300"
                              : investment.performanceStatus === "on-track"
                              ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                              : "bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300"
                          }`}>
                            {investment.performanceStatus === "performing-well" && "✓ Performing Well"}
                            {investment.performanceStatus === "on-track" && "→ On Track"}
                            {investment.performanceStatus === "needs-attention" && "⚠ Needs Attention"}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-4 md:mb-6 pb-4 md:pb-6 border-b border-neutral-200 dark:border-neutral-800">
                          <div>
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">Your Investment</p>
                            <p className="font-mono font-bold text-base md:text-lg text-neutral-900 dark:text-white">
                              {formatCurrency(investedAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">Current Value</p>
                            <p className="font-mono font-bold text-base md:text-lg text-success-600 dark:text-success-400">
                              {formatCurrency(currentValue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">Total Returns</p>
                            <p className="font-mono font-bold text-base md:text-lg text-business-600 dark:text-business-400">
                              +{formatCurrency(returns)}
                            </p>
                            <p className="text-xs text-business-600 dark:text-business-400">
                              {returnPercentage}% gain
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">Status</p>
                            <p className="font-semibold text-base md:text-lg text-neutral-900 dark:text-white capitalize">
                              {investment.status}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {investment.pool === "business" ? "Business Pool" : "Crypto Pool"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
                          <Link href={`/member/performance?id=${investment.key}`} className="w-full sm:flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm md:text-base font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all text-center">
                            View Performance Report
                          </Link>
                          <button
                            onClick={() => handleGenerateCertificate(investment)}
                            className="w-full sm:w-auto px-4 md:px-6 py-2.5 md:py-3 bg-success-600 hover:bg-success-700 active:bg-success-800 text-white text-sm md:text-base font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all whitespace-nowrap flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Certificate
                          </button>
                          <Link href={`/member/details?id=${investment.key}`} className="w-full sm:w-auto px-4 md:px-6 py-2.5 md:py-3 border-2 border-neutral-300 dark:border-neutral-700 hover:border-primary-600 dark:hover:border-primary-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm md:text-base font-medium rounded-xl transform hover:-translate-y-0.5 transition-all whitespace-nowrap text-center">
                            Transaction History
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Investment Opportunities */}
            <div className="mb-6 md:mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2">New Investment Opportunities</h2>
                  <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400">Vetted businesses seeking Shariah-compliant financing</p>
                </div>
                <Link href="#opportunities" className="px-4 md:px-5 py-2 md:py-2.5 bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 hover:border-primary-600 dark:hover:border-primary-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl font-semibold text-sm md:text-base text-primary-600 dark:text-primary-400 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 whitespace-nowrap">
                  Browse All Opportunities
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {opportunities.length === 0 ? (
                <div className="bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center">
                  <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-neutral-400 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
                    No Opportunities Available
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
                    New investment opportunities will appear here once businesses are approved by admins.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {opportunities.map((opportunity, index) => {
                    const fundingPercentage = (opportunity.data.currentFunding / opportunity.data.fundingGoal) * 100;
                    const daysRemaining = Math.ceil((new Date(opportunity.data.campaignDeadline.split('-').reverse().join('-')).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    
                    const contractColors = {
                      musharakah: { border: "business", gradient: "from-business-600 via-business-500 to-business-700", hover: "hover:border-business-400 dark:hover:border-business-600" },
                      mudarabah: { border: "primary", gradient: "from-primary-600 via-primary-500 to-primary-700", hover: "hover:border-primary-400 dark:hover:border-primary-600" },
                      murabaha: { border: "success", gradient: "from-success-600 via-success-500 to-success-700", hover: "hover:border-success-400 dark:hover:border-success-600" },
                      ijarah: { border: "violet", gradient: "from-violet-600 via-violet-500 to-violet-700", hover: "hover:border-violet-400 dark:hover:border-violet-600" }
                    };
                    
                    const colors = contractColors[opportunity.data.contractType] || contractColors.musharakah;

                    return (
                      <div
                        key={opportunity.key}
                        className={`bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-2xl ${colors.hover} transition-all duration-300 group`}
                      >
                        <div className={`h-2 bg-gradient-to-r ${colors.gradient} group-hover:h-3 transition-all`}></div>
                        <div className="p-4 md:p-6 lg:p-8">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className={`font-bold text-xl text-neutral-900 dark:text-white mb-2 group-hover:text-${colors.border}-600 dark:group-hover:text-${colors.border}-400 transition-colors`}>
                                {opportunity.data.businessName}
                              </h3>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 capitalize mb-2">
                                {opportunity.data.contractType.replace('-', ' ')} • {opportunity.data.industry}
                              </p>
                              {opportunity.data.location && (
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {opportunity.data.location}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {opportunity.data.featured && (
                                <span className={`px-3 py-1.5 bg-${colors.border}-100 dark:bg-${colors.border}-900/30 text-${colors.border}-700 dark:text-${colors.border}-300 text-xs font-bold rounded-lg`}>
                                  ⭐ FEATURED
                                </span>
                              )}
                              {/* Risk Badge */}
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                opportunity.data.riskRating === "low"
                                  ? "bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300"
                                  : opportunity.data.riskRating === "high"
                                  ? "bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300"
                                  : "bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300"
                              }`}>
                                {opportunity.data.riskRating === "low" ? "🟢" : opportunity.data.riskRating === "high" ? "🔴" : "🟡"} {opportunity.data.riskRating?.toUpperCase() || "MODERATE"}
                              </span>
                            </div>
                          </div>

                          {/* Description Preview */}
                          {opportunity.data.description && (
                            <div className="mb-4">
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {opportunity.data.description.split(' ').length > 50
                                  ? opportunity.data.description.split(' ').slice(0, 50).join(' ') + '...'
                                  : opportunity.data.description}
                              </p>
                              {opportunity.data.description.split(' ').length > 50 && (
                                <button
                                  onClick={() => setSelectedOpportunity({ data: opportunity.data, id: opportunity.key })}
                                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline mt-1 font-medium"
                                >
                                  Read more
                                </button>
                              )}
                            </div>
                          )}

                          <div className="mb-6">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="font-medium text-neutral-600 dark:text-neutral-400">Funding Progress</span>
                              <span className="font-mono font-bold text-neutral-900 dark:text-white">
                                ₦{opportunity.data.currentFunding.toLocaleString()} / ₦{opportunity.data.fundingGoal.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-3 overflow-hidden">
                              <div className={`bg-gradient-to-r ${colors.gradient} h-3 rounded-full ${fundingPercentage > 0 ? 'animate-pulse' : ''}`} style={{ width: `${Math.min(fundingPercentage, 100)}%` }}></div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <p className={`text-xs font-medium text-${colors.border}-600 dark:text-${colors.border}-400`}>
                                {fundingPercentage.toFixed(0)}% funded
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                ⏱ {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Expired'}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-neutral-200 dark:border-neutral-800">
                            <div>
                              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Min. Investment</p>
                              <p className="font-mono font-bold text-neutral-900 dark:text-white">
                                ₦{opportunity.data.minimumInvestment.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Expected Return</p>
                              <p className={`font-mono font-bold text-${colors.border}-600 dark:text-${colors.border}-400`}>
                                {opportunity.data.expectedReturnMin}-{opportunity.data.expectedReturnMax}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Term</p>
                              <p className="font-mono font-bold text-neutral-900 dark:text-white">
                                {opportunity.data.termMonths} mo
                              </p>
                            </div>
                          </div>

                          <button 
                            className={`w-full px-6 py-4 bg-${colors.border}-600 hover:bg-${colors.border}-700 active:bg-${colors.border}-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group`}
                            onClick={() => setSelectedOpportunity({ data: opportunity.data, id: opportunity.key })}
                          >
                            <span>Invest Now</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Notifications Sidebar */}
          <div className="hidden lg:block w-80 p-8 pl-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 shadow-2xl sticky top-[81px] overflow-hidden">
              <div className="p-6 border-b-2 border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-lg text-neutral-900 dark:text-white">Notifications</h3>
                  </div>
                  {unreadCount > 0 && (
                    <span className="px-3 py-1.5 bg-business-100 dark:bg-business-900/30 text-business-700 dark:text-business-300 text-xs font-bold rounded-lg shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="divide-y divide-neutral-200 dark:divide-neutral-800 max-h-[600px] overflow-y-auto">
                {notificationsLoading ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-neutral-500">Loading...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">No notifications yet</p>
                    <p className="text-xs text-neutral-500">You'll see updates about your investments here</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.key}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-5 hover:bg-gradient-to-r hover:from-neutral-50 hover:to-transparent dark:hover:from-neutral-800/50 dark:hover:to-transparent transition-all cursor-pointer border-l-4 ${
                        notification.data.read ? "border-transparent opacity-60" : "border-primary-500"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 bg-gradient-to-br ${getNotificationColor(notification.data.type)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <div className="w-4 h-4">
                            {getNotificationIcon(notification.data.type)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-neutral-900 dark:text-white mb-1.5">
                            {notification.data.title}
                          </h4>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2 leading-relaxed">
                            {notification.data.message}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 font-medium">
                            {formatNotificationTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-semibold rounded-lg transition-colors"
                    >
                      Mark All Read
                    </button>
                  )}
                  <Link
                    href="/member/notifications"
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors text-center"
                  >
                    See All
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Development Data Seeder (only show in dev mode) */}
      {process.env.NODE_ENV === "development" && user && (
        <DataSeeder userId={user.key} />
      )}

      {/* Investment Modal */}
      {selectedOpportunity && user && investorProfile && (
        <InvestmentModal
          opportunity={selectedOpportunity.data}
          opportunityId={selectedOpportunity.id}
          userId={user.key}
          userType={investorProfile.investorType}
          onClose={() => setSelectedOpportunity(null)}
          onSuccess={() => {
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}
