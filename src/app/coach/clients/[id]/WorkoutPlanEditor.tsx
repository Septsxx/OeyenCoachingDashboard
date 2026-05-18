'use client'
import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import type { TrainingSchema, TrainingExercise } from '@/lib/types'
import { BTN_PRIMARY, BTN_GHOST, LABEL } from '@/lib/ui'

type SchemaWithExercises = TrainingSchema & { exercises: TrainingExercise[] }

function autoLabel(index: number): string {
  return `${String.fromCharCode(65 + index)}1`
}

const stickyTh: CSSProperties = {
  position: 'sticky',
  left: 0,
  background: 'var(--surface-2)',
  zIndex: 1,
  padding: '8px 12px',
  fontWeight: 600,
  fontSize: '0.68rem',
  color: 'var(--text-faint)',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  whiteSpace: 'nowrap',
  borderRight: '1px solid var(--border)',
}

const stickyTd: CSSProperties = {
  position: 'sticky',
  left: 0,
  background: 'var(--surface)',
  zIndex: 1,
  padding: '10px 12px',
  fontWeight: 600,
  fontSize: '0.78rem',
  color: 'var(--text-muted)',
  borderRight: '1px solid var(--border)',
  borderBottom: '1px solid var(--surface-2)',
  whiteSpace: 'nowrap',
}

const setTh: CSSProperties = {
  padding: '8px 12px',
  textAlign: 'center',
  color: '#004aad',
  fontWeight: 600,
  fontSize: '0.68rem',
  minWidth: '64px',
  whiteSpace: 'nowrap',
  borderRight: '1px solid var(--surface-2)',
}

const setTd: CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--surface-2)',
  borderRight: '1px solid var(--surface-2)',
  minWidth: '64px',
  height: '40px',
}

