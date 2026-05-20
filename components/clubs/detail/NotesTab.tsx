'use client';
import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';

interface Props {
  slug: string;
  initialNotes: string;
}

export function NotesTab({ slug, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const dirty = notes !== saved;

  async function handleSave() {
    setSaving(true);
    setFeedback('');
    const res = await fetch(`/api/clubs/${slug}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_notes: notes }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(notes);
      setFeedback('Guardado');
      setTimeout(() => setFeedback(''), 2000);
    } else {
      setFeedback('Error al guardar');
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Notas internas — solo visibles para administradores de ZenSports
        </p>
        <div className="flex items-center gap-2">
          {feedback && (
            <span className={`text-xs ${feedback.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {feedback}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Guardar
          </button>
        </div>
      </div>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Agrega notas internas sobre este club: situación especial, acuerdos de pago, contacto clave, problemas conocidos..."
        rows={12}
        className="w-full rounded-xl border border-white/8 bg-white/3 text-sm text-gray-200 placeholder:text-gray-700 p-4 resize-none focus:outline-none focus:border-indigo-500/40 transition-colors"
      />
    </div>
  );
}
