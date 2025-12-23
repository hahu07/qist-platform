"use client";

import { useState, useEffect } from "react";
import {
  InternalNote,
  CollaborationRequest,
} from "@/schemas";
import {
  createInternalNote,
  updateInternalNote,
  addNoteReaction,
  getApplicationNotes,
  deleteInternalNote,
  createCollaborationRequest,
  respondToCollaborationRequest,
  getUserCollaborationRequests,
} from "@/utils/message-actions";

interface InternalNotesProps {
  applicationId: string;
  currentUserId: string;
  currentUserName: string;
}

export function InternalNotes({
  applicationId,
  currentUserId,
  currentUserName,
}: InternalNotesProps) {
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [noteType, setNoteType] = useState<InternalNote["noteType"]>("general");
  const [mentions, setMentions] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
  }, [applicationId]);

  const loadNotes = async () => {
    try {
      const appNotes = await getApplicationNotes(applicationId);
      setNotes(appNotes);
    } catch (err) {
      console.error("Failed to load notes:", err);
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Parse mentions (format: @userId1,@userId2)
      const mentionsList = mentions
        .split(",")
        .map((m) => m.trim().replace("@", ""))
        .filter(Boolean);

      // Parse tags
      const tagsList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await createInternalNote({
        applicationId,
        authorId: currentUserId,
        authorName: currentUserName,
        content: newNoteContent,
        noteType,
        mentions: mentionsList.length > 0 ? mentionsList : undefined,
        tags: tagsList.length > 0 ? tagsList : undefined,
        isPinned,
      });

      // Reset form
      setNewNoteContent("");
      setNoteType("general");
      setMentions("");
      setTags("");
      setIsPinned(false);

      await loadNotes();
    } catch (err) {
      console.error("Failed to create note:", err);
      setError(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (noteId: string, currentPinned: boolean) => {
    try {
      await updateInternalNote(noteId, { isPinned: !currentPinned });
      await loadNotes();
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  const handleReaction = async (noteId: string, emoji: string) => {
    try {
      await addNoteReaction(noteId, currentUserId, emoji);
      await loadNotes();
    } catch (err) {
      console.error("Failed to add reaction:", err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      await deleteInternalNote(noteId);
      await loadNotes();
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const noteTypeColors = {
    general: "bg-blue-100 dark:bg-blue-900 border-blue-500",
    risk_flag: "bg-red-100 dark:bg-red-900 border-red-500",
    recommendation: "bg-green-100 dark:bg-green-900 border-green-500",
    question: "bg-amber-100 dark:bg-amber-900 border-amber-500",
    decision: "bg-purple-100 dark:bg-purple-900 border-purple-500",
  };

  const noteTypeIcons = {
    general: "📝",
    risk_flag: "⚠️",
    recommendation: "✅",
    question: "❓",
    decision: "⚖️",
  };

  return (
    <div className="space-y-6">
      {/* Create Note Form */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 bg-white dark:bg-neutral-800">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Add Internal Note</h3>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Note Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2 text-neutral-900 dark:text-white">Note Type:</label>
          <div className="flex flex-wrap gap-2">
            {(
              ["general", "risk_flag", "recommendation", "question", "decision"] as const
            ).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setNoteType(type)}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all ${
                  noteType === type
                    ? noteTypeColors[type]
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {noteTypeIcons[type]} {type.replace("_", " ").toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Note Content */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2 text-neutral-900 dark:text-white">Note Content:</label>
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            disabled={loading}
            placeholder="Enter your internal note here..."
            rows={4}
            className="w-full px-4 py-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Mentions and Tags */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-neutral-900 dark:text-white">
              Mentions (comma-separated user IDs):
            </label>
            <input
              type="text"
              value={mentions}
              onChange={(e) => setMentions(e.target.value)}
              disabled={loading}
              placeholder="user1, user2"
              className="w-full px-4 py-2.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-neutral-900 dark:text-white">
              Tags (comma-separated):
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={loading}
              placeholder="urgent, follow-up"
              className="w-full px-4 py-2.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Pin Checkbox */}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              disabled={loading}
              className="w-5 h-5 border border-neutral-300 dark:border-neutral-600 rounded text-primary-600 focus:ring-2 focus:ring-primary-500"
            />
            <span className="font-semibold text-neutral-900 dark:text-white">📌 Pin this note to top</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleCreateNote}
          disabled={loading || !newNoteContent.trim()}
          className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
        >
          {loading ? "Adding Note..." : "Add Note"}
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Internal Notes ({notes.length})</h3>

        {notes.length === 0 ? (
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 text-center text-neutral-500 dark:text-neutral-400">
            No internal notes yet. Add one above to get started.
          </div>
        ) : (
          notes.map((note, index) => (
            <div
              key={index}
              className={`rounded-xl ${noteTypeColors[note.noteType]} p-4`}
            >
              {/* Note Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-2">
                  <span className="text-2xl">{noteTypeIcons[note.noteType]}</span>
                  <div>
                    <p className="font-bold">{note.authorName}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {formatTimestamp(note.timestamp)}
                      {note.editedAt && " (edited)"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {note.isPinned && <span className="text-xl">📌</span>}
                  <button
                    onClick={() =>
                      handleTogglePin(
                        `note_${note.applicationId}_${note.timestamp}`,
                        note.isPinned
                      )
                    }
                    className="text-xs px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 font-semibold transition-all"
                    title={note.isPinned ? "Unpin" : "Pin"}
                  >
                    {note.isPinned ? "Unpin" : "Pin"}
                  </button>
                  {note.authorId === currentUserId && (
                    <button
                      onClick={() =>
                        handleDeleteNote(
                          `note_${note.applicationId}_${note.timestamp}`
                        )
                      }
                      className="text-sm px-2 py-1 bg-red-500 text-white border-[2px] border-black hover:bg-red-600"
                      title="Delete"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Note Content */}
              <div className="mb-3">
                <p className="whitespace-pre-wrap">{note.content}</p>
              </div>

              {/* Tags */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {note.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs bg-black text-white font-bold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Mentions */}
              {note.mentions && note.mentions.length > 0 && (
                <div className="mb-3 text-sm">
                  <span className="font-semibold text-neutral-900 dark:text-white">Mentioned:</span>{" "}
                  {note.mentions.map((m, i) => (
                    <span key={i} className="text-primary-600 dark:text-primary-400 font-semibold">
                      @{m}
                      {i < note.mentions.length - 1 && ", "}
                    </span>
                  ))}
                </div>
              )}

              {/* Reactions */}
              <div className="flex items-center gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">React:</span>
                {["👍", "👎", "❤️", "🎯", "⚡"].map((emoji) => {
                  const reactionCount = note.reactions.filter(
                    (r) => r.emoji === emoji
                  ).length;
                  const userReacted = note.reactions.some(
                    (r) => r.emoji === emoji && r.userId === currentUserId
                  );

                  return (
                    <button
                      key={emoji}
                      onClick={() =>
                        handleReaction(
                          `note_${note.applicationId}_${note.timestamp}`,
                          emoji
                        )
                      }
                      className={`px-2 py-1 rounded-lg text-lg transition-all hover:scale-110 ${
                        userReacted
                          ? "bg-primary-100 dark:bg-primary-900/30"
                          : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      {emoji}
                      {reactionCount > 0 && (
                        <span className="ml-1 text-xs font-bold">
                          {reactionCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Collaboration Requests Component
 * Manage second opinions and consultations
 */
export function CollaborationRequests({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState<Record<string, string>>({});

  useEffect(() => {
    loadRequests();
  }, [userId]);

  const loadRequests = async () => {
    try {
      const userRequests = await getUserCollaborationRequests(userId);
      setRequests(userRequests);
    } catch (err) {
      console.error("Failed to load collaboration requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (
    requestId: string,
    status: "completed" | "declined"
  ) => {
    const response = responseText[requestId];
    if (!response?.trim()) {
      alert("Please provide a response");
      return;
    }

    try {
      await respondToCollaborationRequest(requestId, response, status);
      setResponseText({ ...responseText, [requestId]: "" });
      await loadRequests();
    } catch (err) {
      console.error("Failed to respond:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center border-[3px] border-black dark:border-lavender-blue-200">
        Loading collaboration requests...
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const completedRequests = requests.filter(
    (r) => r.status === "completed" || r.status === "declined"
  );

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <div>
        <h3 className="text-xl font-bold mb-4">
          Pending Requests ({pendingRequests.length})
        </h3>
        {pendingRequests.length === 0 ? (
          <div className="border-[3px] border-black dark:border-lavender-blue-200 p-6 text-center text-gray-500 dark:text-gray-400">
            No pending collaboration requests
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((req, index) => (
              <div
                key={index}
                className="border-[3px] border-amber-500 bg-amber-50 dark:bg-amber-900 p-4 shadow-[8px_8px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-lg">
                      {req.requestType.replace("_", " ").toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      From: {req.requesterName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(req.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  {req.priority !== "normal" && (
                    <span
                      className={`px-3 py-1 text-sm font-bold uppercase ${
                        req.priority === "urgent"
                          ? "bg-red-500 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {req.priority}
                    </span>
                  )}
                </div>

                <div className="mb-3">
                  <p className="font-bold mb-1">Question:</p>
                  <p className="whitespace-pre-wrap">{req.question}</p>
                </div>

                {req.context && (
                  <div className="mb-3">
                    <p className="font-bold mb-1">Context:</p>
                    <p className="text-sm whitespace-pre-wrap">{req.context}</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t-2 border-black dark:border-amber-600">
                  <label className="block text-sm font-bold mb-2">
                    Your Response:
                  </label>
                  <textarea
                    value={responseText[`collab_${req.applicationId}_${req.requestedAt}`] || ""}
                    onChange={(e) =>
                      setResponseText({
                        ...responseText,
                        [`collab_${req.applicationId}_${req.requestedAt}`]: e.target.value,
                      })
                    }
                    placeholder="Provide your feedback..."
                    rows={3}
                    className="w-full px-4 py-2 mb-3 border-[3px] border-black dark:border-lavender-blue-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-lavender-blue-500"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        handleRespond(
                          `collab_${req.applicationId}_${req.requestedAt}`,
                          "completed"
                        )
                      }
                      className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                    >
                      Submit Response
                    </button>
                    <button
                      onClick={() =>
                        handleRespond(
                          `collab_${req.applicationId}_${req.requestedAt}`,
                          "declined"
                        )
                      }
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Requests */}
      <div>
        <h3 className="text-xl font-bold mb-4">
          Completed Requests ({completedRequests.length})
        </h3>
        {completedRequests.length === 0 ? (
          <div className="border-[3px] border-black dark:border-lavender-blue-200 p-6 text-center text-gray-500 dark:text-gray-400">
            No completed requests
          </div>
        ) : (
          <div className="space-y-4">
            {completedRequests.map((req, index) => (
              <div
                key={index}
                className="border-[3px] border-black dark:border-lavender-blue-200 bg-white dark:bg-gray-800 p-4 opacity-75"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold">
                      {req.requestType.replace("_", " ").toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      From: {req.requesterName}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-bold uppercase ${
                      req.status === "completed"
                        ? "bg-green-500 text-white"
                        : "bg-gray-500 text-white"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
                {req.response && (
                  <div className="mt-3 pt-3 border-t-2 border-black dark:border-gray-600">
                    <p className="text-sm font-bold">Response:</p>
                    <p className="text-sm">{req.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
