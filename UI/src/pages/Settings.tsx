import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, Phone, Mail, Eye, EyeOff, Save, Check, AlertCircle, Loader2 } from '@/lib/icons'
import { useAuth } from '@/contexts/AuthContext'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'

const NAVY = '#283852'
const TEAL = '#33cbcc'
const WASH = '#e3f6f6'

const stagger = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const rise = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  icon: Icon,
  disabled,
  rightElement,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  icon: React.ElementType
  disabled?: boolean
  rightElement?: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-muted font-body mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <Icon className="w-4 h-4 text-ink-faded" />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-edge bg-panel text-ink text-sm font-body
                     focus:outline-none focus:ring-2 focus:border-transparent transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-ink-faded"
          style={{ '--tw-ring-color': TEAL } as any}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  icon: React.ElementType
}) {
  const [show, setShow] = useState(false)
  return (
    <Field
      label={label}
      value={value}
      onChange={onChange}
      type={show ? 'text' : 'password'}
      placeholder={placeholder}
      icon={Icon}
      rightElement={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="text-ink-faded hover:text-ink transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      }
    />
  )
}

export default function SettingsPage() {
  const { user, login } = useAuth()

  // ── Profile form ──────────────────────────────────────────────────
  const [email, setEmail]     = useState(user?.email ?? '')
  const [phone, setPhone]     = useState(user?.telephone ?? '')
  const [profileDone, setProfileDone] = useState(false)

  // ── Password form ─────────────────────────────────────────────────
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd]         = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdDone, setPwdDone]       = useState(false)
  const [pwdMatchError, setPwdMatchError] = useState(false)

  const initials = user ? `${user.prenom[0]}${user.nom[0]}`.toUpperCase() : '?'

  // ── Mutation: update profile (email + phone) ───────────────────────
  const profileMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch('/users/me', { email, telephone: phone })
      return res.data
    },
    onSuccess: (data) => {
      // Refresh stored user
      const stored = localStorage.getItem('token') ?? ''
      const refresh = localStorage.getItem('refresh_token') ?? ''
      login(stored, refresh, { ...user!, email: data.email, telephone: data.telephone })
      setProfileDone(true)
      setTimeout(() => setProfileDone(false), 3000)
    },
  })

  // ── Mutation: change password ──────────────────────────────────────
  const passwordMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/users/me', {
        currentPassword: currentPwd,
        newPassword: newPwd,
      })
    },
    onSuccess: () => {
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
      setPwdDone(true)
      setTimeout(() => setPwdDone(false), 3000)
    },
  })

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setProfileDone(false)
    profileMutation.reset()
    profileMutation.mutate()
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPwdDone(false)
    passwordMutation.reset()
    if (newPwd !== confirmPwd) {
      setPwdMatchError(true)
      return
    }
    setPwdMatchError(false)
    passwordMutation.mutate()
  }

  const profileDirty = email !== (user?.email ?? '') || phone !== (user?.telephone ?? '')

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 max-w-2xl mx-auto">

      {/* ── Header ───────────────────────────────────── */}
      <motion.div
        variants={rise}
        className="relative overflow-hidden rounded-2xl"
        style={{ background: NAVY }}
      >
        <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-[0.06]" style={{ background: TEAL }} />
        <div className="relative z-10 p-6 sm:p-8 flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 font-heading"
            style={{ background: 'rgba(51,203,204,0.15)', border: '2px solid rgba(51,203,204,0.3)', color: TEAL }}
          >
            {initials}
          </div>
          <div>
            <p className="text-[10px] font-medium tracking-[0.15em] uppercase font-body mb-1" style={{ color: TEAL }}>
              Paramètres
            </p>
            <h2 className="font-heading font-bold text-white text-xl leading-tight" style={{ letterSpacing: '-0.01em' }}>
              {user?.prenom} {user?.nom}
            </h2>
            <p className="text-xs font-body mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Gérez vos informations personnelles et votre mot de passe
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Profile section ──────────────────────────── */}
      <motion.div variants={rise} className="bg-panel border border-edge rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-edge flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: WASH }}>
            <User className="w-4 h-4" style={{ color: TEAL }} />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-ink text-sm">Informations personnelles</h3>
            <p className="text-xs text-ink-muted font-body">Modifiez votre email et numéro de téléphone</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="votre@email.com"
              icon={Mail}
            />
            <Field
              label="Téléphone"
              value={phone}
              onChange={setPhone}
              type="tel"
              placeholder="+237 6XX XXX XXX"
              icon={Phone}
            />
          </div>

          {/* Error */}
          {profileMutation.isError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 font-body">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{(profileMutation.error as any)?.response?.data?.message ?? 'Une erreur est survenue'}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            {profileDone && (
              <span className="flex items-center gap-1.5 text-sm font-body" style={{ color: '#0f7a4a' }}>
                <Check className="w-4 h-4" />
                Enregistré
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={profileMutation.isPending || !profileDirty}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-body transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: TEAL, color: NAVY }}
              >
                {profileMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Enregistrer
              </button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* ── Password section ─────────────────────────── */}
      <motion.div variants={rise} className="bg-panel border border-edge rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-edge flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: '#f5ecff' }}>
            <Lock className="w-4 h-4" style={{ color: '#7020b8' }} />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-ink text-sm">Mot de passe</h3>
            <p className="text-xs text-ink-muted font-body">Choisissez un nouveau mot de passe sécurisé</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
          <PasswordField
            label="Mot de passe actuel"
            value={currentPwd}
            onChange={setCurrentPwd}
            placeholder="••••••••"
            icon={Lock}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PasswordField
              label="Nouveau mot de passe"
              value={newPwd}
              onChange={(v) => { setNewPwd(v); setPwdMatchError(false) }}
              placeholder="••••••••"
              icon={Lock}
            />
            <PasswordField
              label="Confirmer le mot de passe"
              value={confirmPwd}
              onChange={(v) => { setConfirmPwd(v); setPwdMatchError(false) }}
              placeholder="••••••••"
              icon={Lock}
            />
          </div>

          {/* Match error */}
          {pwdMatchError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 font-body">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Les mots de passe ne correspondent pas</span>
            </div>
          )}

          {/* API error */}
          {passwordMutation.isError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 font-body">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{(passwordMutation.error as any)?.response?.data?.message ?? 'Une erreur est survenue'}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            {pwdDone && (
              <span className="flex items-center gap-1.5 text-sm font-body" style={{ color: '#0f7a4a' }}>
                <Check className="w-4 h-4" />
                Mot de passe mis à jour
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={passwordMutation.isPending || !currentPwd || !newPwd || !confirmPwd}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-body transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: '#7020b8', color: '#fff' }}
              >
                {passwordMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Changer le mot de passe
              </button>
            </div>
          </div>
        </form>
      </motion.div>

    </motion.div>
  )
}
