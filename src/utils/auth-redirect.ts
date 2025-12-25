import { getDoc } from "@junobuild/core";
import type { User } from "@junobuild/core";

export interface OnboardingStatus {
  completed: boolean;
  userType?: "individual" | "corporate" | "business";
  currentStep?: number;
  profileId?: string;
  dashboardUrl: string;
}

/**
 * Check user's onboarding status and return appropriate redirect URL
 */
export async function getAuthRedirectUrl(user: User | null | undefined): Promise<string> {
  if (!user) {
    return "/auth/signin";
  }

  try {
    // PRIORITY 1: Check if user is an admin - admins bypass onboarding entirely
    const adminProfile = await getDoc({
      collection: "admin_profiles",
      key: user.key,
    });

    if (adminProfile) {
      const data = adminProfile.data as any;
      
      // Check if admin is active
      if (data.isActive === true) {
        return "/admin/dashboard";
      } else {
        // Inactive admin - show error or redirect to signin
        return "/auth/signin?error=inactive_admin";
      }
    }

    // Check if this user should be an admin but hasn't set up yet
    // You can add logic here to check a whitelist or invite system
    // For now, if user directly navigates to /admin/setup, they can create first super_admin

    // PRIORITY 2: Try to get user's investor profile - check both individual and corporate
    let investorProfile = await getDoc({
      collection: "individual_investor_profiles",
      key: user.key,
    });
    
    if (!investorProfile) {
      investorProfile = await getDoc({
        collection: "corporate_investor_profiles",
        key: user.key,
      });
    }

    if (investorProfile) {
      const data = investorProfile.data as any;
      
      // If investor profile exists, they've completed onboarding - redirect to dashboard
      // regardless of KYC status (dashboard will show KYC alert if needed)
      return "/member/dashboard";
    }

    // PRIORITY 3: Try to get user's business profile
    const businessProfile = await getDoc({
      collection: "business_profiles",
      key: user.key,
    });

    if (businessProfile) {
      const data = businessProfile.data as any;
      
      // Check accountStatus (not status) and include all valid states
      if (data.accountStatus === "active" || 
          data.accountStatus === "pending-approval" || 
          data.accountStatus === "suspended") {
        return "/business/dashboard";
      }
    }

    // No complete profile found - redirect to onboarding selection
    return "/onboarding";
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    // If there's an error, default to onboarding
    return "/onboarding";
  }
}

/**
 * Get detailed onboarding status for a user
 */
export async function getOnboardingStatus(user: User | null | undefined): Promise<OnboardingStatus> {
  const defaultStatus: OnboardingStatus = {
    completed: false,
    dashboardUrl: "/onboarding",
  };

  if (!user) {
    return defaultStatus;
  }

  try {
    // Check investor profile - both individual and corporate
    let investorProfile = await getDoc({
      collection: "individual_investor_profiles",
      key: user.key,
    });
    
    if (!investorProfile) {
      investorProfile = await getDoc({
        collection: "corporate_investor_profiles",
        key: user.key,
      });
    }

    if (investorProfile) {
      const data = investorProfile.data as any;
      // If investor profile exists, onboarding is complete
      const isCompleted = true;
      
      return {
        completed: isCompleted,
        userType: data.investorType,
        profileId: investorProfile.key,
        dashboardUrl: "/member/dashboard",
      };
    }

    // Check business profile
    const businessProfile = await getDoc({
      collection: "business_profiles",
      key: user.key,
    });

    if (businessProfile) {
      const data = businessProfile.data as any;
      const isCompleted = data.status === "active" || data.status === "pending";
      
      return {
        completed: isCompleted,
        userType: "business",
        profileId: businessProfile.key,
        dashboardUrl: isCompleted ? "/business/dashboard" : "/business/onboarding/profile",
      };
    }

    return defaultStatus;
  } catch (error) {
    console.error("Error getting onboarding status:", error);
    return defaultStatus;
  }
}
