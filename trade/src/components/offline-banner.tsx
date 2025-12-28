"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[70] bg-amber-600 dark:bg-amber-700 border-b-2 border-amber-700 dark:border-amber-800 shadow-lg">
      <div className="px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          <svg className="w-5 h-5 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              You're offline
            </p>
            <p className="text-xs text-amber-100">
              Some features may be unavailable. Check your internet connection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
