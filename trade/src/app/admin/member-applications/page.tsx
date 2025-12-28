"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Member Applications Page
 * 
 * This page redirects to /admin/kyc-review which handles both individual 
 * and corporate investor profile reviews with full support for the new 
 * individual_investor_profiles and corporate_investor_profiles collections.
 */
export default function AdminMemberApplicationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/kyc-review");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
        <p className="text-neutral-600 dark:text-neutral-400">Redirecting to KYC Review...</p>
      </div>
    </div>
  );
}
