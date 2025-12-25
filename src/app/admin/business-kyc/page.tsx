"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { initSatellite, onAuthStateChange, signOut, listDocs, setDoc, uploadFile, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BusinessProfile } from "@/schemas";
import { kycRejectionReasons } from "@/schemas/business-profile.schema";

type User = {
  key: string;
} | null | undefined;

type BusinessDoc = Doc<any>;

export default function BusinessKYCReviewPage() {
  const [user, setUser] = useState<User>(undefined);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [businessDocs, setBusinessDocs] = useState<BusinessDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ type: 'kyc' | 'document', data: any } | null>(null);
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
      fetchBusinesses();
    }
  }, [user]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      
      // Fetch all business profiles from Juno (including pending approval)
      let profiles: any[] = [];
      try {
        const profilesResult = await listDocs<BusinessProfile>({ collection: "business_profiles", filter: {} });
        profiles = ((profilesResult && profilesResult.items) || []).map((item: any) => ({
          ...item,
          data: { ...item.data, isPending: item.data.accountStatus === 'pending-approval' }
        }));
        console.log("📋 Fetched business profiles from Juno:", profiles.length);
      } catch (err) {
        console.log("No business_profiles collection found:", err);
      }
      
      console.log("📋 Total business profiles:", profiles.length);

      // Fetch all business KYC documents from Juno
      let kycDocs: BusinessDoc[] = [];
      try {
        const kycDocsResult = await listDocs<any>({ collection: "business_kyc_documents", filter: {} });
        kycDocs = (kycDocsResult && kycDocsResult.items) || [];
        console.log("📋 Fetched KYC documents:", kycDocs.length);
      } catch (err) {
        console.log("No business_kyc_documents collection found:", err);
      }

      // Merge profiles with documents
      const businessesWithDocs = profiles.map((profile: any) => {
        const related = kycDocs.filter((d) => d.data.businessId === profile.key);
        
        // Determine KYC status
        let kycStatus = profile.data.kycStatus || 'pending';
        if (related.length === 0) {
          kycStatus = profile.data.kycDocumentsUploaded ? 'in-review' : 'pending';
        } else {
          if (related.some((d: any) => d.data.status === 'rejected')) kycStatus = 'rejected';
          else if (related.every((d: any) => d.data.status === 'verified') && related.length > 0) kycStatus = 'verified';
          else if (related.some((d: any) => d.data.status === 'verified')) kycStatus = 'in-review';
        }
        
        return {
          ...profile,
          _docCount: related.length,
          _docs: related,
          _derivedStatus: kycStatus
        };
      });

      console.log("✅ Final businesses with data:", businessesWithDocs.length, businessesWithDocs);
      setBusinesses(businessesWithDocs);
      setBusinessDocs(kycDocs);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveKYC = async (business: any) => {
    try {
      const isPending = (business.data as any).isPending;
      
      if (isPending) {
        // This is a pending business - update status to active
        const profileData = {
          ...business.data,
          kycStatus: 'verified',
          kycVerifiedAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          approvedBy: user?.key || 'admin',
          accountStatus: 'active', // Change from pending-approval to active
          updatedAt: new Date().toISOString(),
        };
        
        // Remove isPending flag
        delete (profileData as any).isPending;
        
        // Update profile in Juno
        await setDoc({
          collection: "business_profiles",
          doc: {
            key: business.key,
            data: profileData,
            version: business.version,
          },
        });
        
        // Upload documents with base64 URLs to Juno Storage
        // Get all documents for this business
        try {
          const docsResult = await listDocs<any>({ collection: "business_kyc_documents", filter: {} });
          const businessDocs = (docsResult.items || []).filter((doc: any) => doc.data.businessId === business.key);
          
          console.log(`📤 Uploading ${businessDocs.length} documents to Juno Storage for business ${business.key}`);
          
          for (const doc of businessDocs) {
            try {
              // Check if fileUrl is base64 (starts with data:)
              if (doc.data.fileUrl.startsWith('data:')) {
                // Convert base64 to blob
                const response = await fetch(doc.data.fileUrl);
                const blob = await response.blob();
                const file = new File([blob], doc.data.fileName, { type: doc.data.mimeType });
                
                // Upload to Juno Storage
                const uploadResult = await uploadFile({
                  collection: "business_kyc_files",
                  data: file,
                });
                
                // Update document metadata with actual URL
                await setDoc({
                  collection: "business_kyc_documents",
                  doc: {
                    key: doc.key,
                    data: {
                      ...doc.data,
                      fileUrl: uploadResult.downloadUrl, // Replace base64 with actual URL
                      status: 'verified',
                      reviewedAt: new Date().toISOString(),
                      reviewedBy: user?.key || 'admin',
                    },
                    version: doc.version,
                  },
                });
                
                console.log(`✅ Uploaded ${doc.data.fileName}`);
              } else {
                // Document already has a real URL, just update status
                await setDoc({
                  collection: "business_kyc_documents",
                  doc: {
                    key: doc.key,
                    data: {
                      ...doc.data,
                      status: 'verified',
                      reviewedAt: new Date().toISOString(),
                      reviewedBy: user?.key || 'admin',
                    },
                    version: doc.version,
                  },
                });
              }
            } catch (uploadError) {
              console.error(`Failed to upload ${doc.data.fileName}:`, uploadError);
              // Continue with other documents even if one fails
            }
          }
        } catch (docError) {
          console.error('Error processing documents:', docError);
        }
        
      } else {
        // Already in Juno - just update
        await setDoc({
          collection: "business_profiles",
          doc: {
            key: business.key,
            data: {
              ...business.data,
              kycStatus: 'verified',
              kycVerifiedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            version: business.version,
          },
        });
      }

      alert('Business KYC approved successfully!');
      fetchBusinesses();
      setSelectedBusiness(null);
    } catch (error) {
      console.error('Error approving KYC:', error);
      alert('Failed to approve KYC');
    }
  };

  const handleRejectKYC = async (business: any) => {
    setRejectTarget({ type: 'kyc', data: business });
    setShowRejectModal(true);
  };

  const handleRejectDocument = async (doc: BusinessDoc) => {
    setRejectTarget({ type: 'document', data: doc });
    setShowRejectModal(true);
  };

  const processRejection = async (reason: string, allowsResubmit: boolean) => {
    if (!rejectTarget) return;

    try {
      if (rejectTarget.type === 'kyc') {
        const business = rejectTarget.data;
        await setDoc({
          collection: "business_profiles",
          doc: {
            key: business.key,
            data: {
              ...business.data,
              kycStatus: 'rejected',
              kycRejectionReason: reason,
              kycRejectionAllowsResubmit: allowsResubmit,
              updatedAt: new Date().toISOString(),
            },
            version: business.version,
          },
        });

        alert(allowsResubmit 
          ? 'Business KYC rejected. User can resubmit documents.' 
          : 'Business KYC permanently rejected. User cannot resubmit.'
        );
      } else {
        const doc = rejectTarget.data;
        await setDoc({
          collection: "business_kyc_documents",
          doc: {
            key: doc.key,
            data: {
              ...doc.data,
              status: 'rejected',
              rejectionReason: reason,
              rejectionAllowsResubmit: allowsResubmit,
              reviewedAt: new Date().toISOString(),
              reviewedBy: user?.key,
            },
            version: doc.version,
          },
        });

        alert(allowsResubmit 
          ? 'Document rejected. User can re-upload this document.' 
          : 'Document permanently rejected.'
        );
      }

      fetchBusinesses();
      setSelectedBusiness(null);
      setShowRejectModal(false);
      setRejectTarget(null);
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Failed to process rejection');
    }
  };

  const handleApproveDocument = async (doc: BusinessDoc) => {
    try {
      await setDoc({
        collection: "business_kyc_documents",
        doc: {
          key: doc.key,
          data: {
            ...doc.data,
            status: 'verified',
            reviewedAt: new Date().toISOString(),
            reviewedBy: user?.key,
          },
          version: doc.version,
        },
      });

      alert('Document verified successfully!');
      fetchBusinesses();
    } catch (error) {
      console.error('Error verifying document:', error);
      alert('Failed to verify document');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300';
      case 'rejected': return 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300';
      case 'in-review': return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300';
      default: return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-300';
    }
  };

  const filteredBusinesses = businesses.filter(business => {
    const matchesStatus = filterStatus === 'all' || business._derivedStatus === filterStatus;
    const matchesSearch = searchQuery === '' || 
      business.data.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.data.businessEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.data.businessPhone?.includes(searchQuery) ||
      business.data.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.data.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.data.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.data.registrationNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: businesses.length,
    pending: businesses.filter(b => b._derivedStatus === 'pending').length,
    inReview: businesses.filter(b => b._derivedStatus === 'in-review').length,
    verified: businesses.filter(b => b._derivedStatus === 'verified').length,
    rejected: businesses.filter(b => b._derivedStatus === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading business KYC data...</p>
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
                <span className="font-display font-bold text-xl text-neutral-900 dark:text-white">Business KYC</span>
              </Link>
              
              <div className="hidden md:flex items-center gap-2">
                <Link href="/admin/dashboard" className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link href="/admin/kyc-review" className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Member KYC
                </Link>
                <Link href="/admin/business-kyc" className="px-4 py-2 text-primary-600 dark:text-primary-400 font-semibold">
                  Business KYC
                </Link>
                <Link href="/admin/business-applications" className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Applications
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button onClick={handleSignOut} className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-4">
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.total}</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Businesses</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-4">
            <div className="text-2xl font-bold text-neutral-600 dark:text-neutral-400">{stats.pending}</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Pending</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-warning-200 dark:border-warning-800 p-4">
            <div className="text-2xl font-bold text-warning-600 dark:text-warning-400">{stats.inReview}</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">In Review</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-success-200 dark:border-success-800 p-4">
            <div className="text-2xl font-bold text-success-600 dark:text-success-400">{stats.verified}</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Verified</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-error-200 dark:border-error-800 p-4">
            <div className="text-2xl font-bold text-error-600 dark:text-error-400">{stats.rejected}</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Rejected</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 mb-6">
          <div className="p-6 flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by name, email, phone, city, or registration..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-review">In Review</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Business Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Business</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Documents</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                      No businesses found
                    </td>
                  </tr>
                ) : (
                  filteredBusinesses.map((business) => (
                    <tr key={business.key} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{business.data.businessName}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                            {business.data.businessType?.replace(/-/g, ' ')}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-neutral-900 dark:text-white">{business.data.businessEmail}</p>
                          <p className="text-neutral-500 dark:text-neutral-400">{business.data.businessPhone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-neutral-900 dark:text-white font-medium">{business.data.city || 'N/A'}</p>
                          <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                            {business.data.state}{business.data.state && business.data.country ? ', ' : ''}{business.data.country}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-neutral-900 dark:text-white">{business._docCount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(business._derivedStatus)}`}>
                          {business._derivedStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedBusiness(business)}
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

      {/* Business Detail Modal */}
      {selectedBusiness && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b-2 border-neutral-200 dark:border-neutral-800 p-6 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {selectedBusiness.data.businessName}
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
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-4 text-lg">Business Profile</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400 text-xs">Business Name</label>
                    <p className="font-medium text-neutral-900 dark:text-white mt-1">{selectedBusiness.data.businessName}</p>
                  </div>
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400 text-xs">Registration Number</label>
                    <p className="font-medium text-neutral-900 dark:text-white mt-1">{selectedBusiness.data.registrationNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400 text-xs">Email</label>
                    <p className="font-medium text-neutral-900 dark:text-white mt-1">{selectedBusiness.data.businessEmail}</p>
                  </div>
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400 text-xs">Phone</label>
                    <p className="font-medium text-neutral-900 dark:text-white mt-1">{selectedBusiness.data.businessPhone}</p>
                  </div>
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400 text-xs">Business Type</label>
                    <p className="font-medium text-neutral-900 dark:text-white mt-1 capitalize">{selectedBusiness.data.businessType?.replace(/-/g, ' ')}</p>
                  </div>
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400 text-xs">Industry</label>
                    <p className="font-medium text-neutral-900 dark:text-white mt-1 capitalize">{selectedBusiness.data.industry}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-neutral-600 dark:text-neutral-400 text-xs">Business Address</label>
                    <p className="font-medium text-neutral-900 dark:text-white mt-1">{selectedBusiness.data.businessAddress}</p>
                  </div>
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400 text-xs">City</label>
                    <p className="font-medium text-neutral-900 dark:text-white mt-1">{selectedBusiness.data.city}</p>
                  </div>
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400 text-xs">State</label>
                    <p className="font-medium text-neutral-900 dark:text-white mt-1">{selectedBusiness.data.state}</p>
                  </div>
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400 text-xs">Country</label>
                    <p className="font-medium text-neutral-900 dark:text-white mt-1">{selectedBusiness.data.country}</p>
                  </div>
                  <div>
                    <label className="text-neutral-600 dark:text-neutral-400 text-xs">Year Established</label>
                    <p className="font-medium text-neutral-900 dark:text-white mt-1">{selectedBusiness.data.yearEstablished}</p>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-4 text-lg">KYC Documents</h4>
                {selectedBusiness._docs && selectedBusiness._docs.length > 0 ? (
                  <div className="space-y-3">
                    {selectedBusiness._docs.map((doc: any) => (
                      <div key={doc.key} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white text-sm capitalize">
                              {doc.data.documentType.replace(/-/g, ' ')}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{doc.data.fileName}</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(doc.data.status)}`}>
                              {doc.data.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={doc.data.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            View
                          </a>
                          {doc.data.status === 'verified' ? (
                            <button
                              disabled
                              className="px-3 py-1 bg-success-600 text-white rounded-lg text-sm cursor-not-allowed opacity-75"
                            >
                              ✓ Verified
                            </button>
                          ) : doc.data.status === 'rejected' ? (
                            <button
                              disabled
                              className="px-3 py-1 bg-error-600 text-white rounded-lg text-sm cursor-not-allowed opacity-75"
                            >
                              ✗ Rejected
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleApproveDocument(doc)}
                                className="px-3 py-1 bg-success-600 hover:bg-success-700 text-white rounded-lg text-sm transition-colors"
                              >
                                Verify
                              </button>
                              <button
                                onClick={() => handleRejectDocument(doc)}
                                className="px-3 py-1 bg-error-600 hover:bg-error-700 text-white rounded-lg text-sm transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg text-center">
                    <p className="text-warning-800 dark:text-warning-300">No documents uploaded yet</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={() => setSelectedBusiness(null)}
                  className="flex-1 px-4 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                >
                  Close
                </button>
                {selectedBusiness._derivedStatus !== 'verified' && selectedBusiness._derivedStatus !== 'rejected' && (
                  <>
                    <button
                      onClick={() => handleApproveKYC(selectedBusiness)}
                      className="flex-1 px-4 py-3 bg-success-600 hover:bg-success-700 text-white rounded-lg font-medium transition-colors"
                    >
                      ✓ Approve KYC
                    </button>
                    <button
                      onClick={() => handleRejectKYC(selectedBusiness)}
                      className="flex-1 px-4 py-3 bg-error-600 hover:bg-error-700 text-white rounded-lg font-medium transition-colors"
                    >
                      ✗ Reject KYC
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                {rejectTarget.type === 'kyc' ? 'Reject Business KYC' : 'Reject Document'}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Select rejection reason and type
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Resubmittable Reasons */}
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-warning-500 rounded-full"></span>
                  Fixable Issues (User Can Resubmit)
                </h4>
                <div className="space-y-2">
                  {kycRejectionReasons.resubmittable.map((reason) => (
                    <button
                      key={reason.value}
                      onClick={() => processRejection(reason.label, true)}
                      className="w-full text-left px-4 py-3 bg-warning-50 dark:bg-warning-900/20 hover:bg-warning-100 dark:hover:bg-warning-900/30 border border-warning-200 dark:border-warning-800 rounded-lg transition-colors"
                    >
                      <p className="text-sm font-medium text-warning-900 dark:text-warning-100">
                        {reason.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Permanent Rejection Reasons */}
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-error-500 rounded-full"></span>
                  Permanent Rejection (No Resubmission)
                </h4>
                <div className="space-y-2">
                  {kycRejectionReasons.permanent.map((reason) => (
                    <button
                      key={reason.value}
                      onClick={() => {
                        if (confirm(`PERMANENT REJECTION: "${reason.label}"\n\nThe user will NOT be able to resubmit. Continue?`)) {
                          processRejection(reason.label, false);
                        }
                      }}
                      className="w-full text-left px-4 py-3 bg-error-50 dark:bg-error-900/20 hover:bg-error-100 dark:hover:bg-error-900/30 border border-error-200 dark:border-error-800 rounded-lg transition-colors"
                    >
                      <p className="text-sm font-medium text-error-900 dark:text-error-100">
                        {reason.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectTarget(null);
                }}
                className="w-full px-4 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
