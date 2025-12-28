// Utility script to seed sample business applications for admin dashboard testing
// Run this from browser console after authenticating

import { setDoc } from "@junobuild/core";
import { applicationDataSchema, type ApplicationData } from "@/schemas";

export const seedSampleApplications = async () => {
  const sampleApplications = [
    {
      key: "app-greentech-001",
      data: {
        businessName: "GreenTech Manufacturing Ltd.",
        contactEmail: "contact@greentech.com",
        contactPhone: "+15551234567",
        registrationNumber: "RC-789456",
        contractType: "Musharakah",
        amount: 250000,
        duration: 24,
        industry: "Manufacturing",
        status: "new" as const,
        pool: "business" as const,
        purpose: "Expansion of production capacity and acquisition of new manufacturing equipment to meet growing demand for eco-friendly products.",
        yearsInOperation: 5,
        documents: []
      }
    },
    {
      key: "app-halal-food-002",
      data: {
        businessName: "Halal Food Distribution Co.",
        contactEmail: "info@halalfood.com",
        contactPhone: "+15559876543",
        registrationNumber: "RC-654321",
        contractType: "Murabaha",
        amount: 150000,
        duration: 12,
        industry: "Food & Beverage",
        status: "more-info" as const,
        pool: "business" as const,
        purpose: "Working capital for inventory purchase and distribution network expansion across 3 new regions.",
        yearsInOperation: 3,
        documents: []
      }
    },
    {
      key: "app-islamic-school-003",
      data: {
        businessName: "Islamic School Development Project",
        contactEmail: "admin@islamicschool.edu",
        contactPhone: "+15552345678",
        registrationNumber: "RC-987654",
        contractType: "Ijarah",
        amount: 500000,
        duration: 36,
        industry: "Education",
        status: "new" as const,
        pool: "crypto" as const,
        purpose: "Construction of new school building and acquisition of educational facilities to serve 500 students.",
        yearsInOperation: 8,
        documents: []
      }
    },
    {
      key: "app-tech-startup-004",
      data: {
        businessName: "Islamic FinTech Solutions",
        contactEmail: "hello@islamicfintech.com",
        contactPhone: "+15553456789",
        registrationNumber: "RC-456789",
        contractType: "Musharakah",
        amount: 300000,
        duration: 18,
        industry: "Technology",
        status: "review" as const,
        pool: "business" as const,
        purpose: "Development of Shariah-compliant digital payment platform and mobile banking application.",
        yearsInOperation: 2,
        documents: []
      }
    },
    {
      key: "app-healthcare-005",
      data: {
        businessName: "Wellness Healthcare Center",
        contactEmail: "info@wellnesshc.com",
        contactPhone: "+15554567890",
        registrationNumber: "RC-321654",
        contractType: "Ijarah",
        amount: 400000,
        duration: 30,
        industry: "Healthcare",
        status: "approved" as const,
        pool: "business" as const,
        purpose: "Lease financing for medical equipment and facility expansion to add 20 new treatment rooms.",
        yearsInOperation: 6,
        documents: []
      }
    }
  ];

  try {
    console.log("Seeding sample applications...");
    
    for (const app of sampleApplications) {
      // Validate data before insertion
      const validatedData = applicationDataSchema.parse(app.data);
      
      await setDoc({
        collection: "business_applications",
        doc: {
          key: app.key,
          data: validatedData
        }
      });
      console.log(`✓ Created application: ${validatedData.businessName}`);
    }
    
    console.log("\n✅ Successfully seeded all sample applications!");
    console.log("Refresh the admin dashboard to see the data.");
    
  } catch (error) {
    if (error instanceof Error && 'errors' in error) {
      console.error("❌ Validation error:", error);
    } else {
      console.error("❌ Error seeding applications:", error);
    }
  }
};

// Instructions to run:
// 1. Open admin dashboard and authenticate
// 2. Open browser console
// 3. Import and run: import { seedSampleApplications } from '@/utils/seed-admin-data'; seedSampleApplications();
