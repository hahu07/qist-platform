"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { initSatellite, onAuthStateChange, signOut, listDocs, setDoc, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { InvestorProfile } from "@/schemas";

type User = {
  key: string;
} | null | undefined;

type Investor = Doc<InvestorProfile>;
type BusinessApp = Doc<any>;
type BusinessDoc = Doc<any>;

export default function KYCReviewPage() {
  const [user, setUser] = useState<User>(undefined);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [businesses, setBusinesses] = useState<BusinessApp[]>([]);
  const [businessDocs, setBusinessDocs] = useState<BusinessDoc[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessApp | null>(null);
  const [businessFilter, setBusinessFilter] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingExpiry, setEditingExpiry] = useState<BusinessDoc | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState<string>('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAuditTimeline, setShowAuditTimeline] = useState(false);
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
      fetchInvestors();
      fetchBusinesses();
    }
  }, [user]);

  const fetchInvestors = async () => {
    try {
      setLoading(true);
      
      // Try fetching from individual profiles first
      let allInvestors: Investor[] = [];
      
      try {
        const individualResult = await listDocs<InvestorProfile>({
          collection: "individual_investor_profiles",
          filter: {}
        });
        if (individualResult && individualResult.items) {
          allInvestors = [...allInvestors, ...individualResult.items];
        }
      } catch (err) {
        console.log("No individual_investor_profiles collection found");
      }

      try {
        const corporateResult = await listDocs<InvestorProfile>({
          collection: "corporate_investor_profiles",
          filter: {}
        });
        if (corporateResult && corporateResult.items) {
          allInvestors = [...allInvestors, ...corporateResult.items];
        }
      } catch (err) {
        console.log("No corporate_investor_profiles collection found");
      }

      console.log("📋 KYC Review - Investors fetched:", allInvestors.length);
      setInvestors(allInvestors);
    } catch (error) {
      console.error("Error fetching investors:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinesses = async () => {
    try {
      // Fetch all business profiles
      let profiles: any[] = [];
      try {
        const profilesResult = await listDocs<any>({ collection: "business_profiles", filter: {} });
        profiles = (profilesResult && profilesResult.items) || [];
        console.log("📋 Fetched business profiles:", profiles.length, profiles);
      } catch (err) {
        console.log("No business_profiles collection found:", err);
      }

      // Fetch all business applications
      const appsResult = await listDocs<any>({ collection: "business_applications", filter: {} });
      const apps = (appsResult && appsResult.items) || [];
      console.log("📋 Fetched business applications:", apps.length);

      // Fetch all business KYC documents (from business_kyc_documents collection)
      let kycDocs: BusinessDoc[] = [];
      try {
        const kycDocsResult = await listDocs<any>({ collection: "business_kyc_documents", filter: {} });
        kycDocs = (kycDocsResult && kycDocsResult.items) || [];
        console.log("📋 Fetched KYC documents:", kycDocs.length);
      } catch (err) {
        console.log("No business_kyc_documents collection found:", err);
      }

      // Fetch all business document metadata (legacy)
      let docs: BusinessDoc[] = [];
      try {
        const docsResult = await listDocs<any>({ collection: "business_document_metadata", filter: {} });
        docs = (docsResult && docsResult.items) || [];
        console.log("📋 Fetched document metadata:", docs.length);
      } catch (err) {
        console.log("No business_document_metadata collection found:", err);
      }

      // Merge KYC docs with legacy docs
      const allDocs = [...kycDocs, ...docs];

      // Merge profiles with applications and attach derived status
      const businessesWithData = profiles.map((profile: any) => {
        // Find matching application if exists
        const matchingApp = apps.find((app: any) => app.key === profile.key || app.owner === profile.key);
        
        // Find related documents (by businessId)
        const related = allDocs.filter((d) => d.data.businessId === profile.key);
        
        // Determine KYC status
        let kycStatus = profile.data.kycStatus || 'pending';
        if (related.length === 0) kycStatus = profile.data.kycDocumentsUploaded ? 'in-review' : 'pending';
        if (related.some((d) => d.data.status === 'rejected')) kycStatus = 'rejected';
        if (related.every((d) => d.data.status === 'verified') && related.length > 0) kycStatus = 'verified';
        
        return {
          ...profile,
          data: {
            ...profile.data,
            ...(matchingApp?.data || {}), // Merge application data if exists
          },
          _docCount: related.length,
          _docs: related,
          _derivedStatus: kycStatus,
          _hasApplication: !!matchingApp
        } as BusinessApp & any;
      });

      console.log("✅ Final businesses with data:", businessesWithData.length, businessesWithData);
      setBusinesses(businessesWithData);
      setBusinessDocs(allDocs);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const logsResult = await listDocs<any>({ collection: 'document_audit_logs', filter: {} });
      const logs = (logsResult && logsResult.items || []).sort((a: any, b: any) => 
        new Date(b.data.timestamp).getTime() - new Date(a.data.timestamp).getTime()
      );
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Business document handlers
  const handleApproveBusinessDoc = async (doc: BusinessDoc) => {
    try {
      await setDoc({
        collection: 'business_document_metadata',
        doc: {
          key: doc.key,
          data: {
            ...doc.data,
            status: 'verified',
            verifiedAt: new Date().toISOString()
          },
          version: doc.version
        }
      });

      // Audit log
      await setDoc({
        collection: 'document_audit_logs',
        doc: {
          key: `audit_${doc.key}_${Date.now()}`,
          data: {
            action: 'verify',
            documentKey: doc.key,
            applicationId: doc.data.applicationId,
            admin: user?.key || 'admin',
            timestamp: new Date().toISOString(),
          }
        }
      });

      // Recompute application status based on all related docs
      const relatedResult = await listDocs<any>({ collection: 'business_document_metadata' });
      const related = (relatedResult && relatedResult.items || []).filter((d: any) => d.data.applicationId === doc.data.applicationId);
      const allVerified = related.length > 0 && related.every((d: any) => d.data.status === 'verified');
      const anyRejected = related.some((d: any) => d.data.status === 'rejected');

      try {
        const appResult = await listDocs<any>({ collection: 'business_applications' });
        const app = appResult.items.find((a: any) => a.key === doc.data.applicationId);
        if (app) {
          await setDoc({
            collection: 'business_applications',
            doc: {
              key: app.key,
              data: {
                ...app.data,
                documentsVerified: allVerified,
                documentsStatus: anyRejected ? 'rejected' : allVerified ? 'verified' : 'in-review',
                documentsVerifiedAt: allVerified ? new Date().toISOString() : app.data.documentsVerifiedAt || null,
              },
              version: app.version
            }
          });
        }
      } catch (err) {
        console.warn('Could not update business application status', err);
      }

      // Notification for business
      await setDoc({
        collection: 'notifications',
        doc: {
          key: `notif_${doc.data.applicationId}_${Date.now()}`,
          data: {
            type: 'document_verified',
            applicationId: doc.data.applicationId,
            documentKey: doc.key,
            message: `A document was verified for ${doc.data.businessName || doc.data.applicationId}`,
            read: false,
            createdAt: new Date().toISOString()
          }
        }
      });

      await fetchBusinesses();
      alert('Document verified');
    } catch (error) {
      console.error('Error verifying document:', error);
      alert('Failed to verify document');
    }
  };

  const handleRejectBusinessDoc = async (doc: BusinessDoc) => {
    try {
      await setDoc({
        collection: 'business_document_metadata',
        doc: {
          key: doc.key,
          data: {
            ...doc.data,
            status: 'rejected',
            rejectedAt: new Date().toISOString()
          },
          version: doc.version
        }
      });

      // Audit log
      await setDoc({
        collection: 'document_audit_logs',
        doc: {
          key: `audit_${doc.key}_${Date.now()}`,
          data: {
            action: 'reject',
            documentKey: doc.key,
            applicationId: doc.data.applicationId,
            admin: user?.key || 'admin',
            timestamp: new Date().toISOString(),
          }
        }
      });

      // Recompute application status
      const relatedResult = await listDocs<any>({ collection: 'business_document_metadata' });
      const related = (relatedResult && relatedResult.items || []).filter((d: any) => d.data.applicationId === doc.data.applicationId);
      const allVerified = related.length > 0 && related.every((d: any) => d.data.status === 'verified');
      const anyRejected = related.some((d: any) => d.data.status === 'rejected');

      try {
        const appResult = await listDocs<any>({ collection: 'business_applications' });
        const app = appResult.items.find((a: any) => a.key === doc.data.applicationId);
        if (app) {
          await setDoc({
            collection: 'business_applications',
            doc: {
              key: app.key,
              data: {
                ...app.data,
                documentsVerified: allVerified,
                documentsStatus: anyRejected ? 'rejected' : allVerified ? 'verified' : 'in-review',
              },
              version: app.version
            }
          });
        }
      } catch (err) {
        console.warn('Could not update business application status', err);
      }

      // Notification for business
      await setDoc({
        collection: 'notifications',
        doc: {
          key: `notif_${doc.data.applicationId}_${Date.now()}`,
          data: {
            type: 'document_rejected',
            applicationId: doc.data.applicationId,
            documentKey: doc.key,
            message: `A document was rejected for ${doc.data.businessName || doc.data.applicationId}`,
            read: false,
            createdAt: new Date().toISOString()
          }
        }
      });

      await fetchBusinesses();
      alert('Document rejected');
    } catch (error) {
      console.error('Error rejecting document:', error);
      alert('Failed to reject document');
    }
  };

  const handleUpdateExpiry = async () => {
    if (!editingExpiry || !newExpiryDate) return;
    try {
      await setDoc({
        collection: 'business_document_metadata',
        doc: {
          key: editingExpiry.key,
          data: {
            ...editingExpiry.data,
            expiryDate: newExpiryDate
          },
          version: editingExpiry.version
        }
      });
      await fetchBusinesses();
      setEditingExpiry(null);
      setNewExpiryDate('');
      alert('Expiry date updated');
    } catch (error) {
      console.error('Error updating expiry:', error);
      alert('Failed to update expiry date');
    }
  };

  const getInvestorName = (investor: Investor): string => {
    return investor.data.investorType === 'individual' 
      ? investor.data.fullName 
      : investor.data.companyName;
  };

  const filteredInvestors = investors.filter(investor => {
    const matchesStatus = filterStatus === 'all' || investor.data.kycStatus === filterStatus;
    const name = getInvestorName(investor);
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         investor.data.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         investor.data.phone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const handleApproveKYC = async (investor: Investor) => {
    try {
      const collection = investor.data.investorType === 'individual' 
        ? "individual_investor_profiles" 
        : "corporate_investor_profiles";
        
      await setDoc({
        collection,
        doc: {
          key: investor.key,
          data: {
            ...investor.data,
            kycStatus: 'verified'
          },
          version: investor.version
        }
      });
      
      await fetchInvestors();
      setSelectedInvestor(null);
      alert(`KYC approved for ${getInvestorName(investor)}`);
    } catch (error) {
      console.error('Error approving KYC:', error);
      alert('Failed to approve KYC. Please try again.');
    }
  };

  const handleRejectKYC = async (investor: Investor) => {
    try {
      const collection = investor.data.investorType === 'individual' 
        ? "individual_investor_profiles" 
        : "corporate_investor_profiles";
        
      await setDoc({
        collection,
        doc: {
          key: investor.key,
          data: {
            ...investor.data,
            kycStatus: 'rejected'
          },
          version: investor.version
        }
      });
      
      await fetchInvestors();
      setSelectedInvestor(null);
      alert(`KYC rejected for ${getInvestorName(investor)}`);
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      alert('Failed to reject KYC. Please try again.');
    }
  };

  const handleRequestInfo = async (investor: Investor) => {
    try {
      const collection = investor.data.investorType === 'individual' 
        ? "individual_investor_profiles" 
        : "corporate_investor_profiles";
        
      await setDoc({
        collection,
        doc: {
          key: investor.key,
          data: {
            ...investor.data,
            kycStatus: 'pending'
          },
          version: investor.version
        }
      });
      
      await fetchInvestors();
      alert(`More information requested from ${getInvestorName(investor)}`);
    } catch (error) {
      console.error('Error requesting info:', error);
      alert('Failed to request more information. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400';
      case 'pending':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400';
      case 'rejected':
        return 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400';
      default:
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400';
    }
  };

  const getRiskColor = (profile: string) => {
    switch (profile) {
      case 'conservative':
        return 'text-success-600 dark:text-success-400';
      case 'moderate':
        return 'text-warning-600 dark:text-warning-400';
      case 'aggressive':
        return 'text-error-600 dark:text-error-400';
      default:
        return 'text-neutral-600 dark:text-neutral-400';
    }
  };

  if (user === undefined || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>
        </div>

        {/* Business Documents Review */}
        <div className="mt-8 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Business Documents Review</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Review submitted business documents and verify or reject them.</p>
          </div>
          <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <label className="text-sm text-neutral-600 dark:text-neutral-400 mr-3">Filter:</label>
              <select value={businessFilter} onChange={(e) => setBusinessFilter(e.target.value)} className="px-3 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm">
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="in-review">In Review</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">{businesses.length} applications</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Business</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Documents</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {(() => {
                  const filtered = businesses.filter((b: any) => {
                    const matchesStatus = businessFilter === 'all' || b._derivedStatus === businessFilter;
                    const matchesSearch = searchQuery === '' || 
                      b.data.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      b.data.businessEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      b.data.businessPhone?.includes(searchQuery) ||
                      b.data.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      b.data.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      b.data.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      b.data.registrationNumber?.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesStatus && matchesSearch;
                  });
                  
                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">No business applications found</td>
                      </tr>
                    );
                  }
                  return filtered.map((app: any) => (
                    <tr key={app.key} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{app.data.businessName}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">{app.data.businessType ? app.data.businessType.replace(/-/g, ' ') : 'Business'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-neutral-900 dark:text-white">{app.data.businessEmail || app.data.contactEmail || ''}</p>
                          <p className="text-neutral-500 dark:text-neutral-400">{app.data.businessPhone || app.data.phone || ''}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-neutral-900 dark:text-white">{app.data.city || 'N/A'}</p>
                          <p className="text-neutral-500 dark:text-neutral-400 text-xs">{app.data.state || ''}{app.data.state && app.data.country ? ', ' : ''}{app.data.country || ''}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-neutral-900 dark:text-white">{app._docCount ?? 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${app._derivedStatus === 'verified' ? 'bg-success-100 text-success-800' : app._derivedStatus === 'rejected' ? 'bg-error-100 text-error-800' : app._derivedStatus === 'in-review' ? 'bg-warning-100 text-warning-800' : 'bg-neutral-100 text-neutral-800'}`}>{app._derivedStatus}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => setSelectedBusiness(app)} className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm">Review →</button>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
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
                    KYC Review
                  </h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Member Verification
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowAuditTimeline(true); fetchAuditLogs(); }}
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                📋 Audit Timeline
              </button>
              <Link
                href="/admin/dashboard"
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                ← Back to Dashboard
              </Link>
              <ThemeToggle />
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-error-600 dark:hover:text-error-400 transition-colors"
              >
                Sign Out
              </button>
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
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Pending KYC</span>
              <span className="text-2xl">⏳</span>
            </div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {investors.filter(i => i.data.kycStatus === 'pending' || i.data.kycStatus === 'in-review').length}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Verified</span>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-3xl font-bold text-success-600 dark:text-success-400">
              {investors.filter(i => i.data.kycStatus === 'verified').length}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Rejected</span>
              <span className="text-2xl">❌</span>
            </div>
            <p className="text-3xl font-bold text-error-600 dark:text-error-400">
              {investors.filter(i => i.data.kycStatus === 'rejected').length}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Members</span>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {investors.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'in-review', 'verified', 'rejected'].map((status) => (
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
        </div>

        {/* KYC List */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Risk Profile
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    KYC Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredInvestors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                      No members found
                    </td>
                  </tr>
                ) : (
                  filteredInvestors.map((investor) => (
                    <tr key={investor.key} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            {getInvestorName(investor)}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {investor.data.investorType === 'individual' ? 'Individual' : 'Corporate'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-neutral-900 dark:text-white">{investor.data.email}</p>
                          <p className="text-neutral-500 dark:text-neutral-400">{investor.data.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium capitalize ${getRiskColor(investor.data.riskProfile)}`}>
                          {investor.data.riskProfile}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(investor.data.kycStatus)}`}>
                          {investor.data.kycStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedInvestor(investor)}
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
      {selectedInvestor && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b-2 border-neutral-200 dark:border-neutral-800 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  KYC Review: {getInvestorName(selectedInvestor)}
                </h3>
                <button
                  onClick={() => setSelectedInvestor(null)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal/Company Information */}
              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-4">
                  {selectedInvestor.data.investorType === 'individual' ? 'Personal Information' : 'Company Information'}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      {selectedInvestor.data.investorType === 'individual' ? 'Full Name' : 'Company Name'}
                    </p>
                    <p className="font-medium text-neutral-900 dark:text-white">{getInvestorName(selectedInvestor)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Email</p>
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedInvestor.data.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Phone</p>
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedInvestor.data.phone}</p>
                  </div>
                  {selectedInvestor.data.investorType === 'individual' && selectedInvestor.data.idNumber && (
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">ID Number</p>
                      <p className="font-medium text-neutral-900 dark:text-white font-mono">{selectedInvestor.data.idNumber}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Address</p>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {selectedInvestor.data.investorType === 'individual' 
                        ? `${selectedInvestor.data.address.street}, ${selectedInvestor.data.address.city}, ${selectedInvestor.data.address.country}`
                        : `${selectedInvestor.data.registeredAddress.street}, ${selectedInvestor.data.registeredAddress.city}, ${selectedInvestor.data.registeredAddress.country}`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Investment Profile */}
              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-4">Investment Profile</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Risk Profile</p>
                    <p className={`font-medium capitalize ${getRiskColor(selectedInvestor.data.riskProfile)}`}>
                      {selectedInvestor.data.riskProfile}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">KYC Status</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedInvestor.data.kycStatus)}`}>
                      {selectedInvestor.data.kycStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* KYC Documents */}
              {selectedInvestor.data.kycDocuments && selectedInvestor.data.kycDocuments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-4">Submitted Documents</h4>
                  <div className="space-y-3">
                    {selectedInvestor.data.kycDocuments.map((doc: any, index: number) => {
                      const docType = doc.type === 'id-document' ? 'ID Document' :
                                     doc.type === 'proof-of-address' ? 'Proof of Address' :
                                     doc.type === 'selfie' ? 'Selfie Photo' :
                                     doc.type === 'source-of-funds' ? 'Source of Funds' :
                                     doc.type === 'incorporation-certificate' ? 'Incorporation Certificate' :
                                     doc.type === 'business-registration' ? 'Business Registration' :
                                     doc.type === 'rep-id' ? 'Representative ID' :
                                     doc.type === 'beneficial-owner-id' ? 'Beneficial Owner ID' :
                                     doc.type === 'business-address-proof' ? 'Business Address Proof' :
                                     doc.type === 'financial-statements' ? 'Financial Statements' :
                                     'Document';
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900 dark:text-white text-sm">{docType}</p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">{doc.fileName}</p>
                            </div>
                          </div>
                          <a
                            href={doc.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            View
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No Documents Warning */}
              {(!selectedInvestor.data.kycDocuments || selectedInvestor.data.kycDocuments.length === 0) && (
                <div className="p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-warning-800 dark:text-warning-300 text-sm mb-1">No Documents Submitted</p>
                      <p className="text-xs text-warning-700 dark:text-warning-400">
                        This member has not uploaded any KYC documents yet. Request more information to proceed with verification.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                {selectedInvestor.data.kycStatus !== 'verified' && (
                  <>
                    <button
                      onClick={() => handleApproveKYC(selectedInvestor)}
                      className="flex-1 px-4 py-3 bg-success-600 hover:bg-success-700 text-white rounded-lg font-medium transition-colors"
                    >
                      ✓ Approve KYC
                    </button>
                    {selectedInvestor.data.kycStatus !== 'rejected' && (
                      <button
                        onClick={() => handleRejectKYC(selectedInvestor)}
                        className="flex-1 px-4 py-3 bg-error-600 hover:bg-error-700 text-white rounded-lg font-medium transition-colors"
                      >
                        ✗ Reject KYC
                      </button>
                    )}
                    <button
                      onClick={() => handleRequestInfo(selectedInvestor)}
                      className="flex-1 px-4 py-3 bg-warning-600 hover:bg-warning-700 text-white rounded-lg font-medium transition-colors"
                    >
                      ℹ Request Info
                    </button>
                  </>
                )}
                {selectedInvestor.data.kycStatus === 'verified' && (
                  <div className="flex-1 px-4 py-3 bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-300 rounded-lg font-medium text-center">
                    ✓ KYC Verified
                  </div>
                )}
                {selectedInvestor.data.kycStatus === 'rejected' && (
                  <div className="flex-1 px-4 py-3 bg-error-100 dark:bg-error-900/20 text-error-700 dark:text-error-300 rounded-lg font-medium text-center">
                    ✗ KYC Rejected
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Detail Modal */}
      {selectedBusiness && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b-2 border-neutral-200 dark:border-neutral-800 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  Business Documents: {selectedBusiness.data.businessName}
                </h3>
                <button
                  onClick={() => setSelectedBusiness(null)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Business Profile Information */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Business Profile</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400">Business Name</label>
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedBusiness.data.businessName}</p>
                  </div>
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400">Registration Number</label>
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedBusiness.data.registrationNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400">Email</label>
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedBusiness.data.businessEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400">Phone</label>
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedBusiness.data.businessPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400">Business Type</label>
                    <p className="font-medium text-neutral-900 dark:text-white capitalize">{selectedBusiness.data.businessType?.replace(/-/g, ' ') || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400">Industry</label>
                    <p className="font-medium text-neutral-900 dark:text-white capitalize">{selectedBusiness.data.industry || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-neutral-600 dark:text-neutral-400">Business Address</label>
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedBusiness.data.businessAddress || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400">City</label>
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedBusiness.data.city || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400">State</label>
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedBusiness.data.state || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400">Country</label>
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedBusiness.data.country || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400">Year Established</label>
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedBusiness.data.yearEstablished || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-4">Submitted Documents</h4>
                <div className="space-y-3">
                  {(selectedBusiness as any)._docs && (selectedBusiness as any)._docs.length > 0 ? (
                    (selectedBusiness as any)._docs.map((doc: any) => {
                      const version = doc.data.version || 1;
                      const expiry = doc.data.expiryDate ? new Date(doc.data.expiryDate) : null;
                      const now = new Date();
                      const isExpired = expiry ? expiry.getTime() < now.getTime() : false;
                      const daysToExpiry = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                      const isExpiringSoon = daysToExpiry !== null && daysToExpiry <= 30 && daysToExpiry >= 0;

                      return (
                        <div key={doc.key} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900 dark:text-white text-sm">{doc.data.documentType} <span className="text-xs text-neutral-500">· v{version}</span></p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">{doc.data.fileName}</p>
                              {expiry && (
                                <p className="text-xs mt-1">
                                  {isExpired ? (
                                    <span className="px-2 py-1 text-xs rounded-full bg-error-100 text-error-700">Expired {expiry.toLocaleDateString()}</span>
                                  ) : isExpiringSoon ? (
                                    <span className="px-2 py-1 text-xs rounded-full bg-warning-100 text-warning-700">Expiring in {daysToExpiry} days</span>
                                  ) : (
                                    <span className="px-2 py-1 text-xs rounded-full bg-neutral-100 text-neutral-700">Expires {expiry.toLocaleDateString()}</span>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a href={doc.data.fileUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white text-sm font-semibold rounded-lg">View</a>
                            <button onClick={() => { setEditingExpiry(doc); setNewExpiryDate(doc.data.expiryDate || ''); }} className="px-3 py-1 bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-600 dark:hover:bg-neutral-500 text-neutral-900 dark:text-white rounded-lg text-sm">Set Expiry</button>
                            {doc.data.status !== 'verified' && (
                              <button onClick={() => handleApproveBusinessDoc(doc)} className="px-3 py-1 bg-success-600 hover:bg-success-700 text-white rounded-lg text-sm">Verify</button>
                            )}
                            {doc.data.status !== 'rejected' && (
                              <button onClick={() => handleRejectBusinessDoc(doc)} className="px-3 py-1 bg-error-600 hover:bg-error-700 text-white rounded-lg text-sm">Reject</button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">No documents submitted for this business.</div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <button onClick={() => { setSelectedBusiness(null); fetchBusinesses(); }} className="flex-1 px-4 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg font-medium">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expiry Date Setter Modal */}
      {editingExpiry && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 max-w-md w-full shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Set Expiry Date</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">Document: {editingExpiry.data.documentType}</p>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Expiry Date</label>
              <input
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => { setEditingExpiry(null); setNewExpiryDate(''); }} className="flex-1 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg font-medium">Cancel</button>
                <button onClick={handleUpdateExpiry} className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Timeline Modal */}
      {showAuditTimeline && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b-2 border-neutral-200 dark:border-neutral-800 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Document Audit Timeline</h3>
                <button onClick={() => setShowAuditTimeline(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              {auditLogs.length === 0 ? (
                <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">No audit logs found</p>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log: any) => (
                    <div key={log.key} className="flex items-start gap-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        log.data.action === 'verify' ? 'bg-success-100 dark:bg-success-900/30' : 'bg-error-100 dark:bg-error-900/30'
                      }`}>
                        {log.data.action === 'verify' ? '✓' : '✗'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-neutral-900 dark:text-white capitalize">{log.data.action}d Document</p>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">{new Date(log.data.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Application: {log.data.applicationId}</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Admin: {log.data.admin}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Document Key: {log.data.documentKey}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
