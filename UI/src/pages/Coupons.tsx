import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Ticket, Search, Plus, User, Car, CheckCircle2, Clock, Loader2, Droplets, LayoutList, LayoutGrid, ChevronRight, ChevronLeft, CalendarDays, X } from '@/lib/icons'
import { useCoupons } from '@/api/coupons'
import type { Coupon } from '@/api/coupons/types'
import { useAuth } from '@/contexts/AuthContext'

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const rise = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

// Mapping API Statuses to UI Config
const statusCfg: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: 'En attente', cls: 'bg-warn-wash text-warn border-warn-line', icon: Clock },
  washing: { label: 'Lavage en cours', cls: 'bg-info-wash text-info border-info-line', icon: Loader2 },
  done: { label: 'Terminé', cls: 'bg-ok-wash text-ok border-ok-line', icon: CheckCircle2 },
}

const TAB_STATUS_MAP: Record<string, string | null> = {
  'Tous': null,
  'En attente': 'pending',
  'En cours': 'washing',
  'Terminés': 'done',
}

const tabs = Object.keys(TAB_STATUS_MAP)

const emptyMessages: Record<string, string> = {
  'Tous': 'Aucun coupon trouvé.',
  'En attente': 'Aucun coupon en attente.',
  'En cours': 'Aucun lavage en cours.',
  'Terminés': 'Aucun coupon terminé.',
}

