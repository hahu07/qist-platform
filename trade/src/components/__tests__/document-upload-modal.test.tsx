/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentUploadModal } from '@/components/document-upload-modal';

// Mock the uploadDocument function
jest.mock('@/utils/document-actions', () => ({
  uploadDocument: jest.fn(),
}));

const mockUploadDocument = require('@/utils/document-actions').uploadDocument;

describe('DocumentUploadModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal when isOpen is true', () => {
    render(
      <DocumentUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        userId={mockUserId}
      />
    );

    // Check for heading (use getAllByText since "Upload Document" might appear in button too)
    expect(screen.getAllByText('Upload Document')[0]).toBeInTheDocument();
    expect(screen.getByText('Document Type *')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    const { container } = render(
      <DocumentUploadModal
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        userId={mockUserId}
      />
    );

    // Modal should render nothing when closed
    expect(container.firstChild).toBeNull();
  });

  it('should call onClose when close button (X) is clicked', async () => {
    render(
      <DocumentUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        userId={mockUserId}
      />
    );

    // Find the X button by its SVG path
    const closeButtons = screen.getAllByRole('button');
    const xButton = closeButtons.find(btn => btn.querySelector('svg'));
    
    if (xButton) {
      await userEvent.click(xButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should call onClose when Cancel button is clicked', async () => {
    render(
      <DocumentUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        userId={mockUserId}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await userEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should display all document type options', () => {
    render(
      <DocumentUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        userId={mockUserId}
      />
    );

    expect(screen.getByText('KYC ID Document')).toBeInTheDocument();
    expect(screen.getByText('Proof of Address')).toBeInTheDocument();
    expect(screen.getByText('Investment Certificate')).toBeInTheDocument();
    expect(screen.getByText('Contract Agreement')).toBeInTheDocument();
    expect(screen.getByText('Tax Statement')).toBeInTheDocument();
  });

  it('should show error for file exceeding 10MB', async () => {
    render(
      <DocumentUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        userId={mockUserId}
      />
    );

    const file = new File(['x'.repeat(11 * 1024 * 1024)], 'large-file.pdf', {
      type: 'application/pdf',
    });

    const input = screen.getByLabelText(/select file/i) as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/file size must be less than 10MB/i)).toBeInTheDocument();
    });
  });

  it('should show error for invalid file type', async () => {
    render(
      <DocumentUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        userId={mockUserId}
      />
    );

    const file = new File(['content'], 'document.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/select file/i) as HTMLInputElement;
    
    // Use fireEvent for file upload
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/only pdf, jpg, and png files are allowed/i)).toBeInTheDocument();
    });
  });

  it('should accept valid PDF file', async () => {
    render(
      <DocumentUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        userId={mockUserId}
      />
    );

    const file = new File(['pdf content'], 'document.pdf', {
      type: 'application/pdf',
    });

    const input = screen.getByLabelText(/select file/i) as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/document\.pdf/i)).toBeInTheDocument();
    });
  });

  it('should display file size in KB', async () => {
    render(
      <DocumentUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        userId={mockUserId}
      />
    );

    // Create 2MB file
    const file = new File(['x'.repeat(2 * 1024 * 1024)], 'document.pdf', {
      type: 'application/pdf',
    });

    const input = screen.getByLabelText(/select file/i) as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/KB/i)).toBeInTheDocument();
    });
  });

  it('should show character count for description', async () => {
    render(
      <DocumentUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        userId={mockUserId}
      />
    );

    const textarea = screen.getByPlaceholderText(/add any notes/i);
    await userEvent.type(textarea, 'Test description');

    await waitFor(() => {
      // Should show character count like "16/500"
      expect(screen.getByText(/\/500/)).toBeInTheDocument();
    });
  });

  it('should disable upload button when no file is selected', () => {
    render(
      <DocumentUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        userId={mockUserId}
      />
    );

    const uploadButtons = screen.getAllByText('Upload Document');
    const submitButton = uploadButtons[uploadButtons.length - 1]; // Get the button, not the heading
    expect(submitButton.closest('button')).toBeDisabled();
  });

  it('should enable upload button when valid file is selected', async () => {
    render(
      <DocumentUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        userId={mockUserId}
      />
    );

    const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/select file/i) as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      const uploadButtons = screen.getAllByText('Upload Document');
      const submitButton = uploadButtons[uploadButtons.length - 1];
      expect(submitButton.closest('button')).not.toBeDisabled();
    });
  });

  it('should display upload guidelines', () => {
    render(
      <DocumentUploadModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        userId={mockUserId}
      />
    );

    expect(screen.getByText(/upload guidelines/i)).toBeInTheDocument();
    expect(screen.getByText(/maximum file size: 10mb/i)).toBeInTheDocument();
    expect(screen.getByText(/accepted formats: pdf, jpg, png/i)).toBeInTheDocument();
  });
});
