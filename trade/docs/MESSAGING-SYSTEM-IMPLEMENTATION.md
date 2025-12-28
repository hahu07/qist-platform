# Business-Admin Messaging System - Full Implementation

## Overview

The messaging system enables **threaded conversations** between businesses and platform administrators with proper back-and-forth communication support.

## Key Features

### ✅ Threaded Conversations
- Each conversation has a unique `threadId` that groups all related messages
- Messages in a thread maintain context and history
- Supports unlimited back-and-forth replies

### ✅ Conversation View
- **Business Side**: `/business/messages` - View all conversations with admin
- **Admin Side**: `/admin/conversations` - View all conversations with businesses
- Both sides show:
  - List of conversation threads with message counts
  - Full conversation history in chronological order
  - Real-time reply functionality

### ✅ Message Threading
- First message creates a new thread (`isThreadStarter: true`)
- All replies reference the original thread via `threadId`
- Each reply includes `replyToMessageId` to track the specific message being replied to

### ✅ Character Validation
- **Subject**: 3-200 characters
- **Content**: 10-10,000 characters
- Real-time character counter
- Visual feedback (red borders, error messages)
- Button disabled when validation fails

## Architecture

### Schema Changes

```typescript
// src/schemas/platform-message.schema.ts
export const platformMessageSchema = z.object({
  messageId: z.string(),
  threadId: z.string(), // NEW: Groups related messages
  from: z.string(),
  to: z.string(),
  subject: z.string(),
  content: z.string(),
  type: z.enum(["info", "request", "warning", "urgent"]),
  status: z.enum(["sent", "read", "responded"]),
  sentAt: z.string(),
  replyToMessageId: z.string().optional(), // ID of message being replied to
  replyToContent: z.string().optional(), // Preview of original message
  replyToSubject: z.string().optional(), // Original subject
  isThreadStarter: z.boolean().optional(), // True for first message
  threadMessageCount: z.number().optional(), // Total messages in thread
  responseContent: z.string().optional(), // DEPRECATED
  // ... other fields
});
```

### New Helper Functions

#### `getThreadMessages(threadId: string)`
Returns all messages in a conversation thread, sorted chronologically.

#### `replyToThread(request)`
Creates a new message within an existing thread. Handles both business→admin and admin→business replies.

#### `getConversationThreads(userId: string, isAdmin: boolean)`
Returns grouped conversation threads with:
- Thread starter message
- Message count
- Last message in thread
- Sorted by most recent activity

### Message Flow

#### Starting a New Conversation

**Business initiates:**
1. Business sends message to admin
2. System generates unique `threadId`
3. Message marked with `isThreadStarter: true`

**Admin initiates:**
1. Admin sends message to business (via `/admin/business-messages`)
2. System generates unique `threadId`
3. Message marked with `isThreadStarter: true`

#### Replying to a Conversation

**Either party:**
1. Select conversation from list
2. View full conversation history
3. Type reply in text area
4. System uses existing `threadId`
5. New message added to thread with `replyToMessageId` set

## User Interface

### Business View (`/business/messages`)

**Layout:**
- Left sidebar: List of conversation threads
- Right panel: Selected conversation with full message history
- Bottom: Reply textarea with character counter

**Features:**
- See all conversations with admin
- View full conversation history
- Reply directly to any conversation
- Character count validation

### Admin View (`/admin/conversations`)

**Layout:**
- Left sidebar: List of all business conversation threads
- Right panel: Selected conversation with full message history
- Bottom: Reply textarea with character counter

**Features:**
- See all conversations from all businesses
- Business name displayed prominently
- View full conversation history
- Reply directly to any conversation
- Character count validation
- Link to create new message

### Creating New Messages

**Admin** (`/admin/business-messages`):
- Select recipient business
- Enter subject and content
- Character validation enforced
- Creates new thread

**Business**:
- Can start new conversation from messages page (future enhancement)
- Currently: Reply to existing admin messages

## Migration Notes

### Backwards Compatibility

The system handles existing messages:
- Old messages without `threadId` will need migration
- Each message can be assigned its own `threadId` initially
- Old quick responses (using `responseContent`) are deprecated but still displayed

### Migration Strategy

For existing messages in production:

```typescript
// Run once to migrate existing messages
const messages = await listDocs<PlatformMessage>({
  collection: "platform_messages"
});

for (const msg of messages.items) {
  if (!msg.data.threadId) {
    // Assign unique threadId to existing messages
    const threadId = msg.key; // Use messageId as threadId for old messages
    await setDoc({
      collection: "platform_messages",
      doc: {
        key: msg.key,
        data: {
          ...msg.data,
          threadId,
          isThreadStarter: true,
          threadMessageCount: 1,
        },
        version: msg.version,
      }
    });
  }
}
```

## API Reference

### Core Functions

#### `sendBusinessToAdminMessage(request, fromBusinessId)`
```typescript
request: {
  subject: string;
  content: string;
  type?: PlatformMessageType;
  attachments?: string[];
  replyToMessageId?: string; // If replying
  replyToContent?: string;
  replyToSubject?: string;
  threadId?: string; // If replying
}
```

#### `replyToThread(request)`
```typescript
request: {
  threadId: string;
  replyToMessageId: string;
  subject: string;
  content: string;
  type?: PlatformMessageType;
  attachments?: string[];
  from: string; // "platform" or businessId
  to: string;
  fromName?: string;
  toName?: string;
}
```

#### `getConversationThreads(userId, isAdmin)`
Returns:
```typescript
Array<{
  thread: Doc<PlatformMessage>; // Thread starter message
  messageCount: number; // Total messages in thread
  lastMessage: Doc<PlatformMessage>; // Most recent message
}>
```

## Testing Checklist

- [ ] Admin can send initial message to business
- [ ] Business receives message in conversations list
- [ ] Business can reply to admin message
- [ ] Admin sees reply in conversation thread
- [ ] Admin can reply back
- [ ] Multiple back-and-forth replies work correctly
- [ ] Character validation prevents short messages
- [ ] Character counter updates in real-time
- [ ] Conversation threads sort by most recent activity
- [ ] Message count badge shows correct number
- [ ] Business name displays correctly in admin view
- [ ] Timestamps display correctly

## Known Limitations

1. **No file attachments in conversation view** - Attachment upload UI needs to be added to reply forms
2. **No read receipts** - Status tracking not yet implemented for threaded messages
3. **No notifications** - Users must check conversations manually
4. **No search** - Cannot search within conversations
5. **No message editing** - Once sent, messages cannot be edited
6. **No message deletion** - No way to delete individual messages or threads

## Future Enhancements

1. Add file attachment support to reply forms
2. Implement read status tracking for thread messages
3. Add real-time notifications (WebSocket/polling)
4. Add conversation search and filtering
5. Add message editing functionality (with edit history)
6. Add thread archiving/deletion
7. Add typing indicators
8. Add message reactions/emojis
9. Add admin-to-admin internal notes on conversations
10. Add conversation assignment (assign to specific admin)

## Pages Reference

- `/business/messages` - Business conversation view (NEW)
- `/business/messages/page-old.tsx` - Old implementation (backup)
- `/admin/conversations` - Admin conversation view (NEW)
- `/admin/messages-inbox` - Old inbox view (deprecated, but kept for reference)
- `/admin/business-messages` - Create new message to business (unchanged)
