import { setDoc } from "@junobuild/core";
import type { Investment, InvestorProfile } from "@/schemas";

/**
 * Seed sample investment data for testing the member dashboard
 * Run this once to populate the database with test data
 */

export async function seedInvestmentData(userId: string) {
  try {
    console.log("Seeding investment data for user:", userId);

    // Sample investments
    const sampleInvestments: Investment[] = [
      {
        investorId: userId,
        applicationId: "app-greentech-001",
        amount: 5000,
        pool: "business",
        status: "active",
        expectedReturn: 750,
        actualReturn: 750,
        allocationDate: BigInt(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
      },
      {
        investorId: userId,
        applicationId: "app-solar-energy-002",
        amount: 3500,
        pool: "business",
        status: "active",
        expectedReturn: 525,
        actualReturn: 450,
        allocationDate: BigInt(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      },
      {
        investorId: userId,
        applicationId: "app-islamic-school-003",
        amount: 2000,
        pool: "crypto",
        status: "active",
        expectedReturn: 200,
        actualReturn: 180,
        allocationDate: BigInt(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
      },
      {
        investorId: userId,
        applicationId: "app-tech-incubator-004",
        amount: 10000,
        pool: "business",
        status: "pending",
        expectedReturn: 1500,
        allocationDate: BigInt(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        investorId: userId,
        applicationId: "app-halal-food-005",
        amount: 4500,
        pool: "business",
        status: "active",
        expectedReturn: 580,
        actualReturn: 520,
        allocationDate: BigInt(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      },
    ];

    // Create investment documents
    for (const [index, investment] of sampleInvestments.entries()) {
      await setDoc({
        collection: "investments",
        doc: {
          key: `${userId}-investment-${index + 1}`,
          data: investment,
        },
      });
      console.log(`Created investment ${index + 1}:`, investment.applicationId);
    }

    console.log("✅ Successfully seeded investment data!");
    return true;
  } catch (error) {
    console.error("❌ Error seeding investment data:", error);
    return false;
  }
}

/**
 * Seed sample investor profile
 */
export async function seedInvestorProfile(userId: string, type: "individual" | "corporate" = "individual") {
  try {
    console.log("Seeding investor profile for user:", userId);

    if (type === "individual") {
      const profile = {
        investorType: "individual" as const,
        fullName: "Ahmad bin Abdullah",
        email: "ahmad@example.com",
        phone: "+60123456789",
        country: "Malaysia",
        nationality: "Malaysian",
        dateOfBirth: "1985-05-15",
        idType: "national-id" as const,
        idNumber: "850515-10-1234",
        address: {
          street: "Jalan Harmoni 123",
          city: "Kuala Lumpur",
          state: "Federal Territory",
          postalCode: "50000",
          country: "Malaysia",
        },
        employmentStatus: "employed" as const,
        occupation: "Software Engineer",
        employer: "Tech Solutions Sdn Bhd",
        sourceOfFunds: "salary" as const,
        isPoliticallyExposed: false,
        nextOfKin: {
          fullName: "Fatimah binti Ahmad",
          phone: "+60123456788",
        },
        riskProfile: "moderate" as const,
        businessPoolAllocation: 70,
        cryptoPoolAllocation: 30,
        kycStatus: "verified" as const,
        kycDocuments: [],
        accredited: false,
        agreeToTerms: true,
        agreeToShariah: true,
        createdAt: BigInt(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        updatedAt: BigInt(Date.now()),
      };

      await setDoc({
        collection: "individual_investor_profiles",
        doc: {
          key: userId,
          data: profile,
        },
      });
    } else {
      const profile = {
        investorType: "corporate" as const,
        companyName: "Barakah Trading Sdn Bhd",
        legalEntityType: "private-limited" as const,
        registrationNumber: "201901234567",
        registrationCountry: "Malaysia",
        incorporationDate: "2019-03-15",
        email: "info@barakahtrading.com",
        phone: "+60312345678",
        country: "Malaysia",
        registeredAddress: {
          street: "Jalan Perdagangan 88",
          city: "Kuala Lumpur",
          state: "Federal Territory",
          postalCode: "50100",
          country: "Malaysia",
        },
        industry: "Trading",
        businessDescription: "Halal food and beverage trading company specializing in wholesale distribution",
        authorizedRepresentative: {
          fullName: "Hassan bin Ibrahim",
          title: "Managing Director",
          email: "hassan@barakahtrading.com",
          phone: "+60123456789",
          idType: "national-id" as const,
          idNumber: "800315-10-5678",
          nationality: "Malaysian",
          isPoliticallyExposed: false,
        },
        beneficialOwners: [
          {
            fullName: "Hassan bin Ibrahim",
            nationality: "Malaysian",
            ownershipPercentage: 60,
            idType: "national-id" as const,
            idNumber: "800315-10-5678",
            isPoliticallyExposed: false,
          },
          {
            fullName: "Aminah binti Yusof",
            nationality: "Malaysian",
            ownershipPercentage: 40,
            idType: "national-id" as const,
            idNumber: "820520-10-9876",
            isPoliticallyExposed: false,
          },
        ],
        riskProfile: "moderate" as const,
        businessPoolAllocation: 80,
        cryptoPoolAllocation: 20,
        kycStatus: "verified" as const,
        kycDocuments: [],
        accredited: true,
        agreeToTerms: true,
        agreeToShariah: true,
        createdAt: BigInt(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
        updatedAt: BigInt(Date.now()),
      };

      await setDoc({
        collection: "corporate_investor_profiles",
        doc: {
          key: userId,
          data: profile,
        },
      });
    }

    console.log("✅ Successfully seeded investor profile!");
    return true;
  } catch (error) {
    console.error("❌ Error seeding investor profile:", error);
    return false;
  }
}

/**
 * Seed all dashboard data (profile + investments)
 */
export async function seedDashboardData(
  userId: string,
  investorType: "individual" | "corporate" = "individual"
) {
  console.log("🌱 Starting dashboard data seeding...");
  
  const profileSuccess = await seedInvestorProfile(userId, investorType);
  if (!profileSuccess) {
    console.error("Failed to seed investor profile");
    return false;
  }

  const investmentSuccess = await seedInvestmentData(userId);
  if (!investmentSuccess) {
    console.error("Failed to seed investments");
    return false;
  }

  console.log("✅ Dashboard data seeding complete!");
  return true;
}

/**
 * Seed sample notifications for testing
 */
export async function seedNotifications(userId: string) {
  try {
    console.log("📬 Seeding notification data for user:", userId);

    const now = Date.now() * 1000000; // Convert to nanoseconds
    const hour = 60 * 60 * 1000 * 1000000; // 1 hour in nanoseconds
    const day = 24 * hour; // 1 day in nanoseconds

    const sampleNotifications = [
      {
        key: `notif_${userId}_1_${Math.random().toString(36).substring(7)}`,
        data: {
          userId,
          type: "profit_distribution" as const,
          title: "Profit Distribution Received",
          message: "You've received ₦187,500 from GreenTech Manufacturing Ltd. Your quarterly returns have been credited to your wallet.",
          read: false,
          priority: "high" as const,
          actionUrl: "/member/wallet",
          metadata: {
            amount: 187500,
            investmentId: "investment-greentech-001",
          },
          createdAt: BigInt(now - 2 * hour),
        },
      },
      {
        key: `notif_${userId}_2_${Math.random().toString(36).substring(7)}`,
        data: {
          userId,
          type: "new_opportunity" as const,
          title: "New Investment Opportunity",
          message: "Tech Incubator Hub is now accepting investments. Expected return: 15-18% over 24 months. Early bird bonus available!",
          read: false,
          priority: "normal" as const,
          actionUrl: "/member/dashboard#opportunities",
          metadata: {
            opportunityId: "opp-tech-incubator-001",
          },
          createdAt: BigInt(now - 5 * hour),
        },
      },
      {
        key: `notif_${userId}_3_${Math.random().toString(36).substring(7)}`,
        data: {
          userId,
          type: "investment_milestone" as const,
          title: "Investment Milestone Reached",
          message: "Congratulations! Your total portfolio value has surpassed ₦25,000,000. Keep growing your wealth!",
          read: false,
          priority: "normal" as const,
          createdAt: BigInt(now - day),
        },
      },
      {
        key: `notif_${userId}_4_${Math.random().toString(36).substring(7)}`,
        data: {
          userId,
          type: "business_update" as const,
          title: "Business Update: Solar Energy Project",
          message: "Q4 performance report now available. The project has exceeded targets by 12% this quarter.",
          read: true,
          priority: "normal" as const,
          actionUrl: "/member/details?id=investment-solar-002",
          metadata: {
            investmentId: "investment-solar-002",
          },
          createdAt: BigInt(now - 2 * day),
          readAt: BigInt(now - day),
        },
      },
      {
        key: `notif_${userId}_5_${Math.random().toString(36).substring(7)}`,
        data: {
          userId,
          type: "kyc_update" as const,
          title: "KYC Verification Complete",
          message: "Your identity verification has been approved. You can now invest up to ₦50,000,000 per transaction.",
          read: true,
          priority: "high" as const,
          actionUrl: "/member/kyc",
          createdAt: BigInt(now - 3 * day),
          readAt: BigInt(now - 2 * day),
        },
      },
      {
        key: `notif_${userId}_6_${Math.random().toString(36).substring(7)}`,
        data: {
          userId,
          type: "deposit_confirmed" as const,
          title: "Deposit Confirmed",
          message: "Your deposit of ₦500,000 has been confirmed and added to your wallet. Ready to invest!",
          read: true,
          priority: "high" as const,
          actionUrl: "/member/wallet",
          metadata: {
            amount: 500000,
            transactionId: "txn-dep-001",
          },
          createdAt: BigInt(now - 4 * day),
          readAt: BigInt(now - 3 * day),
        },
      },
      {
        key: `notif_${userId}_7_${Math.random().toString(36).substring(7)}`,
        data: {
          userId,
          type: "system_announcement" as const,
          title: "Platform Maintenance Schedule",
          message: "Scheduled maintenance on December 25th, 2025 from 2:00 AM to 4:00 AM. All services will be temporarily unavailable.",
          read: true,
          priority: "normal" as const,
          createdAt: BigInt(now - 5 * day),
          readAt: BigInt(now - 4 * day),
        },
      },
    ];

    // Insert notifications
    for (const notification of sampleNotifications) {
      await setDoc({
        collection: "notifications",
        doc: {
          key: notification.key,
          data: notification.data as any, // Type assertion needed for union types
        },
      });
      console.log(`✅ Created notification: ${notification.data.title}`);
    }

    console.log("✅ Successfully seeded notifications!");
    return true;
  } catch (error) {
    console.error("❌ Error seeding notifications:", error);
    return false;
  }
}

/**
 * Clear all test data for a user
 */
export async function clearTestData(userId: string) {
  try {
    console.log("🧹 Clearing test data for user:", userId);
    
    // Note: Juno doesn't have a delete function in the core library
    // You would need to implement deletion through the admin console
    // or use deleteDoc if available in your version
    
    console.log("⚠️  Please clear data manually through Juno console");
    console.log("Collection: individual_investor_profiles or corporate_investor_profiles, Key:", userId);
    console.log("Collection: investments, Key pattern:", `${userId}-investment-*`);
    
    return true;
  } catch (error) {
    console.error("❌ Error clearing test data:", error);
    return false;
  }
}
