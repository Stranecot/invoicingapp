'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { formatDateTime } from '@/lib/eu-format';

type Note = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
};

type NotesSectionProps = {
  entityType: 'INVOICE' | 'EXPENSE' | 'CUSTOMER';
  entityId: string;
};

export function NotesSection({ entityType, entityId }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [entityType, entityId]);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/notes?entityType=${entityType}&entityId=${entityId}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          content: newNote.trim(),
        }),
      });

      if (res.ok) {
        const note = await res.json();
        setNotes([note, ...notes]);
        setNewNote('');
      } else {
        alert('Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Notes</h2>
          <span className="text-sm text-gray-500">({notes.length})</span>
        </div>
      </div>

      <div className="p-6">
        {/* Add Note Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !newNote.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>

        {/* Notes List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No notes yet. Add the first note above.
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900">
                      {note.user.name || note.user.email}
                    </span>
                    <span className="ml-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      {note.user.role}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDateTime(note.createdAt)}
                  </span>
                </div>
                <p className="text-gray-700">{note.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
