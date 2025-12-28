import { uploadFile, listAssets, getAsset, deleteAsset } from "@junobuild/core";
import { setDoc, getDoc, listDocs } from "@junobuild/core";
import type { Document, DocumentUpload } from "@/schemas";

/**
 * Upload a document to Juno storage
 */
export async function uploadDocument(
  userId: string,
  file: File,
  uploadData: DocumentUpload
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    // Upload file to Juno storage
    const { downloadUrl } = await uploadFile({
      collection: "documents",
      data: file,
      filename: file.name,
    });

    // Create document metadata record
    const documentId = `doc_${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = BigInt(Date.now() * 1000000);

    await setDoc({
      collection: "document_metadata",
      doc: {
        key: documentId,
        data: {
          userId,
          documentType: uploadData.documentType,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          storageUrl: downloadUrl,
          relatedEntityId: uploadData.relatedEntityId,
          relatedEntityType: uploadData.relatedEntityType,
          status: "pending",
          uploadedAt: now,
          metadata: {
            description: uploadData.description,
            tags: uploadData.tags,
            version: 1,
          },
        } as Document,
      },
    });

    return { success: true, documentId };
  } catch (error) {
    console.error("Error uploading document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload document",
    };
  }
}

/**
 * Get documents for a user
 */
export async function getUserDocuments(
  userId: string,
  filters?: {
    documentType?: string;
    relatedEntityId?: string;
    status?: string;
  }
) {
  try {
    const result = await listDocs<Document>({
      collection: "document_metadata",
      filter: {
        order: {
          desc: true,
          field: "created_at",
        },
      },
    });

    if (!result?.items) return [];

    let documents = result.items.filter((doc) => doc.data.userId === userId);

    // Apply filters
    if (filters?.documentType) {
      documents = documents.filter((doc) => doc.data.documentType === filters.documentType);
    }
    if (filters?.relatedEntityId) {
      documents = documents.filter((doc) => doc.data.relatedEntityId === filters.relatedEntityId);
    }
    if (filters?.status) {
      documents = documents.filter((doc) => doc.data.status === filters.status);
    }

    return documents;
  } catch (error) {
    console.error("Error fetching documents:", error);
    return [];
  }
}

/**
 * Get a single document
 */
export async function getDocument(documentId: string) {
  try {
    return await getDoc<Document>({
      collection: "document_metadata",
      key: documentId,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return null;
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const doc = await getDoc<Document>({
      collection: "document_metadata",
      key: documentId,
    });

    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    // Delete from storage
    await deleteAsset({
      collection: "documents",
      fullPath: doc.data.storageUrl,
    });

    // Delete metadata (Note: Juno may not have deleteDoc, so we mark as archived)
    await setDoc({
      collection: "document_metadata",
      doc: {
        key: documentId,
        data: {
          status: "archived",
        },
        version: doc.version,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete document",
    };
  }
}

/**
 * Update document status (for verification)
 */
export async function updateDocumentStatus(
  documentId: string,
  status: "pending" | "verified" | "rejected" | "archived",
  verifiedBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const doc = await getDoc<Document>({
      collection: "document_metadata",
      key: documentId,
    });

    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    const now = BigInt(Date.now() * 1000000);

    await setDoc({
      collection: "document_metadata",
      doc: {
        key: documentId,
        data: {
          status,
          verifiedAt: status === "verified" ? now : undefined,
          verifiedBy: status === "verified" ? verifiedBy : undefined,
        },
        version: doc.version,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating document status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update document",
    };
  }
}

/**
 * Get download URL for a document
 */
export async function getDocumentDownloadUrl(documentId: string): Promise<string | null> {
  try {
    const doc = await getDoc<Document>({
      collection: "document_metadata",
      key: documentId,
    });

    return doc?.data.storageUrl || null;
  } catch (error) {
    console.error("Error getting download URL:", error);
    return null;
  }
}
