import { documentSchema, uploadDocumentSchema } from '../document.schema';
import { z } from 'zod';

describe('Document Schema', () => {
  describe('documentSchema', () => {
    it('should validate a complete document object', () => {
      const validDocument = {
        userId: 'user123',
        fileName: 'test-document.pdf',
        fileSize: 1024000, // 1MB
        mimeType: 'application/pdf',
        documentType: 'kyc_id',
        storageUrl: 'https://storage.example.com/doc.pdf',
        status: 'pending',
        uploadedAt: BigInt(Date.now()),
        metadata: {
          description: 'Test document',
          tags: ['kyc', 'identity'],
        },
      };

      const result = documentSchema.safeParse(validDocument);
      expect(result.success).toBe(true);
    });

    it('should reject document with invalid file size', () => {
      const invalidDocument = {
        userId: 'user123',
        fileName: 'large-file.pdf',
        fileSize: 11 * 1024 * 1024, // 11MB - exceeds 10MB limit
        mimeType: 'application/pdf',
        documentType: 'kyc_id',
        storageUrl: 'https://storage.example.com/doc.pdf',
        status: 'pending',
      };

      const result = documentSchema.safeParse(invalidDocument);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('10MB');
      }
    });

    it('should reject document with invalid MIME type', () => {
      const invalidDocument = {
        userId: 'user123',
        fileName: 'test.exe',
        fileSize: 1024000,
        mimeType: 'application/x-msdownload',
        documentType: 'kyc_id',
        storageUrl: 'https://storage.example.com/doc.exe',
        status: 'pending',
      };

      const result = documentSchema.safeParse(invalidDocument);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('MIME type');
      }
    });

    it('should accept all valid document types', () => {
      const documentTypes = [
        'kyc_id',
        'kyc_proof_of_address',
        'kyc_business_registration',
        'investment_certificate',
        'contract_agreement',
        'tax_statement',
        'profit_distribution_receipt',
        'bank_statement',
        'other',
      ];

      documentTypes.forEach((docType) => {
        const doc = {
          userId: 'user123',
          fileName: 'test.pdf',
          fileSize: 1024000,
          mimeType: 'application/pdf',
          documentType: docType,
          storageUrl: 'https://storage.example.com/doc.pdf',
          status: 'pending',
        };

        const result = documentSchema.safeParse(doc);
        expect(result.success).toBe(true);
      });
    });

    it('should accept all valid status values', () => {
      const statuses = ['pending', 'verified', 'rejected', 'archived'];

      statuses.forEach((status) => {
        const doc = {
          userId: 'user123',
          fileName: 'test.pdf',
          fileSize: 1024000,
          mimeType: 'application/pdf',
          documentType: 'kyc_id',
          storageUrl: 'https://storage.example.com/doc.pdf',
          status,
        };

        const result = documentSchema.safeParse(doc);
        expect(result.success).toBe(true);
      });
    });

    it('should handle optional fields correctly', () => {
      const minimalDocument = {
        userId: 'user123',
        fileName: 'test.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        documentType: 'kyc_id',
        storageUrl: 'https://storage.example.com/doc.pdf',
        status: 'pending',
      };

      const result = documentSchema.safeParse(minimalDocument);
      expect(result.success).toBe(true);
    });
  });

  describe('uploadDocumentSchema', () => {
    it('should validate valid upload data', () => {
      const validUpload = {
        fileName: 'passport.pdf',
        fileSize: 2048000, // 2MB
        mimeType: 'application/pdf',
        documentType: 'kyc_id',
        description: 'National ID card scan',
      };

      const result = uploadDocumentSchema.safeParse(validUpload);
      expect(result.success).toBe(true);
    });

    it('should reject empty file name', () => {
      const invalidUpload = {
        fileName: '',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        documentType: 'kyc_id',
      };

      const result = uploadDocumentSchema.safeParse(invalidUpload);
      expect(result.success).toBe(false);
    });

    it('should reject description exceeding 500 characters', () => {
      const invalidUpload = {
        fileName: 'test.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        documentType: 'kyc_id',
        description: 'A'.repeat(501), // 501 characters
      };

      const result = uploadDocumentSchema.safeParse(invalidUpload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('500');
      }
    });

    it('should accept valid description within limit', () => {
      const validUpload = {
        fileName: 'test.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        documentType: 'kyc_id',
        description: 'A'.repeat(500), // Exactly 500 characters
      };

      const result = uploadDocumentSchema.safeParse(validUpload);
      expect(result.success).toBe(true);
    });
  });
});
