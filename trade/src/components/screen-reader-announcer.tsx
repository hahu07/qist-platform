/**
 * Screen Reader Announcer Component
 * 
 * Provides live region announcements for screen reader users when dynamic content changes.
 * Uses ARIA live regions to ensure important updates are communicated to assistive technology users.
 */

import { useEffect, useState } from 'react';

interface ScreenReaderAnnouncerProps {
  /** Message to announce to screen readers */
  message: string;
  /** Priority of the announcement */
  priority?: 'polite' | 'assertive';
  /** Auto-clear message after delay (ms). Set to 0 to persist */
  clearAfter?: number;
}

/**
 * Component that announces messages to screen readers using ARIA live regions
 * 
 * @example
 * ```tsx
 * // Polite announcement (default)
 * <ScreenReaderAnnouncer message="Form submitted successfully" />
 * 
 * // Assertive announcement for errors
 * <ScreenReaderAnnouncer 
 *   message="Error: Please fill in all required fields" 
 *   priority="assertive" 
 * />
 * ```
 */
export function ScreenReaderAnnouncer({ 
  message, 
  priority = 'polite',
  clearAfter = 5000 
}: ScreenReaderAnnouncerProps) {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setCurrentMessage(message);

    if (clearAfter > 0 && message) {
      const timer = setTimeout(() => {
        setCurrentMessage('');
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {currentMessage}
    </div>
  );
}

/**
 * Hook for managing screen reader announcements
 * 
 * @example
 * ```tsx
 * function MyForm() {
 *   const { announce, ScreenReaderLiveRegion } = useScreenReaderAnnouncer();
 *   
 *   const handleSubmit = async () => {
 *     announce('Submitting form...');
 *     await submit();
 *     announce('Form submitted successfully');
 *   };
 *   
 *   return (
 *     <>
 *       <ScreenReaderLiveRegion />
 *       <form onSubmit={handleSubmit}>
 *         {/* form fields *\/}
 *       </form>
 *     </>
 *   );
 * }
 * ```
 */
export function useScreenReaderAnnouncer() {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');

  const announce = (text: string, announcePriority: 'polite' | 'assertive' = 'polite') => {
    setPriority(announcePriority);
    setMessage(text);
  };

  const announcePolite = (text: string) => {
    announce(text, 'polite');
  };

  const announceAssertive = (text: string) => {
    announce(text, 'assertive');
  };

  const clear = () => {
    setMessage('');
  };

  const ScreenReaderLiveRegion = () => (
    <ScreenReaderAnnouncer message={message} priority={priority} />
  );

  return {
    announce,
    announcePolite,
    announceAssertive,
    clear,
    ScreenReaderLiveRegion,
  };
}

/**
 * Pre-configured announcer for common form events
 */
export const formAnnouncements = {
  submitting: 'Submitting form, please wait',
  submitted: 'Form submitted successfully',
  error: 'Form submission failed. Please check the errors and try again',
  validationError: 'Please fix the validation errors before continuing',
  saved: 'Changes saved successfully',
  loading: 'Loading, please wait',
  stepChanged: (current: number, total: number, label: string) => 
    `Step ${current} of ${total}: ${label}`,
  fileUploaded: (filename: string) => `File ${filename} uploaded successfully`,
  fileRemoved: (filename: string) => `File ${filename} removed`,
  fieldError: (fieldName: string, error: string) => 
    `${fieldName}: ${error}`,
};

/**
 * Pre-configured announcer for application-specific events
 */
export const applicationAnnouncements = {
  statusChanged: (status: string) => `Application status changed to ${status}`,
  documentAdded: (docType: string) => `${docType} document added`,
  documentRemoved: (docType: string) => `${docType} document removed`,
  approved: 'Your application has been approved',
  rejected: 'Your application has been rejected',
  underReview: 'Your application is under review',
  moreInfoRequired: 'Additional information is required for your application',
};
