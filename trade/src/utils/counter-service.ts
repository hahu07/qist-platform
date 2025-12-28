import { getDoc, setDoc } from "@junobuild/core";

/**
 * Counter Service - Manages sequential number generation for various entities
 * 
 * Counters are stored in the "counters" collection with format:
 * - Key: counter type (e.g., "member_number", "invoice_number")
 * - Data: { currentValue: number, lastUpdated: timestamp }
 */

export interface Counter {
  currentValue: number;
  lastUpdated: number;
  prefix?: string;
  year?: number;
}

/**
 * Get the next sequential number for a counter type
 * @param counterType - Type of counter (e.g., "member_number")
 * @param prefix - Optional prefix for the formatted number (e.g., "INV")
 * @returns Formatted number string (e.g., "INV-2025-0001")
 */
export async function getNextSequentialNumber(
  counterType: string,
  prefix: string = "INV"
): Promise<string> {
  const counterKey = `counter_${counterType}`;
  const currentYear = new Date().getFullYear();

  try {
    // Get existing counter document
    const counterDoc = await getDoc<Counter>({
      collection: "counters",
      key: counterKey,
    });

    let nextValue = 1;
    let version: bigint | undefined = undefined;

    if (counterDoc && counterDoc.data) {
      // Check if year has changed - reset counter if new year
      const storedYear = counterDoc.data.year || currentYear;
      
      if (storedYear === currentYear) {
        nextValue = counterDoc.data.currentValue + 1;
      } else {
        // New year - reset counter to 1
        nextValue = 1;
      }
      
      version = counterDoc.version;
    }

    // Update counter with new value
    await setDoc({
      collection: "counters",
      doc: {
        key: counterKey,
        data: {
          currentValue: nextValue,
          lastUpdated: Date.now(),
          prefix,
          year: currentYear,
        } as Counter,
        ...(version ? { version } : {}),
      },
    });

    // Format: PREFIX-YEAR-NNNN (e.g., INV-2025-0001)
    const formattedNumber = `${prefix}-${currentYear}-${String(nextValue).padStart(4, "0")}`;
    
    return formattedNumber;
  } catch (error) {
    console.error(`Error getting next sequential number for ${counterType}:`, error);
    
    // Fallback: use timestamp-based unique ID if counter fails
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `${prefix}-${currentYear}-${timestamp}-${randomSuffix}`;
  }
}

/**
 * Get the next membership/investor number
 * Format: INV-YYYY-NNNN (e.g., INV-2025-0001)
 */
export async function getNextMemberNumber(): Promise<string> {
  return getNextSequentialNumber("member_number", "INV");
}

/**
 * Get the next business application number
 * Format: BIZ-YYYY-NNNN (e.g., BIZ-2025-0001)
 */
export async function getNextBusinessApplicationNumber(): Promise<string> {
  return getNextSequentialNumber("business_application_number", "BIZ");
}

/**
 * Get the next invoice/transaction number
 * Format: TXN-YYYY-NNNN (e.g., TXN-2025-0001)
 */
export async function getNextTransactionNumber(): Promise<string> {
  return getNextSequentialNumber("transaction_number", "TXN");
}

/**
 * Get current counter value without incrementing
 * @param counterType - Type of counter
 * @returns Current counter value or 0 if doesn't exist
 */
export async function getCurrentCounterValue(counterType: string): Promise<number> {
  const counterKey = `counter_${counterType}`;
  
  try {
    const counterDoc = await getDoc<Counter>({
      collection: "counters",
      key: counterKey,
    });

    return counterDoc?.data?.currentValue || 0;
  } catch (error) {
    console.error(`Error getting current counter value for ${counterType}:`, error);
    return 0;
  }
}

/**
 * Reset a counter to a specific value (admin function)
 * @param counterType - Type of counter
 * @param value - New counter value
 */
export async function resetCounter(counterType: string, value: number = 0): Promise<boolean> {
  const counterKey = `counter_${counterType}`;
  const currentYear = new Date().getFullYear();

  try {
    const counterDoc = await getDoc<Counter>({
      collection: "counters",
      key: counterKey,
    });

    await setDoc({
      collection: "counters",
      doc: {
        key: counterKey,
        data: {
          currentValue: value,
          lastUpdated: Date.now(),
          year: currentYear,
        } as Counter,
        ...(counterDoc?.version ? { version: counterDoc.version } : {}),
      },
    });

    return true;
  } catch (error) {
    console.error(`Error resetting counter ${counterType}:`, error);
    return false;
  }
}

/**
 * Validate membership number format
 * @param memberNumber - Member number to validate
 * @returns true if valid format (INV-YYYY-NNNN)
 */
export function isValidMemberNumber(memberNumber: string): boolean {
  // Format: INV-YYYY-NNNN (e.g., INV-2025-0001)
  const regex = /^INV-\d{4}-\d{4}$/;
  return regex.test(memberNumber);
}

/**
 * Check if a membership number already exists in the system
 * @param memberNumber - Member number to check
 * @returns true if exists
 */
export async function memberNumberExists(memberNumber: string): Promise<boolean> {
  try {
    // Search in both individual and corporate investor profiles
    const { listDocs } = await import("@junobuild/core");
    
    const individualDocs = await listDocs({
      collection: "individual_investor_profiles",
      filter: {
        matcher: {
          key: memberNumber, // This is a simple check; for production, use a proper query
        }
      }
    });

    if (individualDocs.items.length > 0) {
      return true;
    }

    const corporateDocs = await listDocs({
      collection: "corporate_investor_profiles",
      filter: {
        matcher: {
          key: memberNumber,
        }
      }
    });

    return corporateDocs.items.length > 0;
  } catch (error) {
    console.error("Error checking member number existence:", error);
    return false;
  }
}
