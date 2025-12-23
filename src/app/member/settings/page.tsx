"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, getDoc, setDoc, signOut } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { InvestorProfile } from "@/schemas";

type User = {
  key: string;
} | null | undefined;

export default function SettingsPage() {
  const [user, setUser] = useState<User>(undefined);
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');
  const router = useRouter();

  // Profile form state
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [investmentAlerts, setInvestmentAlerts] = useState(true);

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
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user || user === null) return;
    
    try {
      setLoading(true);
      
      let profileDoc = await getDoc<InvestorProfile>({
        collection: "individual_investor_profiles",
        key: user.key,
      });
      
      if (!profileDoc) {
        profileDoc = await getDoc<InvestorProfile>({
          collection: "corporate_investor_profiles",
          key: user.key,
        });
      }

      if (profileDoc) {
        const profile = profileDoc.data;
        setInvestorProfile(profile);
        
        // Populate form fields
        setEmail(profile.email);
        setPhone(profile.phone);
        
        if (profile.investorType === 'individual') {
          setStreet(profile.address.street);
          setCity(profile.address.city);
          setState(profile.address.state || '');
          setCountry(profile.address.country);
          setPostalCode(profile.address.postalCode || '');
        } else {
          setStreet(profile.registeredAddress.street);
          setCity(profile.registeredAddress.city);
          setState(profile.registeredAddress.state || '');
          setCountry(profile.registeredAddress.country);
          setPostalCode(profile.registeredAddress.postalCode || '');
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !investorProfile || saving) return;

    try {
      setSaving(true);

      const collection = investorProfile.investorType === 'individual' 
        ? "individual_investor_profiles" 
        : "corporate_investor_profiles";

      const updatedProfile: InvestorProfile = {
        ...investorProfile,
        email,
        phone,
        ...(investorProfile.investorType === 'individual' 
          ? {
              address: {
                street,
                city,
                state,
                country,
                postalCode,
              }
            }
          : {
              registeredAddress: {
                street,
                city,
                state,
                country,
                postalCode,
              }
            }
        ),
      };

      const profileDoc = await getDoc({
        collection,
        key: user.key,
      });

      if (profileDoc) {
        await setDoc({
          collection,
          doc: {
            key: user.key,
            data: updatedProfile,
            version: profileDoc.version,
          }
        });

        alert("Profile updated successfully!");
        await fetchProfile();
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      "Are you sure you want to delete your account? This action cannot be undone and you will lose all your data."
    );

    if (confirmed) {
      const doubleCheck = confirm(
        "This is your final warning. Deleting your account is permanent. Are you absolutely sure?"
      );

      if (doubleCheck) {
        alert("Account deletion is currently disabled. Please contact support to delete your account.");
        // In production, this would trigger an account deletion request
      }
    }
  };

  if (user === undefined || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading settings...</p>
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
                    Settings
                  </h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Manage your account
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </button>

                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === 'preferences'
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Preferences
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === 'security'
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Security
                </button>
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Profile Information</h2>
                
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Basic Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Full Name / Company Name
                        </label>
                        <input
                          type="text"
                          disabled
                          value={investorProfile?.investorType === 'individual' 
                            ? investorProfile.fullName 
                            : investorProfile?.companyName || ''}
                          className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                        />
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          Contact support to change your name
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          required
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Address</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Street Address
                        </label>
                        <input
                          type="text"
                          required
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            required
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            State/Province
                          </label>
                          <input
                            type="text"
                            required
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            required
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white font-semibold rounded-lg transition-colors"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Notification Preferences</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4 border-b border-neutral-200 dark:border-neutral-800">
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white">Email Notifications</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Receive updates via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-neutral-200 dark:border-neutral-800">
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white">SMS Notifications</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Receive updates via SMS</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smsNotifications}
                        onChange={(e) => setSmsNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-neutral-200 dark:border-neutral-800">
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white">Investment Alerts</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Get notified about new opportunities</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={investmentAlerts}
                        onChange={(e) => setInvestmentAlerts(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white">Marketing Emails</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Receive promotional content</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={marketingEmails}
                        onChange={(e) => setMarketingEmails(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    onClick={() => alert("Preferences saved!")}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Security Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">Authentication Method</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                        You're currently signed in with Internet Identity
                      </p>
                      <div className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
                        <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <div>
                          <p className="font-medium text-primary-900 dark:text-primary-100">Secure Authentication</p>
                          <p className="text-xs text-primary-700 dark:text-primary-300">Decentralized identity - no passwords needed</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">Active Sessions</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                        Manage devices where you're currently logged in
                      </p>
                      <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <p className="font-medium text-neutral-900 dark:text-white">Current Device</p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">Active now</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 text-xs font-semibold rounded-full">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-error-900 dark:text-error-100 mb-2">Danger Zone</h3>
                  <p className="text-sm text-error-700 dark:text-error-300 mb-4">
                    Once you delete your account, there is no going back. All your data will be permanently removed.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-error-600 hover:bg-error-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