export default function Coupons() {
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'table' | 'grid'>('table')
  const [activeTab, setActiveTab] = useState('Tous')
  const [page, setPage] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const LIMIT = 20
  const navigate = useNavigate()

  const { selectedStationId } = useAuth()

  // Reset page when tab, search or dates change
  useEffect(() => { setPage(1) }, [activeTab, search, startDate, endDate])

  // Build filters: pass statut to API when a specific tab is selected
  const activeStatut = TAB_STATUS_MAP[activeTab] as string | null
  const queryFilters = {
    ...(selectedStationId ? { stationId: selectedStationId } : {}),
    ...(activeStatut ? { statut: activeStatut as 'pending' | 'washing' | 'done' | 'paid' } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    page,
    limit: LIMIT,
  }

  // Queries & Mutations
  const { data: couponsData, isLoading, isError } = useCoupons(queryFilters)
  const couponsList: Coupon[] = couponsData?.data || []
  const total = Number(couponsData?.total ?? 0)
  const totalPages = total > 0 ? Math.ceil(total / LIMIT) : 1

  // Tab counts: show total from API for the active tab, nothing for others
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const tab of tabs) {
      counts[tab] = tab === activeTab ? total : 0
    }
    return counts
  }, [activeTab, total])

  // Search filtering within the current page
  const filtered = couponsList.filter((c) => {
    const q = search.toLowerCase()
    return (
      !q ||
      (c.numero || '').toLowerCase().includes(q) ||
      (c.fichePiste?.client?.nom || '').toLowerCase().includes(q) ||
      (c.fichePiste?.vehicle?.immatriculation || '').toLowerCase().includes(q)
    )
  })

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 relative">
      <motion.div variants={rise} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink flex items-center gap-2"><Ticket className="w-6 h-6 text-accent" /> Coupons</h1>
          <p className="text-ink-faded mt-1">Suivi des coupons de lavage et affectation des laveurs</p>
        </div>
        <button
          onClick={() => navigate('/nouveau-lavage')}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-teal-500/35 transition-shadow text-sm"
        >
          <Plus className="w-4 h-4" /> Nouveau Lavage
        </button>
      </motion.div>

      <motion.div variants={rise} className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-2 bg-panel border border-edge rounded-xl px-4 py-2.5 flex-1 shadow-sm focus-within:border-teal-500/40 transition-colors">
            <Search className="w-4 h-4 text-ink-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par numéro, client ou immatriculation..."
              className="bg-transparent text-sm text-ink placeholder-ink-muted outline-none flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-panel border border-edge rounded-xl px-3 py-2.5 shadow-sm focus-within:border-teal-500/40 transition-colors">
              <CalendarDays className="w-4 h-4 text-ink-muted shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm text-ink outline-none w-36"
                title="Date début"
              />
            </div>
            <span className="text-ink-muted text-sm">—</span>
            <div className="flex items-center gap-2 bg-panel border border-edge rounded-xl px-3 py-2.5 shadow-sm focus-within:border-teal-500/40 transition-colors">
              <CalendarDays className="w-4 h-4 text-ink-muted shrink-0" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm text-ink outline-none w-36"
                title="Date fin"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate('') }}
                className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-raised transition-colors"
                title="Effacer les dates"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
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
          <div className="flex bg-raised border border-edge rounded-xl p-1 shrink-0">
            {tabs.map((t) => {
              const count = tabCounts[t] ?? 0
              return (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    activeTab === t ? 'bg-panel text-accent shadow-sm' : 'text-ink-faded hover:text-ink-light'
                  }`}
                >
                  {t}
                  {activeTab === t && (
                    <span className="text-[10px] min-w-[18px] text-center px-1 py-0.5 rounded-md bg-accent-wash text-accent">
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      ) : isError ? (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl">
          Erreur lors du chargement des coupons.
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-ink-muted p-12 border border-dashed border-divider rounded-xl">
          {emptyMessages[activeTab] || 'Aucun coupon trouvé.'}
        </div>
      ) : view === 'table' ? (
        <motion.div
          key={`table-${activeTab}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-panel border border-edge rounded-2xl shadow-sm overflow-hidden"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-divider bg-inset">
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-faded uppercase tracking-wider">Numéro</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-faded uppercase tracking-wider hidden sm:table-cell">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-faded uppercase tracking-wider hidden md:table-cell">Véhicule</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-faded uppercase tracking-wider hidden lg:table-cell">Formule</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-ink-faded uppercase tracking-wider hidden sm:table-cell">Montant</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-ink-faded uppercase tracking-wider">Statut</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {filtered.map((c) => {
                const st = statusCfg[c.statut] || { label: c.statut, cls: 'bg-raised text-ink-muted border-edge', icon: Clock }
                const StIcon = st.icon
                const displayDate = new Date(c.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                const displayTime = new Date(c.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                const clientName = c.fichePiste?.client?.nom || 'Client inconnu'
                const vehiclePlate = c.fichePiste?.vehicle?.immatriculation || '—'
                const vehicleModel = c.fichePiste?.vehicle?.modele || ''
                const washType = c.fichePiste?.typeLavage?.nom || 'Lavage'
                const montant = Number(c.montantTotal) || 0

                return (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/coupons/${c.id}`)}
                    className="hover:bg-raised transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-mono font-bold text-accent">{c.numero}</span>
                        <p className="text-[10px] text-ink-ghost mt-0.5">{displayDate} {displayTime}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-medium text-ink text-xs">{clientName}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-ink-muted">{vehiclePlate}{vehicleModel ? ` · ${vehicleModel}` : ''}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                        <Droplets className="w-3 h-3 text-accent" /> {washType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <span className="text-xs font-semibold text-accent">{montant.toLocaleString()} F</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${st.cls}`}>
                        <StIcon className={`w-3 h-3 ${c.statut === 'washing' ? 'animate-spin' : ''}`} />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <ChevronRight className="w-4 h-4 text-ink-ghost group-hover:text-accent transition-colors" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </motion.div>
      ) : (
        <motion.div
          key={`grid-${activeTab}`}
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filtered.map((c) => {
            const st = statusCfg[c.statut] || { label: c.statut, cls: 'bg-raised text-ink-muted border-edge', icon: Clock }
            const StIcon = st.icon
            const displayTime = new Date(c.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            const displayDate = new Date(c.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })

            const clientName = c.fichePiste?.client?.nom || 'Client inconnu'
            const vehiclePlate = c.fichePiste?.vehicle?.immatriculation || '—'
            const vehicleModel = c.fichePiste?.vehicle?.modele || ''
            const washType = c.fichePiste?.typeLavage?.nom || 'Lavage'
            const montant = Number(c.montantTotal) || 0

            return (
              <motion.div key={c.id} variants={rise} onClick={() => navigate(`/coupons/${c.id}`)} className="bg-panel border border-edge rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer">
                <div className="px-5 pt-5 pb-3 border-b border-dashed border-edge">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-bold text-accent">{c.numero}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${st.cls}`}>
                      <StIcon className={`w-3 h-3 ${c.statut === 'washing' ? 'animate-spin' : ''}`} />
                      {st.label}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1">{displayDate} — {displayTime}</p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-3.5 h-3.5 text-ink-muted" />
                    <span className="text-ink font-medium">{clientName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="w-3.5 h-3.5 text-ink-muted" />
                    <span className="text-ink-light">{vehiclePlate}{vehicleModel ? ` — ${vehicleModel}` : ''}</span>
                  </div>
                  <div className="bg-inset rounded-xl px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-3.5 h-3.5 text-accent" />
                      <span className="text-sm text-ink font-medium">{washType}</span>
                    </div>
                    <span className="text-sm font-semibold text-accent">{montant.toLocaleString()} F</span>
                  </div>
                  <div>
                    <p className="text-xs text-ink-faded mb-1.5">Laveurs assignés</p>
                    <div className="flex flex-wrap gap-2">
                      {c.washers && c.washers.length > 0 ? c.washers.map((w) => (
                        <div key={w.id} className="flex items-center gap-1.5 bg-accent-wash text-accent-bold px-2.5 py-1 rounded-lg text-xs font-medium border border-accent-line">
                          <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-bold text-accent-bold">
                            {w.prenom?.[0] || w.nom[0]}
                          </div>
                          {w.prenom} {w.nom}
                        </div>
                      )) : (
                        <span className="text-xs text-ink-muted">Aucun laveur assigné</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Pagination Controls */}
      {!isLoading && !isError && (couponsList.length === LIMIT || page > 1) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex items-center justify-between pt-2">
          <p className="text-xs text-ink-muted">
            Page {page} sur {totalPages} — {total} coupon{total !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-raised disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-medium px-2"
            >
              «
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-raised disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis')
                acc.push(p)
                return acc
              }, [])
              .map((p, idx) =>
                p === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-ink-muted text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === p
                        ? 'bg-teal-500 text-white shadow-sm'
                        : 'text-ink-muted hover:text-ink hover:bg-raised'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-raised disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-raised disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-medium px-2"
            >
              »
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
