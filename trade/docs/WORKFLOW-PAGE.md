# Workflow & Collaboration Page

## Overview
Created a dedicated page for Phase 2 features (Assignment Management, Messaging, and Internal Notes) to reduce clutter in the main business applications review page.

## Location
**URL:** `/admin/workflow`  
**File:** `src/app/admin/workflow/page.tsx`

## Features

### 1. Assignment Management Tab
- Assign applications to specific admins
- Auto-assign based on workload and specialization
- View admin workload dashboard
- Set priority levels (low, medium, high, urgent)
- Add assignment notes

### 2. Messages & Communication Tab
- Send messages between admins and business owners
- Message templates for common communications
- Priority levels for urgent messages
- Thread-based conversations
- Support for attachments (structure ready)

### 3. Internal Notes Tab
- Admin-only notes on applications
- Tagging and mentions (@username)
- Note reactions (👍 👎 ⚠️ ✅)
- Edit and delete capabilities
- Full audit trail

## Design System
All components now use the clean, modern design system matching the existing admin dashboard:

### Colors
- **Backgrounds:** `bg-neutral-50 dark:bg-neutral-800/50`
- **Borders:** `border border-neutral-200 dark:border-neutral-800`
- **Primary Actions:** `bg-primary-600 hover:bg-primary-700`
- **Success Actions:** `bg-success-600 hover:bg-success-700`
- **Warning/Amber:** `bg-amber-600 hover:bg-amber-700`

### Styling Patterns
- **Rounded Corners:** `rounded-xl` for cards, `rounded-lg` for inputs
- **Shadows:** Subtle `shadow-sm` and `hover:shadow-md`
- **Focus States:** `focus:ring-2 focus:ring-primary-500 focus:border-transparent`
- **No heavy borders or neuomorphic effects**

## Navigation

### Access Points
1. **Admin Navigation Bar:** New "Workflow" link added to main admin navigation
2. **Direct URL:** `/admin/workflow`
3. **Back Button:** Returns to business applications page

### Integration
- Removed workflow tabs from the business-applications modal (cleaner UX)
- Added workflow icon to navigation menu
- Maintains authentication state and admin profiles

## Usage

### For Testing
1. Navigate to `/admin/workflow`
2. Enter an application ID in the test input field
3. Switch between tabs to test each feature
4. All components are fully functional with Juno backend integration

### In Production
- Application ID would be automatically selected from applications list
- Admin profiles fetched from `admin_profiles` collection
- Real-time updates for messages and assignments
- Full SLA tracking and workload management

## Data Collections Used
- `assignments` - Application assignments to admins
- `admin_profiles` - Admin user profiles and workload
- `messages` - Communication between stakeholders
- `message_threads` - Threaded conversations
- `internal_notes` - Admin-only application notes
- `collaboration_requests` - Multi-admin collaboration
- `notifications` - Real-time notifications

## Technical Details

### Authentication
- Uses Juno's `authSubscribe` for authentication state
- Redirects to `/auth/signin` if not authenticated
- Extracts user principal for operations

### State Management
- React hooks for local state
- Tab-based navigation
- Application ID input for testing
- Loading states for async operations

### Styling
- Tailwind CSS with dark mode support
- Responsive design (mobile-friendly)
- Consistent with existing admin dashboard
- Gradient headers and subtle shadows

## Next Steps (Phase 3)
1. **Analytics Dashboard:** Application review metrics and insights
2. **OCR Integration:** Automated document data extraction
3. **API Integrations:** Credit bureaus, KYC providers
4. **Advanced Search:** Filter and search across all applications
5. **Bulk Operations:** Multi-select and batch actions

## Related Files
- `/src/components/assignment-manager.tsx` - Assignment management UI
- `/src/components/messaging-interface.tsx` - Chat interface
- `/src/components/internal-notes.tsx` - Notes management
- `/src/utils/assignment-actions.ts` - Assignment business logic
- `/src/utils/message-actions.ts` - Messaging logic
- `/src/schemas/assignment.schema.ts` - Type definitions
- `/src/schemas/message.schema.ts` - Message types
