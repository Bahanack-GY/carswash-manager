import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplets, Plus, Search, Clock, Banknote, Sparkles, Zap, X, Pencil, LayoutList, LayoutGrid, Trash2 } from '@/lib/icons'
import { useWashTypes, useCreateWashType, useUpdateWashType, useDeleteWashType } from '@/api/wash-types'
import type { WashType, CreateWashTypeDto, UpdateWashTypeDto } from '@/api/wash-types/types'
import { useAuth } from '@/contexts/AuthContext'

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const rise = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

const tierIcons: Record<string, React.ElementType> = {
  Express: Zap,
  Simple: Droplets,
  Complet: Sparkles,
  Premium: Sparkles,
}

const tierAccents: Record<string, string> = {
  Express: 'from-amber-500 to-orange-500',
  Simple: 'from-sky-500 to-blue-500',
  Complet: 'from-teal-500 to-emerald-500',
  Premium: 'from-purple-500 to-fuchsia-500',
}

const defaultGradient = 'from-teal-500 to-teal-600'

function formatPrice(price: number | string | null | undefined) {
  if (price == null) return '—'
  return new Intl.NumberFormat('fr-FR').format(Number(price))
}

function formatDuration(minutes: number | string | null | undefined) {
  const m = Number(minutes)
  if (!m) return '—'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h}h ${rem}min` : `${h}h`
}

const emptyForm: CreateWashTypeDto = { nom: '', particularites: '', prixBase: 0, prixCatB: null, fraisService: null, dureeEstimee: 0, statut: 'active' }

export default function TypesLavage() {
  const { selectedStationId } = useAuth()
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'table' | 'grid'>('table')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingType, setEditingType] = useState<WashType | null>(null)
  const [formData, setFormData] = useState<CreateWashTypeDto>(emptyForm)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const { data: washTypesData, isLoading, isError } = useWashTypes(selectedStationId ? { stationId: selectedStationId } : undefined)
  const createWashType = useCreateWashType()
  const updateWashType = useUpdateWashType()
  const deleteWashType = useDeleteWashType()

  const washTypes: WashType[] = Array.isArray(washTypesData)
    ? washTypesData
    : (washTypesData as any)?.data || []

  const filtered = washTypes.filter((wt) =>
    wt.nom.toLowerCase().includes(search.toLowerCase()) ||
    (wt.particularites || '').toLowerCase().includes(search.toLowerCase())
  )

  const avgPrice = washTypes.length > 0
    ? Math.round(washTypes.reduce((s, wt) => s + Number(wt.prixBase), 0) / washTypes.length)
    : 0

  const maxPrice = washTypes.length > 0
    ? Math.max(...washTypes.map(wt => Number(wt.prixBase)))
    : 0

  const avgDuration = washTypes.length > 0
    ? Math.round(washTypes.reduce((s, wt) => s + (Number(wt.dureeEstimee) || 0), 0) / washTypes.length)
    : 0

  const summaryStats = [
    { label: 'Types de lavage', value: washTypes.length.toString(), icon: Droplets, accent: 'bg-teal-500/10 text-accent' },
    { label: 'Prix moyen', value: `${formatPrice(avgPrice)} F`, icon: Banknote, accent: 'bg-emerald-500/10 text-ok' },
    { label: 'Prix le plus haut', value: `${formatPrice(maxPrice)} F`, icon: Sparkles, accent: 'bg-purple-500/10 text-grape' },
    { label: 'Durée moyenne', value: formatDuration(avgDuration), icon: Clock, accent: 'bg-amber-500/10 text-warn' },
  ]

  const openCreate = () => {
    setEditingType(null)
    setFormData(emptyForm)
    setIsModalOpen(true)
  }

  const openEdit = (wt: WashType) => {
    setEditingType(wt)
    setFormData({
      nom: wt.nom,
      particularites: wt.particularites || '',
      prixBase: Number(wt.prixBase),
      prixCatB: wt.prixCatB != null ? Number(wt.prixCatB) : null,
      fraisService: wt.fraisService != null ? Number(wt.fraisService) : null,
      dureeEstimee: Number(wt.dureeEstimee) || 0,
      statut: wt.statut,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingType(null)
    setFormData(emptyForm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingType) {
        const changes: UpdateWashTypeDto = { ...formData }
        await updateWashType.mutateAsync({ id: editingType.id, data: changes })
      } else {
        await createWashType.mutateAsync({ ...formData, stationId: selectedStationId || undefined })
      }
      closeModal()
    } catch (error) {
      console.error('Failed to save wash type', error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteWashType.mutateAsync(id)
    } catch (err) {
      console.error('Failed to delete wash type', err)
    } finally {
      setConfirmDeleteId(null)
    }
  }

  const handleToggleStatut = async (wt: WashType) => {
    const newStatut = wt.statut === 'active' ? 'suspended' : 'active'
    try {
      await updateWashType.mutateAsync({ id: wt.id, data: { statut: newStatut } })
    } catch (err) {
      console.error('Failed to toggle statut', err)
    }
  }

  const isPending = createWashType.isPending || updateWashType.isPending
  const isSubmitError = createWashType.isError || updateWashType.isError

  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 relative">
        {/* Header */}
        <motion.div variants={rise} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-ink flex items-center gap-2">
              <Droplets className="w-6 h-6 text-accent" /> Types de Lavage
            </h1>
            <p className="text-ink-faded mt-1">Configurez les formules de lavage et tarifs</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-teal-600 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-teal-500/35 transition-shadow text-sm"
          >
            <Plus className="w-4 h-4" /> Nouveau type
          </button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {summaryStats.map((s) => (
            <motion.div key={s.label} variants={rise} className="bg-panel border border-edge rounded-2xl p-4 shadow-sm">
              <div className={`p-2 rounded-xl w-fit ${s.accent} mb-3`}><s.icon className="w-4 h-4" /></div>
              <p className="font-heading text-xl font-bold text-ink">{s.value}</p>
              <p className="text-xs text-ink-faded mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <motion.div variants={rise} className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-panel border border-edge rounded-xl px-4 py-2.5 flex-1 shadow-sm focus-within:border-teal-500/40 transition-colors">
            <Search className="w-4 h-4 text-ink-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou description..."
              className="bg-transparent text-sm text-ink placeholder-ink-muted outline-none flex-1"
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          </div>
        ) : isError ? (
          <div className="p-4 bg-red-500/10 text-red-500 rounded-xl">
            Erreur lors du chargement des types de lavage.
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-ink-muted p-12 border border-dashed border-divider rounded-xl">
            {search ? 'Aucun type de lavage ne correspond à la recherche.' : 'Aucun type de lavage configuré. Commencez par en créer un.'}
          </div>
        ) : view === 'table' ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-panel border border-edge rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-160">
                <thead>
                  <tr className="border-b border-divider bg-inset">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-faded uppercase tracking-wider">Formule</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-faded uppercase tracking-wider hidden md:table-cell">Description</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-ink-faded uppercase tracking-wider">Cat A</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-ink-faded uppercase tracking-wider hidden lg:table-cell">Cat B</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-ink-faded uppercase tracking-wider hidden sm:table-cell">Durée</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-ink-faded uppercase tracking-wider">Statut</th>
                    <th className="w-16 px-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {filtered.map((wt) => {
                    const gradient = tierAccents[wt.nom] || defaultGradient
                    const TierIcon = tierIcons[wt.nom] || Droplets
                    const suspended = wt.statut === 'suspended'
                    return (
                      <tr key={wt.id} className={`hover:bg-raised transition-colors group ${suspended ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-linear-to-br ${gradient} flex items-center justify-center text-white shrink-0`}>
                              <TierIcon className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-ink">{wt.nom}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-muted hidden md:table-cell max-w-xs">
                          <span className="line-clamp-1">{wt.particularites || <span className="text-ink-ghost">—</span>}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-ok tabular-nums">{formatPrice(wt.prixBase)}</span>
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          {wt.prixCatB != null ? (
                            <span className="font-semibold text-ink tabular-nums">{formatPrice(wt.prixCatB)}</span>
                          ) : (
                            <span className="text-ink-ghost text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                            <Clock className="w-3.5 h-3.5" /> {formatDuration(wt.dureeEstimee)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleStatut(wt)}
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
                              onClick={() => openEdit(wt)}
                              className="p-1.5 rounded-lg text-ink-ghost hover:text-accent hover:bg-accent-wash transition-colors"
                              title="Modifier"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(wt.id)}
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
            {filtered.map((wt) => {
              const gradient = tierAccents[wt.nom] || defaultGradient
              const TierIcon = tierIcons[wt.nom] || Droplets
              const suspended = wt.statut === 'suspended'

              return (
                <motion.div
                  key={wt.id}
                  variants={rise}
                  className={`bg-panel border border-edge rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group ${suspended ? 'opacity-60' : ''}`}
                >
                  <div className={`h-1.5 bg-linear-to-r ${gradient}`} />

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center text-white shadow-sm`}>
                          <TierIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-heading font-semibold text-ink">{wt.nom}</h3>
                          <button
                            onClick={() => handleToggleStatut(wt)}
                            className={`text-xs font-medium px-1.5 py-0.5 rounded-full transition-colors ${
                              suspended
                                ? 'bg-red-500/10 text-red-600'
                                : 'bg-emerald-500/10 text-emerald-600'
                            }`}
                          >
                            {suspended ? 'Suspendu' : 'Actif'}
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(wt)}
                          className="p-1.5 rounded-lg text-ink-muted hover:text-accent hover:bg-accent-wash transition-colors opacity-0 group-hover:opacity-100"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(wt.id)}
                          className="p-1.5 rounded-lg text-ink-muted hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {wt.particularites && (
                      <p className="text-sm text-ink-light leading-relaxed mb-4 line-clamp-2">{wt.particularites}</p>
                    )}

                    <div className={`grid gap-3 pt-3 border-t border-divider ${wt.prixCatB != null ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      <div className="bg-inset rounded-xl p-3 text-center">
                        <p className="text-xs text-ink-muted mb-1">Cat A</p>
                        <p className="font-heading text-base font-bold text-ink tabular-nums">{formatPrice(wt.prixBase)}</p>
                        <p className="text-xs text-ink-ghost">FCFA</p>
                      </div>
                      {wt.prixCatB != null && (
                        <div className="bg-inset rounded-xl p-3 text-center">
                          <p className="text-xs text-ink-muted mb-1">Cat B</p>
                          <p className="font-heading text-base font-bold text-ink tabular-nums">{formatPrice(wt.prixCatB)}</p>
                          <p className="text-xs text-ink-ghost">FCFA</p>
                        </div>
                      )}
                      <div className="bg-inset rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Clock className="w-3.5 h-3.5 text-warn" />
                        </div>
                        <p className="font-heading text-base font-bold text-ink">{formatDuration(wt.dureeEstimee)}</p>
                        <p className="text-xs text-ink-ghost">Durée</p>
                      </div>
                    </div>
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                  <Droplets className="w-5 h-5 text-accent" />
                  {editingType ? 'Modifier le type' : 'Nouveau type de lavage'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-1 text-ink-muted hover:text-ink transition-colors rounded-lg hover:bg-raised"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                {isSubmitError && (
                  <div className="p-3 bg-red-500/10 text-red-500 rounded-xl text-sm border border-red-500/20">
                    Erreur lors de {editingType ? 'la modification' : 'la création'} du type de lavage.
                  </div>
                )}

                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-ink-light mb-1.5">Nom *</label>
                  <input
                    required
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 bg-inset border border-outline rounded-xl text-ink outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 text-sm"
                    placeholder="ex: LIS Classique, Complet, Premium..."
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-ink-light mb-1.5">Description / Particularités</label>
                  <textarea
                    rows={3}
                    value={formData.particularites || ''}
                    onChange={(e) => setFormData({ ...formData, particularites: e.target.value })}
                    className="w-full px-3 py-2 bg-inset border border-outline rounded-xl text-ink outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 resize-none text-sm"
                    placeholder="Décrivez les services inclus dans cette formule..."
                  />
                </div>

                {/* Prix Cat A / Cat B */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-light mb-1.5">Prix Cat A (FCFA) *</label>
                    <input
                      required
                      type="number"
                      min={0}
                      step={100}
                      value={formData.prixBase || ''}
                      onChange={(e) => setFormData({ ...formData, prixBase: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-inset border border-outline rounded-xl text-ink outline-none focus:border-teal-500 text-sm"
                      placeholder="3000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-light mb-1.5">Prix Cat B (FCFA)</label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={formData.prixCatB ?? ''}
                      onChange={(e) => setFormData({ ...formData, prixCatB: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 bg-inset border border-outline rounded-xl text-ink outline-none focus:border-teal-500 text-sm"
                      placeholder="5000"
                    />
                  </div>
                </div>

                {/* Frais laveur + Durée */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-light mb-1.5">Frais de service laveurs (FCFA)</label>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={formData.fraisService ?? ''}
                      onChange={(e) => setFormData({ ...formData, fraisService: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 bg-inset border border-outline rounded-xl text-ink outline-none focus:border-teal-500 text-sm"
                      placeholder="150"
                    />
                    <p className="text-xs text-ink-ghost mt-1">Versés aux laveurs par véhicule lavé</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-light mb-1.5">Durée estimée (min)</label>
                    <input
                      type="number"
                      min={0}
                      step={5}
                      value={formData.dureeEstimee || ''}
                      onChange={(e) => setFormData({ ...formData, dureeEstimee: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-inset border border-outline rounded-xl text-ink outline-none focus:border-teal-500 text-sm"
                      placeholder="45"
                    />
                  </div>
                </div>

                {/* Statut */}
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

                <div className="pt-4 flex justify-end gap-3 border-t border-divider mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 font-medium text-ink-light hover:text-ink transition-colors text-sm"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-colors disabled:opacity-70 flex items-center gap-2 text-sm"
                  >
                    {isPending ? 'Enregistrement...' : editingType ? 'Mettre à jour' : 'Créer le type'}
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
                  <h3 className="font-heading font-bold text-ink">Supprimer le type</h3>
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
                  disabled={deleteWashType.isPending}
                  className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-70 text-sm"
                >
                  {deleteWashType.isPending ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
