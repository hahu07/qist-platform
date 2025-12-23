import { setDoc, getDoc, type Doc } from "@junobuild/core";
import { investmentTransactionSchema, opportunitySchema, type InvestmentTransaction, type OpportunityFormData, type Wallet } from "@/schemas";
import { validateOrThrow } from "./validation";

/**
 * Process an investment transaction
 * Updates opportunity funding, creates investment record, updates wallet, and creates transaction
 */
export async function processInvestment(params: {
  userId: string;
  userType: "individual" | "corporate";
  opportunityId: string;
  amount: number;
}): Promise<{ success: boolean; message: string; investmentId?: string }> {
  const { userId, userType, opportunityId, amount } = params;

  try {
    // 1. Fetch the opportunity
    const opportunityDoc = await getDoc<OpportunityFormData>({
      collection: "opportunities",
      key: opportunityId,
    });

    if (!opportunityDoc) {
      return { success: false, message: "Investment opportunity not found" };
    }

    const opportunity = opportunityDoc.data;

    // 2. Validate opportunity status
    if (opportunity.status !== "active") {
      return { success: false, message: "This opportunity is no longer active" };
    }

    // 3. Check wallet balance
    const walletDoc = await getDoc<Wallet>({
      collection: "wallets",
      key: userId,
    });

    if (!walletDoc) {
      return { 
        success: false, 
        message: "Wallet not found. Please deposit funds first." 
      };
    }

    if (walletDoc.data.availableBalance < amount) {
      return {
        success: false,
        message: `Insufficient balance. Available: ₦${walletDoc.data.availableBalance.toLocaleString()}`,
      };
    }

    // 4. Validate investment amount
    if (amount < opportunity.minimumInvestment) {
      return {
        success: false,
        message: `Minimum investment is ₦${opportunity.minimumInvestment.toLocaleString()}`,
      };
    }

    const remainingFunding = opportunity.fundingGoal - opportunity.currentFunding;
    if (amount > remainingFunding) {
      return {
        success: false,
        message: `Only ₦${remainingFunding.toLocaleString()} remaining to fund`,
      };
    }

    // 5. Check campaign deadline
    const [day, month, year] = opportunity.campaignDeadline.split("-");
    const deadline = new Date(`${year}-${month}-${day}`);
    if (deadline < new Date()) {
      return { success: false, message: "Campaign deadline has passed" };
    }

    // 6. Create investment transaction
    const today = new Date();
    const formatDate = (date: Date): string => {
      const d = String(date.getDate()).padStart(2, "0");
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const y = date.getFullYear();
      return `${d}-${m}-${y}`;
    };

    const investmentData: InvestmentTransaction = {
      investorId: userId,
      investorType: userType,
      opportunityId: opportunityDoc.key,
      applicationId: opportunity.applicationId,
      businessId: opportunity.businessId,
      businessName: opportunity.businessName,
      amount: amount,
      contractType: opportunity.contractType,
      expectedReturnMin: opportunity.expectedReturnMin,
      expectedReturnMax: opportunity.expectedReturnMax,
      termMonths: opportunity.termMonths,
      status: "active",
      transactionDate: formatDate(today),
    };

    const validatedInvestment = validateOrThrow(
      investmentTransactionSchema,
      investmentData,
      "Create investment"
    );

    const investmentId = `inv_${Date.now()}_${userId.substring(0, 8)}`;
    
    await setDoc({
      collection: "investments",
      doc: {
        key: investmentId,
        data: validatedInvestment,
      },
    });

    // 7. Update wallet balance
    const updatedWallet = {
      ...walletDoc.data,
      availableBalance: walletDoc.data.availableBalance - amount,
      totalBalance: walletDoc.data.totalBalance - amount,
      totalInvested: walletDoc.data.totalInvested + amount,
      updatedAt: Date.now(),
    };

    await setDoc({
      collection: "wallets",
      doc: {
        key: userId,
        data: updatedWallet,
        version: walletDoc.version,
      },
    });

    // 8. Create transaction record
    const transactionId = `${userId}_${Date.now()}`;
    await setDoc({
      collection: "transactions",
      doc: {
        key: transactionId,
        data: {
          userId,
          type: 'investment',
          status: 'completed',
          amount,
          description: `Investment in ${opportunity.businessName}`,
          reference: investmentId,
          createdAt: Date.now(),
          metadata: {
            opportunityId: opportunityDoc.key,
            businessName: opportunity.businessName,
            contractType: opportunity.contractType,
            expectedReturnMin: opportunity.expectedReturnMin.toString(),
            expectedReturnMax: opportunity.expectedReturnMax.toString(),
            termMonths: opportunity.termMonths.toString(),
          }
        }
      }
    });

    // 9. Update opportunity funding
    const updatedOpportunity: OpportunityFormData = {
      ...opportunity,
      currentFunding: opportunity.currentFunding + amount,
      investorCount: opportunity.investorCount + 1,
      status:
        opportunity.currentFunding + amount >= opportunity.fundingGoal
          ? "funded"
          : "active",
    };

    const validatedOpportunity = validateOrThrow(
      opportunitySchema,
      updatedOpportunity,
      "Update opportunity"
    );

    await setDoc({
      collection: "opportunities",
      doc: {
        ...opportunityDoc,
        data: validatedOpportunity,
      },
    });

    return {
      success: true,
      message: `Successfully invested RM ${amount.toLocaleString()} in ${opportunity.businessName}`,
      investmentId,
    };
  } catch (error) {
    console.error("Error processing investment:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to process investment",
    };
  }
}

/**
 * Calculate potential returns for an investment amount
 */
export function calculateReturns(params: {
  amount: number;
  returnMin: number;
  returnMax: number;
  termMonths: number;
}): { minReturn: number; maxReturn: number; avgMonthly: number } {
  const { amount, returnMin, returnMax, termMonths } = params;
  
  const minReturn = (amount * returnMin) / 100;
  const maxReturn = (amount * returnMax) / 100;
  const avgReturn = (minReturn + maxReturn) / 2;
  const avgMonthly = avgReturn / termMonths;

  return {
    minReturn,
    maxReturn,
    avgMonthly,
  };
}
