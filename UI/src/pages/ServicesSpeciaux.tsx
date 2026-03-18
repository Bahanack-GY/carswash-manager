import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Plus, Search, X, Pencil, LayoutList, LayoutGrid,
  Trash2, Droplets, Wrench, Tag, Clock, Coins, Eye, Palette,
} from '@/lib/icons'
import { useExtras, useCreateExtra, useUpdateExtra, useDeleteExtra } from '@/api/extras'
import type { ExtraService, CreateExtraServiceDto, UpdateExtraServiceDto, ExtraCategorie } from '@/api/extras/types'
import { useAuth } from '@/contexts/AuthContext'

const NAVY = '#283852'

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const rise = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

function formatPrice(price: number | string | null | undefined) {
  if (price == null) return '—'
  return new Intl.NumberFormat('fr-FR').format(Number(price))
}

function formatDuration(minutes: number | null | undefined) {
  const m = Number(minutes)
  if (!m) return '—'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h}h ${rem}min` : `${h}h`
}

type Categorie = ExtraCategorie | 'all'

const CATEGORIES: { key: Categorie; label: string; icon: React.ElementType; gradient: string; bg: string }[] = [
  { key: 'all',        label: 'Tous',        icon: Sparkles,  gradient: 'from-slate-500 to-slate-600',    bg: 'bg-slate-500/10 text-slate-600' },
  { key: 'lavage',     label: 'Lavage',      icon: Droplets,  gradient: 'from-sky-500 to-teal-500',       bg: 'bg-sky-500/10 text-sky-600' },
  { key: 'renovation', label: 'Rénovation',  icon: Sparkles,  gradient: 'from-purple-500 to-fuchsia-500', bg: 'bg-purple-500/10 text-purple-600' },
  { key: 'film',       label: 'Film',        icon: Palette,   gradient: 'from-amber-500 to-orange-500',   bg: 'bg-amber-500/10 text-amber-600' },
  { key: 'accessoire', label: 'Accessoires', icon: Wrench,    gradient: 'from-indigo-500 to-blue-500',    bg: 'bg-indigo-500/10 text-indigo-600' },
  { key: 'vitre',      label: 'Vitres',      icon: Eye,       gradient: 'from-cyan-500 to-teal-500',      bg: 'bg-cyan-500/10 text-cyan-600' },
  { key: 'nettoyage',  label: 'Nettoyage',   icon: Tag,       gradient: 'from-emerald-500 to-green-500',  bg: 'bg-emerald-500/10 text-emerald-600' },
]

function catInfo(cat?: string | null) {
  return CATEGORIES.find(c => c.key === cat) ?? CATEGORIES[0]
}

const emptyForm: CreateExtraServiceDto = {
  nom: '', categorie: 'lavage', prix: 0,
  prixCatB: null, commission: null, fraisService: null,
  bonus: null, dureeEstimee: undefined, statut: 'active',
}

export default function ServicesSpeciaux() {
  const { selectedStationId } = useAuth()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<Categorie>('all')
  const [view, setView] = useState<'table' | 'grid'>('table')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExtra, setEditingExtra] = useState<ExtraService | null>(null)
  const [formData, setFormData] = useState<CreateExtraServiceDto>(emptyForm)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const { data: extrasData, isLoading, isError } = useExtras(
    selectedStationId ? { stationId: selectedStationId } : undefined,
  )
  const createExtra = useCreateExtra()
  const updateExtra = useUpdateExtra()
  const deleteExtra = useDeleteExtra()

  const extras: ExtraService[] = Array.isArray(extrasData)
    ? extrasData
    : (extrasData as any)?.data ?? []

  const filtered = extras.filter((e) => {
    const matchCat = catFilter === 'all' || e.categorie === catFilter
    const matchSearch = e.nom.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const totalCount = extras.length
  const activeCount = extras.filter(e => e.statut === 'active').length

  // ── Modal helpers ──────────────────────────────────────────────────
  const openCreate = () => {
    setEditingExtra(null)
    setFormData({ ...emptyForm, categorie: catFilter !== 'all' ? (catFilter as ExtraCategorie) : 'lavage' })
    setIsModalOpen(true)
  }

  const openEdit = (extra: ExtraService) => {
    setEditingExtra(extra)
    setFormData({
      nom: extra.nom,
      categorie: extra.categorie ?? 'lavage',
      particularites: extra.particularites ?? '',
      prix: Number(extra.prix),
      prixCatB: extra.prixCatB != null ? Number(extra.prixCatB) : null,
      commission: extra.commission != null ? Number(extra.commission) : null,
      fraisService: extra.fraisService != null ? Number(extra.fraisService) : null,
      bonus: extra.bonus != null ? Number(extra.bonus) : null,
      dureeEstimee: extra.dureeEstimee ?? undefined,
      statut: extra.statut,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingExtra(null)
    setFormData(emptyForm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingExtra) {
        const dto: UpdateExtraServiceDto = { ...formData }
        await updateExtra.mutateAsync({ id: editingExtra.id, data: dto })
      } else {
        await createExtra.mutateAsync({ ...formData, stationId: selectedStationId || undefined })
      }
      closeModal()
    } catch (err) {
      console.error('Failed to save extra service', err)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteExtra.mutateAsync(id)
    } catch (err) {
      console.error('Failed to delete extra service', err)
    } finally {
      setConfirmDeleteId(null)
    }
  }

  const handleToggleStatut = async (extra: ExtraService) => {
    const newStatut = extra.statut === 'active' ? 'suspended' : 'active'
    try {
      await updateExtra.mutateAsync({ id: extra.id, data: { statut: newStatut } })
    } catch (err) {
      console.error('Failed to toggle statut', err)
    }
  }

  const isPending = createExtra.isPending || updateExtra.isPending
  const isSubmitError = createExtra.isError || updateExtra.isError

  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
        {/* Header */}
        <motion.div variants={rise} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-ink flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-accent" /> Services Sp&eacute;ciaux
            </h1>
            <p className="text-ink-faded mt-0.5 text-sm">
              {totalCount} services &bull; {activeCount} actifs
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-teal-600 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-shadow text-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Nouveau service
          </button>
        </motion.div>

        {/* Category tabs */}
        <motion.div variants={rise} className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const active = catFilter === cat.key
            return (
              <button
                key={cat.key}
                onClick={() => setCatFilter(cat.key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
                  active
                    ? 'border-transparent text-white shadow-sm'
                    : 'bg-panel border-edge text-ink-muted hover:text-ink hover:border-ink-ghost'
                }`}
                style={active ? { background: NAVY } : {}}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
                {cat.key !== 'all' && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-md ${active ? 'bg-white/20' : 'bg-edge'}`}>
                    {extras.filter(e => e.categorie === cat.key).length}
                  </span>
                )}
              </button>
            )
          })}
        </motion.div>

        {/* Search + view toggle */}
        <motion.div variants={rise} className="flex gap-3">
          <div className="flex items-center gap-2 bg-panel border border-edge rounded-xl px-4 py-2.5 flex-1 shadow-sm focus-within:border-teal-500/40 transition-colors">
            <Search className="w-4 h-4 text-ink-muted shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un service..."
              className="bg-transparent text-sm text-ink placeholder-ink-muted outline-none flex-1 min-w-0"
            />
          </div>
          <div className="hidden sm:flex items-center bg-panel border border-edge rounded-xl overflow-hidden shrink-0">
            <button
              onClick={() => setView('table')}
              className={`p-2.5 transition-colors ${view === 'table' ? 'bg-teal-500/10 text-accent' : 'text-ink-muted hover:text-ink'}`}
              title="Vue tableau"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('grid')}
              className={`p-2.5 transition-colors ${view === 'grid' ? 'bg-teal-500/10 text-accent' : 'text-ink-muted hover:text-ink'}`}
              title="Vue grille"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
          </div>
        ) : isError ? (
          <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-sm">
            Erreur lors du chargement des services sp&eacute;ciaux.
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-ink-muted p-12 border border-dashed border-divider rounded-xl">
            {search || catFilter !== 'all'
              ? 'Aucun service ne correspond aux filtres.'
              : 'Aucun service spécial configuré. Commencez par en créer un.'}
          </div>
        ) : view === 'table' ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-panel border border-edge rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-180">
                <thead>
                  <tr className="border-b border-divider bg-inset">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-faded uppercase tracking-wider">Service</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-ink-faded uppercase tracking-wider">Cat A</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-ink-faded uppercase tracking-wider">Cat B</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-ink-faded uppercase tracking-wider hidden lg:table-cell" title="Commission versée au commercial qui a amené le client">Comm. commercial</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-ink-faded uppercase tracking-wider hidden lg:table-cell" title="Frais de service versés aux laveurs">Frais laveurs</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-ink-faded uppercase tracking-wider hidden md:table-cell">Durée</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-ink-faded uppercase tracking-wider">Statut</th>
                    <th className="w-16 px-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {filtered.map((extra) => {
                    const info = catInfo(extra.categorie)
                    const Icon = info.icon
                    const suspended = extra.statut === 'suspended'
                    return (
                      <tr key={extra.id} className={`hover:bg-raised transition-colors group ${suspended ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-linear-to-br ${info.gradient} flex items-center justify-center text-white shrink-0`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="font-medium text-ink line-clamp-1">{extra.nom}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-md ${info.bg}`}>{info.label}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-ok tabular-nums">{formatPrice(extra.prix)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {extra.prixCatB != null ? (
                            <span className="font-semibold text-ink tabular-nums">{formatPrice(extra.prixCatB)}</span>
                          ) : (
                            <span className="text-ink-ghost text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          {extra.commission != null ? (
                            <span className="text-xs font-medium text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded-md tabular-nums">
                              {formatPrice(extra.commission)} F
                            </span>
                          ) : <span className="text-ink-ghost text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          {extra.fraisService != null ? (
                            <span className="text-xs font-medium text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md tabular-nums">
                              {formatPrice(extra.fraisService)} F
                            </span>
                          ) : <span className="text-ink-ghost text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center hidden md:table-cell">
                          <span className="text-xs text-ink-muted flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3" /> {formatDuration(extra.dureeEstimee)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleStatut(extra)}
                            className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                              suspended
                                ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                            }`}
                          >
                            {suspended ? 'Suspendu' : 'Actif'}
                          </button>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEdit(extra)}
                              className="p-1.5 rounded-lg text-ink-ghost hover:text-accent hover:bg-accent-wash transition-colors"
                              title="Modifier"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(extra.id)}
                              className="p-1.5 rounded-lg text-ink-ghost hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {filtered.map((extra) => {
              const info = catInfo(extra.categorie)
              const Icon = info.icon
              const suspended = extra.statut === 'suspended'
              return (
                <motion.div
                  key={extra.id}
                  variants={rise}
                  className={`bg-panel border border-edge rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group ${suspended ? 'opacity-60' : ''}`}
                >
                  <div className={`h-1.5 bg-linear-to-r ${info.gradient}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${info.gradient} flex items-center justify-center text-white shadow-sm shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-heading font-semibold text-ink text-sm line-clamp-2">{extra.nom}</h3>
                          <span className={`text-xs px-1.5 py-0.5 rounded-md ${info.bg}`}>{info.label}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(extra)}
                          className="p-1.5 rounded-lg text-ink-muted hover:text-accent hover:bg-accent-wash transition-colors opacity-0 group-hover:opacity-100"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(extra.id)}
                          className="p-1.5 rounded-lg text-ink-muted hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Prices */}
                    <div className={`grid gap-2 mt-3 ${extra.prixCatB != null ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      <div className="bg-inset rounded-xl p-3 text-center">
                        <p className="text-xs text-ink-muted mb-1">Cat A</p>
                        <p className="font-heading text-lg font-bold text-ink tabular-nums">{formatPrice(extra.prix)}</p>
                        <p className="text-xs text-ink-ghost">FCFA</p>
                      </div>
                      {extra.prixCatB != null && (
                        <div className="bg-inset rounded-xl p-3 text-center">
                          <p className="text-xs text-ink-muted mb-1">Cat B</p>
                          <p className="font-heading text-lg font-bold text-ink tabular-nums">{formatPrice(extra.prixCatB)}</p>
                          <p className="text-xs text-ink-ghost">FCFA</p>
                        </div>
                      )}
                    </div>

                    {/* Footer row */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-divider">
                      <div className="flex items-center gap-1 text-xs text-ink-muted">
                        <Clock className="w-3 h-3" /> {formatDuration(extra.dureeEstimee)}
                      </div>
                      <button
                        onClick={() => handleToggleStatut(extra)}
                        className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                          suspended
                            ? 'bg-red-500/10 text-red-600'
                            : 'bg-emerald-500/10 text-emerald-600'
                        }`}
                      >
                        {suspended ? 'Suspendu' : 'Actif'}
                      </button>
                    </div>

                    {extra.commission != null && (
                      <div className="mt-2 flex items-center gap-1.5 bg-indigo-500/10 rounded-lg py-1.5 px-3">
                        <Coins className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-xs font-medium text-indigo-700">Commission commercial : {formatPrice(extra.commission)} F</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </motion.div>

      {/* ── Create / Edit Modal ──────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-panel border border-edge rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-divider bg-inset shrink-0">
                <h3 className="font-heading font-bold text-lg text-ink flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  {editingExtra ? 'Modifier le service' : 'Nouveau service spécial'}
                </h3>
                <button onClick={closeModal} className="p-1 text-ink-muted hover:text-ink transition-colors rounded-lg hover:bg-raised">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                {isSubmitError && (
                  <div className="p-3 bg-red-500/10 text-red-500 rounded-xl text-sm border border-red-500/20">
                    Erreur lors de {editingExtra ? 'la modification' : 'la création'} du service.
                  </div>
                )}

                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-ink-light mb-1.5">Nom du service *</label>
                  <input
                    required type="text" value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 bg-inset border border-outline rounded-xl text-ink outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 text-sm"
                    placeholder="ex: Cirage carrosserie complet..."
                  />
                </div>

                {/* Catégorie + Statut */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-light mb-1.5">Catégorie</label>
                    <select
                      value={formData.categorie ?? 'lavage'}
                      onChange={(e) => setFormData({ ...formData, categorie: e.target.value as ExtraCategorie })}
                      className="w-full px-3 py-2 bg-inset border border-outline rounded-xl text-ink outline-none focus:border-teal-500 text-sm"
                    >
                      {CATEGORIES.filter(c => c.key !== 'all').map(c => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-light mb-1.5">Statut</label>
                    <select
                      value={formData.statut ?? 'active'}
                      onChange={(e) => setFormData({ ...formData, statut: e.target.value as 'active' | 'suspended' })}
                      className="w-full px-3 py-2 bg-inset border border-outline rounded-xl text-ink outline-none focus:border-teal-500 text-sm"
                    >
                      <option value="active">Actif</option>
                      <option value="suspended">Suspendu</option>
                    </select>
                  </div>
                </div>

                {/* Particularités */}
                <div>
                  <label className="block text-sm font-medium text-ink-light mb-1.5">Particularités</label>
                  <textarea
                    rows={2}
                    value={formData.particularites ?? ''}
                    onChange={(e) => setFormData({ ...formData, particularites: e.target.value })}
                    className="w-full px-3 py-2 bg-inset border border-outline rounded-xl text-ink outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 resize-none text-sm"
                    placeholder="Inclus, conditions particulières..."
                  />
                </div>

                {/* Prix Cat A / Cat B */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-light mb-1.5">Prix Cat A (FCFA) *</label>
                    <input
                      required type="number" min={0} step={100}
                      value={formData.prix || ''}
                      onChange={(e) => setFormData({ ...formData, prix: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-inset border border-outline rounded-xl text-ink outline-none focus:border-teal-500 text-sm"
                      placeholder="5000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-light mb-1.5">Prix Cat B (FCFA)</label>
                    <input
                      type="number" min={0} step={100}
                      value={formData.prixCatB ?? ''}
                      onChange={(e) => setFormData({ ...formData, prixCatB: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 bg-inset border border-outline rounded-xl text-ink outline-none focus:border-teal-500 text-sm"
                      placeholder="7000"
                    />
                  </div>
                </div>

                {/* Commission + Frais de service */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-light mb-1.5">
                      Commission commercial (FCFA)
                    </label>
                    <input
                      type="number" min={0} step={100}
                      value={formData.commission ?? ''}
                      onChange={(e) => setFormData({ ...formData, commission: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 bg-inset border border-outline rounded-xl text-ink outline-none focus:border-teal-500 text-sm"
                      placeholder="1000"
                    />
                    <p className="text-xs text-ink-ghost mt-1">Versée au commercial qui a amené le client</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-light mb-1.5">
                      Frais de service laveurs (FCFA)
                    </label>
                    <input
                      type="number" min={0} step={50}
                      value={formData.fraisService ?? ''}
                      onChange={(e) => setFormData({ ...formData, fraisService: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 bg-inset border border-outline rounded-xl text-ink outline-none focus:border-teal-500 text-sm"
                      placeholder="150"
                    />
                    <p className="text-xs text-ink-ghost mt-1">Versés aux laveurs qui ont effectué le service</p>
                  </div>
                </div>

                {/* Durée */}
                <div>
                  <label className="block text-sm font-medium text-ink-light mb-1.5">Durée estimée (min)</label>
                  <input
                    type="number" min={0} step={5}
                    value={formData.dureeEstimee ?? ''}
                    onChange={(e) => setFormData({ ...formData, dureeEstimee: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 bg-inset border border-outline rounded-xl text-ink outline-none focus:border-teal-500 text-sm"
                    placeholder="45"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-divider">
                  <button type="button" onClick={closeModal} className="px-4 py-2 font-medium text-ink-light hover:text-ink transition-colors text-sm">
                    Annuler
                  </button>
                  <button
                    type="submit" disabled={isPending}
                    className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-colors disabled:opacity-70 flex items-center gap-2 text-sm"
                  >
                    {isPending ? 'Enregistrement...' : editingExtra ? 'Mettre à jour' : 'Créer le service'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ──────────────────────── */}
      <AnimatePresence>
        {confirmDeleteId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteId(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-panel border border-edge rounded-2xl shadow-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-ink">Supprimer le service</h3>
                  <p className="text-sm text-ink-muted">Cette action est irréversible.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2 font-medium text-ink-light hover:text-ink transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={deleteExtra.isPending}
                  className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-70 text-sm"
                >
                  {deleteExtra.isPending ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
