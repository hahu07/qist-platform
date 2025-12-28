import { z } from "zod";

/**
 * Transaction Schema for tracking all financial activities
 */

export const transactionTypeSchema = z.enum([
  "investment",      // New investment made
  "profit_distribution", // Profit received from investment
  "deposit",         // Wallet deposit
  "withdrawal",      // Wallet withdrawal
  "fee",            // Platform or transaction fee
  "refund",         // Investment refund
]);

export const transactionStatusSchema = z.enum([
  "pending",    // Awaiting processing
  "completed",  // Successfully completed
  "failed",     // Transaction failed
  "cancelled",  // Transaction cancelled
]);

export const transactionSchema = z.object({
  // Core transaction details
  userId: z.string().min(1, "User ID is required"),
  type: transactionTypeSchema,
  status: transactionStatusSchema.default("pending"),
  
  // Financial details
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("NGN"),
  
  // Reference information
  reference: z.string().min(1, "Transaction reference is required"),
  description: z.string().min(1, "Description is required"),
  
  // Related entities
  investmentId: z.string().optional(), // For investment-related transactions
  opportunityId: z.string().optional(), // For investment opportunities
  
  // Additional metadata
  metadata: z.object({
    businessName: z.string().optional(),
    contractType: z.string().optional(),
    paymentMethod: z.string().optional(),
    bankDetails: z.object({
      accountName: z.string().optional(),
      accountNumber: z.string().optional(),
      bankName: z.string().optional(),
    }).optional(),
  }).optional(),
  
  // Timestamps
  createdAt: z.bigint().optional(),
  completedAt: z.bigint().optional(),
  updatedAt: z.bigint().optional(),
});

export type Transaction = z.infer<typeof transactionSchema>;
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;
