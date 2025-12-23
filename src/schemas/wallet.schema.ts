import { z } from "zod";

/**
 * Wallet Schema for managing user balances and financial operations
 */

export const walletSchema = z.object({
  // Owner information
  userId: z.string().min(1, "User ID is required"),
  
  // Balance information
  availableBalance: z.number().default(0),
  pendingBalance: z.number().default(0), // Funds awaiting clearance
  totalBalance: z.number().default(0), // available + pending
  
  // Investment tracking
  totalInvested: z.number().default(0),
  totalReturns: z.number().default(0),
  
  // Currency
  currency: z.string().default("NGN"),
  
  // Status
  status: z.enum(["active", "suspended", "closed"]).default("active"),
  
  // Timestamps
  createdAt: z.bigint().optional(),
  updatedAt: z.bigint().optional(),
  lastTransactionAt: z.bigint().optional(),
});

export const depositRequestSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("NGN"),
  
  // Payment details
  paymentMethod: z.enum(["bank_transfer", "card", "crypto"]),
  paymentReference: z.string().min(1, "Payment reference is required"),
  
  // Bank transfer details
  bankDetails: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    accountName: z.string().optional(),
    transferDate: z.string().optional(),
  }).optional(),
  
  // Supporting documents - multiple evidence files
  proofOfPayment: z.string().optional(), // Deprecated - kept for backward compatibility
  paymentEvidence: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string(),
    fileType: z.string(),
    uploadedAt: z.bigint().optional(),
  })).optional(),
  notes: z.string().max(500).optional(), // Additional notes from member
  
  // Status
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  approvedBy: z.string().optional(),
  approvedAt: z.bigint().optional(),
  rejectionReason: z.string().optional(),
  
  // Timestamps
  createdAt: z.bigint().optional(),
  updatedAt: z.bigint().optional(),
});

export const withdrawalRequestSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("NGN"),
  
  // Recipient details
  bankDetails: z.object({
    bankName: z.string().min(1, "Bank name is required"),
    accountNumber: z.string().min(10, "Account number must be at least 10 digits"),
    accountName: z.string().min(1, "Account name is required"),
  }),
  
  // Status
  status: z.enum(["pending", "processing", "completed", "rejected", "cancelled"]).default("pending"),
  processedBy: z.string().optional(),
  processedAt: z.bigint().optional(),
  completedAt: z.bigint().optional(),
  rejectionReason: z.string().optional(),
  
  // Transaction reference (once processed)
  transactionReference: z.string().optional(),
  
  // Timestamps
  createdAt: z.bigint().optional(),
  updatedAt: z.bigint().optional(),
});

export type Wallet = z.infer<typeof walletSchema>;
export type DepositRequest = z.infer<typeof depositRequestSchema>;
export type WithdrawalRequest = z.infer<typeof withdrawalRequestSchema>;
