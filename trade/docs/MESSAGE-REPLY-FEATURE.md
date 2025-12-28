# Message Reply Feature Implementation

## Overview

The platform messaging system now supports **replying to specific messages**, creating threaded conversations between businesses and administrators. This feature allows both parties to maintain context in their communications.

## Features Added

### 1. **Reply Threading**
- Messages can reference the original message they're replying to
- Reply context is preserved and displayed in conversations
- Visual indicators show which messages are replies

### 2. **Reply Context Display**
- Original message subject and preview shown when viewing replies
- Purple highlight box displays the message being replied to
- Clear visual separation between original context and reply content

### 3. **Reply Indicators**
- Purple "Reply" badge in message lists
- Shows at a glance which messages are part of a thread
- Consistent across business and admin interfaces

## Schema Changes

### Updated `platformMessageSchema`

Added three new optional fields to the message schema:

```typescript
export const platformMessageSchema = z.object({
  // ... existing fields ...
  replyToMessageId: z.string().optional(),    // ID of message being replied to
  replyToContent: z.string().optional(),      // Preview of original message content
  replyToSubject: z.string().optional(),      // Original message subject
});
```

## User Interface

### Business Messages Page (`/business/messages`)

#### **Reply Button**
- Added "Reply as New Message" button in message detail view
- Clicking opens compose form with reply context pre-filled
- Subject automatically set to "Re: [Original Subject]"

#### **Reply Context Box** (in Compose Modal)
- Blue highlight box shows the message being replied to
- Displays: Subject, content preview, sender, and date
- Can be cleared with X button

#### **Message List Indicators**
- Purple "Reply" badge next to replied messages
- Direction indicators: "← Sent to Admin" or "→ From Admin"

#### **Reply Context in Detail View**
- Purple bordered box at top of message content
- Shows: "In reply to: [Original Subject]"
- Displays preview of original message content

### Admin Messages Inbox (`/admin/messages-inbox`)

#### **Reply Indicators**
- Same purple "Reply" badge in message list
- Shows which business messages are replies to admin messages

#### **Reply Context Display**
- Purple highlight box showing original message being replied to
- Clear threading of conversation history

## How to Use

### For Businesses

1. **View Message**: Click on any message from admin
2. **Reply**: Click "Reply as New Message" button
3. **Compose**: Compose form opens with:
   - Reply context box showing original message
   - Subject pre-filled with "Re: [Original Subject]"
   - Focus on message content
4. **Send**: Click "Send Message" to send reply

### For Admins

1. **View Messages**: See all messages in inbox
2. **Identify Replies**: Look for purple "Reply" badge
3. **View Context**: Click message to see full reply thread
4. **Reply**: Use business-messages page to send response

## Technical Implementation

### Message Sending

When replying to a message, the following data is captured:

```typescript
const result = await sendBusinessToAdminMessage(
  {
    subject: newMessageSubject,
    content: newMessageContent,
    type: newMessageType,
    attachments: newMessageAttachments,
    replyToMessageId: replyToMessage?.key,          // Original message ID
    replyToContent: replyToMessage?.data.content.substring(0, 100),  // Preview
    replyToSubject: replyToMessage?.data.subject,   // Original subject
  },
  myProfile.key
);
```

### Display Logic

Reply context is conditionally displayed:

```tsx
{selectedMessage.data.replyToMessageId && (
  <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
    <span>In reply to: {selectedMessage.data.replyToSubject}</span>
    <p className="italic">"{selectedMessage.data.replyToContent}..."</p>
  </div>
)}
```

## Benefits

### 1. **Better Context**
- Users can see what message is being replied to
- Reduces confusion in multi-topic conversations
- Clear conversation history

### 2. **Improved Communication**
- Easier to track multiple ongoing discussions
- Quick reference to previous messages
- Professional threaded conversation format

### 3. **User Experience**
- Visual indicators make navigation easier
- One-click reply functionality
- Automatic subject line handling ("Re: ...")

## Visual Design

### Color Scheme
- **Reply Context**: Purple theme (`purple-50`, `purple-600`, `purple-900`)
- **Reply Badge**: Purple with reply arrow icon
- **Reply Box**: Left border accent with light background

### Icons
- **Reply Arrow**: Left-pointing curved arrow (↩)
- Used consistently across both business and admin interfaces

## Future Enhancements

### Possible Improvements
- [ ] **Full Thread View**: Show complete conversation thread in one view
- [ ] **Quick Reply**: Reply directly from message list
- [ ] **Reply Notifications**: Notify when someone replies to your message
- [ ] **Thread Grouping**: Group related messages in inbox
- [ ] **Quote Text**: Select specific text from original to quote in reply
- [ ] **Reply Count**: Show number of replies in a thread

### Advanced Features
- [ ] **Nested Replies**: Support replies to replies
- [ ] **Thread Sidebar**: Navigation between messages in same thread
- [ ] **Smart Threading**: Auto-detect related messages
- [ ] **Reply Analytics**: Track response times and patterns

## Files Modified

### Schema
- ✅ `src/schemas/platform-message.schema.ts` - Added reply fields

### Business Interface
- ✅ `src/app/business/messages/page.tsx` - Reply UI and functionality

### Admin Interface
- ✅ `src/app/admin/messages-inbox/page.tsx` - Reply context display

### Utilities
- ✅ `src/utils/platform-message-actions.ts` - Updated send function

## Testing Checklist

- [x] Reply button appears on received messages
- [x] Compose form shows reply context when replying
- [x] Subject auto-populates with "Re: [Original]"
- [x] Reply context can be cleared
- [x] Reply indicator shows in message list
- [x] Reply context displays in message detail view
- [x] Works in both light and dark modes
- [x] Reply data saved correctly in database
- [x] Admin can see reply indicators
- [x] No TypeScript errors

## Notes

- Reply context preview is limited to first 100 characters
- Original message ID is stored for potential future threading features
- System supports unlimited reply depth (though UI currently shows one level)
- Reply functionality works for messages in both directions (business → admin, admin → business)

---

**Implementation Date**: December 27, 2025  
**Status**: ✅ Complete & Tested