export default function WorkoutPlanEditor({
  clientId,
  initialSchemas,
}: {
  clientId: string
  initialSchemas: SchemaWithExercises[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [schemas, setSchemas] = useState<SchemaWithExercises[]>(initialSchemas)
  const [selectedId, setSelectedId] = useState<string | null>(initialSchemas[0]?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [schemaName, setSchemaName] = useState('')
  const [weeksCount, setWeeksCount] = useState(6)
  const [exercises, setExercises] = useState<TrainingExercise[]>([])

  useEffect(() => {
    const s = schemas.find(s => s.id === selectedId)
    if (s) {
      setSchemaName(s.name)
      setWeeksCount(s.weeks_count)
      setExercises([...s.exercises].sort((a, b) => a.sort_order - b.sort_order))
    } else {
      setSchemaName('')
      setWeeksCount(6)
      setExercises([])
    }
  }, [selectedId])

  async function handleNewSchema() {
    setSaving(true)
    setError(null)
    const newName = `Schema ${String.fromCharCode(65 + schemas.length)}`
    const { data, error: err } = await supabase
      .from('training_schemas')
      .insert({ client_id: clientId, name: newName, weeks_count: 6 })
      .select()
      .single()
    if (err) {
      setError(`Kon schema niet aanmaken: ${err.message}`)
    } else if (data) {
      const newSchema = { ...data, exercises: [] } as SchemaWithExercises
      setSchemas(prev => [...prev, newSchema])
      setSelectedId(data.id)
    }
    setSaving(false)
  }

  async function handleDeleteSchema() {
    if (!selectedId || !confirm(`Schema "${schemaName}" verwijderen? Dit kan niet ongedaan worden.`)) return
    setError(null)
    const { error: err } = await supabase.from('training_schemas').delete().eq('id', selectedId)
    if (err) { setError(`Kon schema niet verwijderen: ${err.message}`); return }
    const remaining = schemas.filter(s => s.id !== selectedId)
    setSchemas(remaining)
    setSelectedId(remaining[0]?.id ?? null)
  }

  async function handleSave() {
    if (!selectedId) return
    setSaving(true)
    setError(null)

    const { error: updateErr } = await supabase
      .from('training_schemas')
      .update({ name: schemaName, weeks_count: weeksCount, updated_at: new Date().toISOString() })
      .eq('id', selectedId)
    if (updateErr) { setError(`Opslaan mislukt: ${updateErr.message}`); setSaving(false); return }

    const { error: delErr } = await supabase.from('training_exercises').delete().eq('schema_id', selectedId)
    if (delErr) { setError(`Opslaan mislukt: ${delErr.message}`); setSaving(false); return }

    let savedExercises: TrainingExercise[] = []
    if (exercises.length > 0) {
      const toInsert = exercises.map((e, i) => ({
        schema_id: selectedId,
        label: e.label,
        name: e.name,
        sets_count: e.sets_count,
        reps: e.reps,
        tempo: e.tempo,
        sort_order: i,
      }))
      const { data, error: insErr } = await supabase.from('training_exercises').insert(toInsert).select()
      if (insErr) { setError(`Opslaan mislukt: ${insErr.message}`); setSaving(false); return }
      if (data) savedExercises = data as TrainingExercise[]
    }

    setExercises(savedExercises)
    setSchemas(prev => prev.map(s =>
      s.id === selectedId
        ? { ...s, name: schemaName, weeks_count: weeksCount, exercises: savedExercises }
        : s
    ))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    router.refresh()
  }

  function handleAddExercise() {
    const draft: TrainingExercise = {
      id: `draft-${Date.now()}`,
      schema_id: selectedId!,
      label: autoLabel(exercises.length),
      name: '',
      sets_count: 3,
      reps: '8-12',
      tempo: '3-0-1-0',
      sort_order: exercises.length,
      created_at: new Date().toISOString(),
    }
    setExercises(prev => [...prev, draft])
  }

  function updateExercise(id: string, field: keyof TrainingExercise, value: string | number) {
    setExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  function removeExercise(id: string) {
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  const weeks = Array.from({ length: weeksCount }, (_, i) => i + 1)

  return (
    <div>
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '0.82rem', color: '#DC2626', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>
      )}
      {/* Schema selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        {schemas.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedId(s.id)}
            style={{
              padding: '7px 16px',
              borderRadius: '8px',
              border: selectedId === s.id ? '1.5px solid var(--text)' : '1px solid var(--border)',
              background: selectedId === s.id ? 'var(--surface-2)' : 'transparent',
              color: selectedId === s.id ? 'var(--text)' : 'var(--text-dim)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: selectedId === s.id ? 600 : 400,
            }}
          >
            {s.name}
          </button>
        ))}
        <button
          onClick={handleNewSchema}
          disabled={saving}
          style={{ ...BTN_GHOST, padding: '7px 14px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Plus size={13} /> Nieuw schema
        </button>
      </div>

      {schemas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-faint)' }}>
          <p style={{ marginBottom: '12px' }}>Nog geen trainingsschema voor deze klant</p>
          <button onClick={handleNewSchema} disabled={saving} style={BTN_PRIMARY}>
            {saving ? 'Aanmaken...' : '+ Schema aanmaken'}
          </button>
        </div>
      ) : selectedId ? (
        <div>
          {/* Schema settings bar */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={LABEL}>Schemanaam</label>
              <input
                value={schemaName}
                onChange={e => setSchemaName(e.target.value)}
                style={{ fontSize: '0.9rem', fontWeight: 500 }}
              />
            </div>
            <div style={{ width: '130px' }}>
              <label style={LABEL}>Weken</label>
              <select value={weeksCount} onChange={e => setWeeksCount(Number(e.target.value))}>
                {[4, 5, 6, 8, 10, 12].map(w => (
                  <option key={w} value={w}>{w} weken</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleDeleteSchema}
              style={{ ...BTN_GHOST, color: '#EF4444', borderColor: '#EF4444' }}
            >
              Verwijderen
            </button>
          </div>

          {/* Exercise editor table */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '0', marginTop: '8px' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Oefeningen</p>
              <button
                onClick={handleAddExercise}
                style={{ ...BTN_GHOST, padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={13} /> Oefening toevoegen
              </button>
            </div>

            {exercises.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.85rem' }}>
                Nog geen oefeningen — klik op &ldquo;Oefening toevoegen&rdquo; om te beginnen.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)' }}>
                      {['Label', 'Oefening', 'Sets', 'Reps', 'Tempo', ''].map(h => (
                        <th key={h} style={{
                          padding: '9px 14px',
                          textAlign: 'left',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          color: 'var(--text-faint)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exercises.map(ex => (
                      <tr key={ex.id} style={{ borderBottom: '1px solid var(--surface-2)' }}>
                        <td style={{ padding: '8px 14px', width: '80px' }}>
                          <input
                            value={ex.label}
                            onChange={e => updateExercise(ex.id, 'label', e.target.value)}
                            style={{ width: '60px', fontSize: '0.82rem', fontWeight: 600 }}
                          />
                        </td>
                        <td style={{ padding: '8px 14px' }}>
                          <input
                            value={ex.name}
                            onChange={e => updateExercise(ex.id, 'name', e.target.value)}
                            placeholder="Naam oefening..."
                            style={{ width: '100%', minWidth: '200px', fontSize: '0.82rem' }}
                          />
                        </td>
                        <td style={{ padding: '8px 14px', width: '90px' }}>
                          <select
                            value={ex.sets_count}
                            onChange={e => updateExercise(ex.id, 'sets_count', Number(e.target.value))}
                            style={{ fontSize: '0.82rem', width: '70px' }}
                          >
                            {[2, 3, 4, 5].map(n => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '8px 14px', width: '110px' }}>
                          <input
                            value={ex.reps}
                            onChange={e => updateExercise(ex.id, 'reps', e.target.value)}
                            placeholder="8-12"
                            style={{ width: '88px', fontSize: '0.82rem' }}
                          />
                        </td>
                        <td style={{ padding: '8px 14px', width: '120px' }}>
                          <input
                            value={ex.tempo}
                            onChange={e => updateExercise(ex.id, 'tempo', e.target.value)}
                            placeholder="3-0-1-0"
                            style={{ width: '96px', fontSize: '0.82rem' }}
                          />
                        </td>
                        <td style={{ padding: '8px 14px', width: '44px' }}>
                          <button
                            onClick={() => removeExercise(ex.id)}
                            title="Verwijder oefening"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: '4px', display: 'flex', alignItems: 'center' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Save bar — inside the card, always visible */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--surface-2)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface)' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ ...BTN_PRIMARY, background: saved ? '#16A34A' : undefined, minWidth: '120px' }}
              >
                {saving ? 'Opslaan...' : saved ? 'Opgeslagen ✓' : 'Schema opslaan'}
              </button>
              {saved && <span style={{ fontSize: '0.78rem', color: '#16A34A' }}>Klant kan het schema nu bekijken</span>}
            </div>
          </div>

          {/* Preview — matches client view exactly */}
          {exercises.length > 0 && (
            <div style={{ marginTop: '28px' }}>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Voorvertoning</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: '2px' }}>Zoals de klant het schema ziet</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {exercises.map(ex => (
                  <div key={ex.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                        {ex.label}) {ex.name || '—'}
                      </p>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                          {ex.sets_count} sets
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                          {ex.reps} reps
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                          {ex.tempo}
                        </span>
                      </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                        <thead>
                          <tr style={{ background: 'var(--surface-2)' }}>
                            <th style={stickyTh}>Week</th>
                            {Array.from({ length: ex.sets_count }, (_, i) => (
                              <th key={i} style={setTh}>Set {i + 1}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {weeks.map(w => (
                            <tr key={w}>
                              <td style={stickyTd}>{w}</td>
                              {Array.from({ length: ex.sets_count }, (_, i) => (
                                <td key={i} style={setTd} />
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
