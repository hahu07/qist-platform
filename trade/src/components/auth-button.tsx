"use client";

import { signOut, onAuthStateChange, type User } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";

export function AuthButton() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => setUser(user));
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Loading state
  if (user === undefined) {
    return (
      <div className="h-11 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
    );
  }

  // Signed in state
  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
              {user.key.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <span className="text-sm text-neutral-600 dark:text-neutral-400 max-w-[120px] truncate">
            {user.key.slice(0, 8)}...
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium rounded-lg transition-colors text-sm"
        >
          Sign Out
        </button>
      </div>
    );
  }

  // Sign in options
  return (
    <Link
      href="/auth/signin"
      className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md text-sm"
    >
      Sign In
    </Link>
  );
}
