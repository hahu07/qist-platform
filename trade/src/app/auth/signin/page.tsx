"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, authSubscribe, initSatellite } from "@junobuild/core";
import { getAuthRedirectUrl } from "@/utils/auth-redirect";

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customRedirect = searchParams.get("redirect");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => await initSatellite({ workers: { auth: true } }))();
  }, []);

  const handleSuccessfulSignIn = async () => {
    // Subscribe to auth changes to get user object
    let unsubscribe: (() => void) | undefined;
    
    unsubscribe = authSubscribe(async (user) => {
      if (user) {
        unsubscribe?.();
        
        // If there's a custom redirect, use it
        if (customRedirect) {
          router.push(customRedirect);
          return;
        }

        // Otherwise, check onboarding status and redirect appropriately
        const redirectUrl = await getAuthRedirectUrl(user);
        router.push(redirectUrl);
      }
    });
  };

  const handleInternetIdentity = async () => {
    try {
      setLoading(true);
      setError("");
      await signIn({ internet_identity: {} });
      await handleSuccessfulSignIn();
    } catch (err) {
      console.error("Internet Identity sign-in error:", err);
      setError("Failed to sign in with Internet Identity. Please try again.");
      setLoading(false);
    }
  };

  const handlePasskey = async () => {
    try {
      setLoading(true);
      setError("");
      await signIn({ webauthn: {} });
      await handleSuccessfulSignIn();
    } catch (err) {
      console.error("Passkey sign-in error:", err);
      setError("Failed to sign in with Passkey. Please try again or sign up first.");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      setError("");
      await signIn({ google: {
        options: {
            redirect: {
              redirectUrl: "http://localhost:3000/auth/callback/google",
            },
          },
      } });
      await handleSuccessfulSignIn();
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Failed to sign in with Google. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      {/* Header */}
      <header className="border-b-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 dark:bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-display font-bold text-xl text-neutral-900 dark:text-white">
                AmanaTrade
              </span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-3xl md:text-4xl text-neutral-900 dark:text-white mb-3">
            Welcome Back
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Sign in with the same method you used to create your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border-2 border-error-600 dark:border-error-400 rounded-lg">
            <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
          </div>
        )}

        {/* Authentication Options */}
        <div className="space-y-4">
          {/* Internet Identity */}
          <button
            onClick={handleInternetIdentity}
            disabled={loading}
            className="w-full group relative bg-white dark:bg-neutral-900 rounded-xl border-[3px] border-black dark:border-neutral-700 shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_#7888FF] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_#7888FF] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all p-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-1">
                  Internet Identity
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Decentralized blockchain authentication
                </p>
              </div>
              <svg className="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Passkey */}
          <button
            onClick={handlePasskey}
            disabled={loading}
            className="w-full group relative bg-white dark:bg-neutral-900 rounded-xl border-[3px] border-black dark:border-neutral-700 shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_#7888FF] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_#7888FF] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all p-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-1">
                  Passkey
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Biometric authentication (fingerprint/face)
                </p>
              </div>
              <svg className="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:text-success-600 dark:group-hover:text-success-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Google Sign-In */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full group relative bg-white dark:bg-neutral-900 rounded-xl border-[3px] border-black dark:border-neutral-700 shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_#7888FF] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_#7888FF] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all p-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-1">
                  Google
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Sign in with your Google account
                </p>
              </div>
              <svg className="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mt-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Don't have account */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Don't have an account?{" "}
            <Link href="/auth/signup?redirect=/onboarding" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          <p className="text-xs text-neutral-600 dark:text-neutral-400 text-center">
            💡 <strong>Tip:</strong> Use the same authentication method you used when you first created your account.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-white via-neutral-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading sign in...</p>
        </div>
      </div>
    }>
      <SignInPageContent />
    </Suspense>
  );
}
