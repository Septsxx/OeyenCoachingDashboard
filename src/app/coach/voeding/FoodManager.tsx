'use client'
import { useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Food, FoodCategory } from '@/lib/types'
import { FOOD_CATEGORIES } from '@/lib/types'
import { BTN_PRIMARY, BTN_GHOST, LABEL } from '@/lib/ui'
import { Plus, Search, Pencil, Trash2, X, Check, ExternalLink } from 'lucide-react'

const EMPTY_FORM = {
  name: '', brand: '', category: '' as FoodCategory | '',
  calories_per_100g: '', protein_per_100g: '', carbs_per_100g: '',
  fat_per_100g: '', fiber_per_100g: '', serving_size_g: '100', unit: 'g' as 'g' | 'ml',
}

type FormState = typeof EMPTY_FORM


function MacroBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span style={{ fontSize: '0.72rem', color, fontWeight: 600 }}>
      {label} {value.toFixed(1)}g
    </span>
  )
}

function FoodForm({
  form, onChange, onSave, onCancel, saving, title,
}: {
  form: FormState
  onChange: (field: string, value: string) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  title: string
}) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
      <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '16px' }}>{title}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={LABEL}>Naam *</label>
          <input value={form.name} onChange={e => onChange('name', e.target.value)} placeholder="Bijv. Kipfilet" />
        </div>
        <div>
          <label style={LABEL}>Merk</label>
          <input value={form.brand} onChange={e => onChange('brand', e.target.value)} placeholder="Optioneel" />
        </div>
        <div>
          <label style={LABEL}>Categorie</label>
          <select value={form.category} onChange={e => onChange('category', e.target.value)}>
            <option value="">— kies categorie —</option>
            {(Object.entries(FOOD_CATEGORIES) as [FoodCategory, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>
      <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
        Macro's per 100g
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '12px' }}>
        {[
          ['calories_per_100g', 'Kcal'],
          ['protein_per_100g', 'Eiwitten (g)'],
          ['carbs_per_100g', 'KH (g)'],
          ['fat_per_100g', 'Vetten (g)'],
          ['fiber_per_100g', 'Vezels (g)'],
          ['serving_size_g', 'Port. (g)'],
        ].map(([field, label]) => (
          <div key={field}>
            <label style={LABEL}>{label}</label>
            <input type="number" step="0.1" min="0" value={(form as any)[field]} onChange={e => onChange(field, e.target.value)} placeholder="0" />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
        <button onClick={onCancel} style={BTN_GHOST}>Annuleer</button>
        <button onClick={onSave} disabled={saving || !form.name} style={{ ...BTN_PRIMARY, opacity: (saving || !form.name) ? 0.5 : 1 }}>
          {saving ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>
    </div>
  )
}

// Open Food Facts search
type OFFProduct = { code: string; product_name: string; brands: string; nutriments: Record<string, number> }

function OFFImporter({ onImport }: { onImport: (form: FormState) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<OFFProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&lc=nl&cc=be`
      )
      const data = await res.json()
      setResults(data.products ?? [])
    } catch {
      setResults([])
    }
    setLoading(false)
  }

  function toForm(p: OFFProduct): FormState {
    const n = p.nutriments ?? {}
    return {
      name: p.product_name || '',
      brand: p.brands || '',
      category: '',
      calories_per_100g: String(Math.round(n['energy-kcal_100g'] ?? n['energy_100g'] ?? 0)),
      protein_per_100g: String((n['proteins_100g'] ?? 0).toFixed(1)),
      carbs_per_100g: String((n['carbohydrates_100g'] ?? 0).toFixed(1)),
      fat_per_100g: String((n['fat_100g'] ?? 0).toFixed(1)),
      fiber_per_100g: String((n['fiber_100g'] ?? 0).toFixed(1)),
      serving_size_g: '100',
      unit: 'g',
    }
  }

  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
      <p style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '10px', color: 'var(--text-dim)' }}>
        Importeer van Open Food Facts
      </p>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Zoek product (bijv. 'kipfilet', 'kwark')..."
          style={{ flex: 1 }}
        />
        <button onClick={search} disabled={loading} style={{ ...BTN_PRIMARY, opacity: loading ? 0.6 : 1 }}>
          {loading ? '...' : <Search size={14} />}
        </button>
      </div>
      {searched && results.length === 0 && !loading && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>Geen resultaten gevonden.</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {results.map(p => {
          const n = p.nutriments ?? {}
          const kcal = Math.round(n['energy-kcal_100g'] ?? n['energy_100g'] ?? 0)
          const pro = (n['proteins_100g'] ?? 0).toFixed(1)
          const cho = (n['carbohydrates_100g'] ?? 0).toFixed(1)
          const fat = (n['fat_100g'] ?? 0).toFixed(1)
          return (
            <div key={p.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', borderRadius: '8px', padding: '10px 12px' }}>
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{p.product_name || '(geen naam)'}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  {p.brands || '—'} · {kcal} kcal · E {pro}g · KH {cho}g · V {fat}g
                </p>
              </div>
              <button onClick={() => onImport(toForm(p))} style={{ ...BTN_GHOST, fontSize: '0.75rem', padding: '5px 10px' }}>
                Importeer
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function FoodManager({ initialFoods }: { initialFoods: Food[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [foods, setFoods] = useState(initialFoods)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<FoodCategory | ''>('')
  const [showAdd, setShowAdd] = useState(false)
  const [showImporter, setShowImporter] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return foods.filter(f => {
      const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || (f.brand ?? '').toLowerCase().includes(search.toLowerCase())
      const matchCat = !catFilter || f.category === catFilter
      return matchSearch && matchCat
    })
  }, [foods, search, catFilter])

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }
  function updateEditForm(field: string, value: string) {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  function formToPayload(f: FormState) {
    return {
      name: f.name.trim(),
      brand: f.brand.trim() || null,
      category: f.category || null,
      calories_per_100g: parseFloat(f.calories_per_100g) || 0,
      protein_per_100g: parseFloat(f.protein_per_100g) || 0,
      carbs_per_100g: parseFloat(f.carbs_per_100g) || 0,
      fat_per_100g: parseFloat(f.fat_per_100g) || 0,
      fiber_per_100g: f.fiber_per_100g ? parseFloat(f.fiber_per_100g) : null,
      serving_size_g: f.serving_size_g ? parseFloat(f.serving_size_g) : 100,
      unit: f.unit,
    }
  }

  async function handleAdd() {
    if (!form.name) return
    setSaving(true)
    const { data, error } = await supabase.from('foods').insert(formToPayload(form)).select().single()
    if (!error && data) {
      setFoods(prev => [...prev, data as Food].sort((a, b) => a.name.localeCompare(b.name)))
      setForm(EMPTY_FORM)
      setShowAdd(false)
      setShowImporter(false)
    }
    setSaving(false)
  }

  function startEdit(food: Food) {
    setEditId(food.id)
    setEditForm({
      name: food.name,
      brand: food.brand ?? '',
      category: food.category ?? '',
      calories_per_100g: String(food.calories_per_100g),
      protein_per_100g: String(food.protein_per_100g),
      carbs_per_100g: String(food.carbs_per_100g),
      fat_per_100g: String(food.fat_per_100g),
      fiber_per_100g: String(food.fiber_per_100g ?? ''),
      serving_size_g: String(food.serving_size_g ?? 100),
      unit: food.unit,
    })
  }

  async function handleSaveEdit() {
    if (!editId || !editForm.name) return
    setSaving(true)
    const { data, error } = await supabase.from('foods').update(formToPayload(editForm)).eq('id', editId).select().single()
    if (!error && data) {
      setFoods(prev => prev.map(f => f.id === editId ? data as Food : f))
      setEditId(null)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('foods').update({ is_active: false }).eq('id', id)
    setFoods(prev => prev.filter(f => f.id !== id))
    setDeletingId(null)
  }

  function handleImport(importedForm: FormState) {
    setForm(importedForm)
    setShowImporter(false)
    setShowAdd(true)
  }

  const categoriesInUse = useMemo(() => {
    const seen = new Set(foods.map(f => f.category).filter(Boolean))
    return Array.from(seen) as FoodCategory[]
  }, [foods])

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek voedingsmiddel..."
            style={{ paddingLeft: '32px', width: '100%' }}
          />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value as FoodCategory | '')} style={{ minWidth: '160px' }}>
          <option value="">Alle categorieën</option>
          {categoriesInUse.map(cat => (
            <option key={cat} value={cat}>{FOOD_CATEGORIES[cat]}</option>
          ))}
        </select>
        <button onClick={() => { setShowImporter(v => !v); setShowAdd(false) }} style={{ ...BTN_GHOST, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ExternalLink size={14} /> Open Food Facts
        </button>
        <button onClick={() => { setShowAdd(v => !v); setShowImporter(false); setForm(EMPTY_FORM) }} style={{ ...BTN_PRIMARY, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={14} /> Voeg toe
        </button>
      </div>

      {/* OFF importer */}
      {showImporter && <OFFImporter onImport={handleImport} />}

      {/* Add form */}
      {showAdd && (
        <FoodForm
          form={form}
          onChange={updateForm}
          onSave={handleAdd}
          onCancel={() => { setShowAdd(false); setForm(EMPTY_FORM) }}
          saving={saving}
          title="Nieuw voedingsmiddel"
        />
      )}

      {/* Food list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-faint)' }}>
          <p style={{ fontSize: '0.9rem' }}>
            {foods.length === 0 ? 'Nog geen voedingsmiddelen toegevoegd.' : 'Geen resultaten voor deze zoekopdracht.'}
          </p>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 70px 70px 70px 60px 80px', gap: '12px', padding: '10px 16px', background: 'var(--surface-2)', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            <span>Naam</span>
            <span>Categorie</span>
            <span style={{ textAlign: 'right' }}>Kcal</span>
            <span style={{ textAlign: 'right' }}>Eiw.</span>
            <span style={{ textAlign: 'right' }}>KH</span>
            <span style={{ textAlign: 'right' }}>Vet</span>
            <span style={{ textAlign: 'right' }}>Port.</span>
            <span />
          </div>

          {filtered.map((food, i) => (
            editId === food.id ? (
              <div key={food.id} style={{ padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <FoodForm
                  form={editForm}
                  onChange={updateEditForm}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditId(null)}
                  saving={saving}
                  title="Bewerk voedingsmiddel"
                />
              </div>
            ) : (
              <div key={food.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 80px 70px 70px 70px 60px 80px',
                gap: '12px',
                padding: '12px 16px',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                alignItems: 'center',
                fontSize: '0.83rem',
              }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{food.name}</span>
                  {food.brand && <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: '6px' }}>{food.brand}</span>}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {food.category ? FOOD_CATEGORIES[food.category] : '—'}
                </span>
                <span style={{ textAlign: 'right', fontWeight: 600 }}>{food.calories_per_100g}</span>
                <span style={{ textAlign: 'right', color: '#004aad' }}>{food.protein_per_100g}</span>
                <span style={{ textAlign: 'right', color: '#F59E0B' }}>{food.carbs_per_100g}</span>
                <span style={{ textAlign: 'right', color: '#EF4444' }}>{food.fat_per_100g}</span>
                <span style={{ textAlign: 'right', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                  {food.serving_size_g ?? 100}{food.unit}
                </span>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  {deletingId === food.id ? (
                    <>
                      <button onClick={() => handleDelete(food.id)} style={{ ...BTN_GHOST, padding: '4px 8px', fontSize: '0.72rem', color: '#EF4444', borderColor: '#EF4444' }}>
                        Ja
                      </button>
                      <button onClick={() => setDeletingId(null)} style={{ ...BTN_GHOST, padding: '4px 8px', fontSize: '0.72rem' }}>
                        Nee
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(food)} style={{ ...BTN_GHOST, padding: '5px', lineHeight: 0 }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeletingId(food.id)} style={{ ...BTN_GHOST, padding: '5px', lineHeight: 0, color: '#EF4444' }}>
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}
