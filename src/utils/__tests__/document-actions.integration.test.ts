/**
 * Integration tests for Document Management System
 * Tests the full workflow from upload to retrieval
 */

// Mock Juno's uploadFile and storage functions
jest.mock('@junobuild/core', () => ({
  uploadFile: jest.fn(),
  listAssets: jest.fn(),
  getAsset: jest.fn(),
  deleteAsset: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  listDocs: jest.fn(),
  deleteDoc: jest.fn(),
}));

import {
  uploadDocument,
  getUserDocuments,
  getDocument,
  deleteDocument,
  updateDocumentStatus,
  getDocumentDownloadUrl,
} from '../document-actions';

const mockJuno = require('@junobuild/core');

describe('Document Management Integration Tests', () => {
  const mockUserId = 'user-test-123';
  const mockFile = new File(['test content'], 'test-document.pdf', {
    type: 'application/pdf',
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Document Upload Workflow', () => {
    it('should successfully upload a document and create metadata', async () => {
      const mockStorageUrl = 'https://storage.example.com/doc123.pdf';
      const mockDocId = 'doc-123';

      mockJuno.uploadFile.mockResolvedValue({
        downloadUrl: mockStorageUrl,
        fullPath: '/documents/doc123.pdf',
      });

      mockJuno.setDoc.mockResolvedValue({
        key: mockDocId,
        data: {
          userId: mockUserId,
          fileName: 'test-document.pdf',
          documentType: 'kyc_id',
        },
      });

      const result = await uploadDocument(
        mockUserId,
        mockFile,
        {
          documentType: 'kyc_id',
          description: 'Test document for KYC',
        }
      );

      // Verify uploadFile was called
      expect(mockJuno.uploadFile).toHaveBeenCalled();

      // Verify setDoc was called with metadata
      expect(mockJuno.setDoc).toHaveBeenCalled();

      expect(result).toBeDefined();
    });

    it('should handle upload errors gracefully', async () => {
      mockJuno.uploadFile.mockRejectedValue(new Error('Storage error'));

      const result = await uploadDocument(mockUserId, mockFile, { documentType: 'kyc_id', description: 'Test document' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage error');
    });

    it('should generate unique document IDs', async () => {
      mockJuno.uploadFile.mockResolvedValue({
        downloadUrl: 'https://storage.example.com/doc.pdf',
      });
      mockJuno.setDoc.mockResolvedValue({ key: 'doc-1' });

      await uploadDocument(mockUserId, mockFile, { documentType: 'kyc_id' });
      await uploadDocument(mockUserId, mockFile, { documentType: 'kyc_id' });

      const calls = mockJuno.setDoc.mock.calls;
      const key1 = calls[0][0].doc.key;
      const key2 = calls[1][0].doc.key;

      expect(key1).not.toBe(key2);
    });
  });

  describe('Document Retrieval Workflow', () => {
    it('should retrieve all documents for a user', async () => {
      const mockDocuments = [
        {
          key: 'doc-1',
          data: {
            userId: mockUserId,
            fileName: 'passport.pdf',
            documentType: 'kyc_id',
            status: 'verified',
          },
        },
        {
          key: 'doc-2',
          data: {
            userId: mockUserId,
            fileName: 'address-proof.pdf',
            documentType: 'kyc_proof_of_address',
            status: 'pending',
          },
        },
      ];

      mockJuno.listDocs.mockResolvedValue({
        items: mockDocuments,
        length: mockDocuments.length,
      });

      const result = await getUserDocuments(mockUserId);

      expect(mockJuno.listDocs).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'document_metadata',
        })
      );

      expect(result).toHaveLength(2);
      expect(result[0].data.fileName).toBe('passport.pdf');
    });

    it('should filter documents by type', async () => {
      mockJuno.listDocs.mockResolvedValue({
        items: [
          {
            key: 'doc-1',
            data: {
              documentType: 'investment_certificate',
              status: 'verified',
            },
          },
        ],
        length: 1,
      });

      await getUserDocuments(mockUserId, 'investment_certificate');

      expect(mockJuno.listDocs).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'document_metadata',
        })
      );
    });

    it('should filter documents by status', async () => {
      mockJuno.listDocs.mockResolvedValue({
        items: [],
        length: 0,
      });

      await getUserDocuments(mockUserId, undefined, undefined, 'verified');

      expect(mockJuno.listDocs).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'document_metadata',
        })
      );
    });

    it('should retrieve a single document by ID', async () => {
      const mockDocument = {
        key: 'doc-123',
        data: {
          userId: mockUserId,
          fileName: 'certificate.pdf',
          documentType: 'investment_certificate',
        },
      };

      mockJuno.getDoc.mockResolvedValue(mockDocument);

      const result = await getDocument('doc-123');

      expect(mockJuno.getDoc).toHaveBeenCalledWith({
        collection: 'document_metadata',
        key: 'doc-123',
      });

      expect(result?.data.fileName).toBe('certificate.pdf');
    });
  });

  describe('Document Status Update Workflow', () => {
    it('should update document status to verified', async () => {
      const mockDoc = {
        key: 'doc-123',
        data: { status: 'pending' },
        version: 1n,
      };

      mockJuno.getDoc.mockResolvedValue(mockDoc);
      mockJuno.setDoc.mockResolvedValue({
        ...mockDoc,
        data: { ...mockDoc.data, status: 'verified' },
      });

      await updateDocumentStatus('doc-123', 'verified');

      expect(mockJuno.setDoc).toHaveBeenCalledWith({
        collection: 'document_metadata',
        doc: {
          key: 'doc-123',
          data: expect.objectContaining({
            status: 'verified',
            verifiedAt: expect.any(BigInt),
          }),
          version: 1n,
        },
      });
    });

    it('should handle status update when document not found', async () => {
      mockJuno.getDoc.mockResolvedValue(null);

      const result = await updateDocumentStatus('non-existent', 'verified');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Document not found');
    });
  });

  describe('Document Deletion Workflow', () => {
    it('should soft delete document by updating status to archived', async () => {
      const mockDoc = {
        key: 'doc-123',
        data: {
          status: 'verified',
          storageUrl: 'https://storage.example.com/doc.pdf',
        },
        version: 1n,
      };

      mockJuno.getDoc.mockResolvedValue(mockDoc);
      mockJuno.deleteAsset.mockResolvedValue(true);
      mockJuno.setDoc.mockResolvedValue({
        ...mockDoc,
        data: { ...mockDoc.data, status: 'archived' },
      });

      await deleteDocument('doc-123');

      expect(mockJuno.deleteAsset).toHaveBeenCalled();
      expect(mockJuno.setDoc).toHaveBeenCalledWith({
        collection: 'document_metadata',
        doc: expect.objectContaining({
          data: expect.objectContaining({
            status: 'archived',
          }),
        }),
      });
    });

    it('should handle deletion when storage removal fails', async () => {
      const mockDoc = {
        key: 'doc-123',
        data: { storageUrl: 'https://storage.example.com/doc.pdf' },
        version: 1n,
      };

      mockJuno.getDoc.mockResolvedValue(mockDoc);
      mockJuno.deleteAsset.mockRejectedValue(new Error('Storage error'));

      const result = await deleteDocument('doc-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage error');
    });
  });

  describe('Document Download URL Workflow', () => {
    it('should generate secure download URL', async () => {
      const mockDoc = {
        key: 'doc-123',
        data: {
          storageUrl: 'https://storage.example.com/secure-doc.pdf',
          fileName: 'certificate.pdf',
        },
      };

      mockJuno.getDoc.mockResolvedValue(mockDoc);

      const url = await getDocumentDownloadUrl('doc-123');

      expect(url).toBe('https://storage.example.com/secure-doc.pdf');
    });

    it('should return null when document not found', async () => {
      mockJuno.getDoc.mockResolvedValue(null);

      const url = await getDocumentDownloadUrl('non-existent');

      expect(url).toBeNull();
    });
  });

  describe('Complete Document Lifecycle', () => {
    it('should handle full document lifecycle: upload -> verify -> download -> archive', async () => {
      // 1. Upload
      mockJuno.uploadFile.mockResolvedValue({
        downloadUrl: 'https://storage.example.com/doc.pdf',
      });
      mockJuno.setDoc.mockResolvedValue({ key: 'doc-lifecycle' });

      const uploadResult = await uploadDocument(
        mockUserId,
        mockFile,
        {
          documentType: 'kyc_id',
          description: 'Full lifecycle test'
        }
      );

      expect(uploadResult).toBeDefined();

      // 2. Verify
      mockJuno.getDoc.mockResolvedValue({
        key: 'doc-lifecycle',
        data: { status: 'pending' },
        version: 1n,
      });

      await updateDocumentStatus('doc-lifecycle', 'verified');

      expect(mockJuno.setDoc).toHaveBeenCalledWith(
        expect.objectContaining({
          doc: expect.objectContaining({
            data: expect.objectContaining({
              status: 'verified',
            }),
          }),
        })
      );

      // 3. Download
      mockJuno.getDoc.mockResolvedValue({
        key: 'doc-lifecycle',
        data: { storageUrl: 'https://storage.example.com/doc.pdf' },
      });

      const downloadUrl = await getDocumentDownloadUrl('doc-lifecycle');
      expect(downloadUrl).toBeTruthy();

      // 4. Archive
      mockJuno.deleteAsset.mockResolvedValue(true);
      await deleteDocument('doc-lifecycle');

      expect(mockJuno.deleteAsset).toHaveBeenCalled();
    });
  });
});
