import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminLayout from '@/components/AdminLayout'

const Login = lazy(() => import('@/pages/Login'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Reservations = lazy(() => import('@/pages/Reservations'))
const FichesPiste = lazy(() => import('@/pages/FichesPiste'))
const Coupons = lazy(() => import('@/pages/Coupons'))
const CouponDetail = lazy(() => import('@/pages/CouponDetail'))
const Caisse = lazy(() => import('@/pages/Caisse'))
const Clients = lazy(() => import('@/pages/Clients'))
const ClientDetail = lazy(() => import('@/pages/ClientDetail'))
const Inventaire = lazy(() => import('@/pages/Inventaire'))
const InventaireDetail = lazy(() => import('@/pages/InventaireDetail'))
const Employes = lazy(() => import('@/pages/Employes'))
const EmployeDetail = lazy(() => import('@/pages/EmployeDetail'))
const Stations = lazy(() => import('@/pages/Stations'))
const TypesLavage = lazy(() => import('@/pages/TypesLavage'))
const ServicesSpeciaux = lazy(() => import('@/pages/ServicesSpeciaux'))
const Incidents = lazy(() => import('@/pages/Incidents'))
const NouveauLavage = lazy(() => import('@/pages/NouveauLavage'))
const SelectStation = lazy(() => import('@/pages/SelectStation'))
const GlobalDashboard = lazy(() => import('@/pages/GlobalDashboard'))
const MonEspace = lazy(() => import('@/pages/MonEspace'))
const Commercial = lazy(() => import('@/pages/Commercial'))
const CommercialAnalytics = lazy(() => import('@/pages/CommercialAnalytics'))
const Marketing = lazy(() => import('@/pages/Marketing'))
const AuditLogs = lazy(() => import('@/pages/AuditLogs'))
const BonsLavage = lazy(() => import('@/pages/BonsLavage'))
const Depenses = lazy(() => import('@/pages/Depenses'))
const AdminEmployees = lazy(() => import('@/pages/admin/AdminEmployees'))
const AdminClients = lazy(() => import('@/pages/admin/AdminClients'))
const AdminIncidents = lazy(() => import('@/pages/admin/AdminIncidents'))
const Classement = lazy(() => import('@/pages/Classement'))
const Unauthorized = lazy(() => import('@/pages/Unauthorized'))
const Settings = lazy(() => import('@/pages/Settings'))

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ className: 'text-sm font-medium' }} />
      <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />
        <Route path="/select-station" element={<SelectStation />} />
        <Route path="/global-dashboard" element={<AdminLayout />}>
          <Route index element={<GlobalDashboard />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="incidents" element={<AdminIncidents />} />
          <Route path="stations" element={<Stations />} />
          <Route path="audit" element={<AuditLogs />} />
        </Route>

        {/* Protected — inside Layout */}
        <Route element={<Layout />}>
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route path="/dashboard" element={
            <ProtectedRoute roles={['super_admin', 'manager', 'comptable']}>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/nouveau-lavage" element={
            <ProtectedRoute roles={['super_admin', 'manager', 'controleur']}>
              <NouveauLavage />
            </ProtectedRoute>
          } />

          <Route path="/reservations" element={
            <ProtectedRoute roles={['super_admin', 'manager', 'controleur', 'caissiere']}>
              <Reservations />
            </ProtectedRoute>
          } />

          <Route path="/fiches-piste" element={
            <ProtectedRoute roles={['super_admin', 'manager', 'controleur']}>
              <FichesPiste />
            </ProtectedRoute>
          } />

          <Route path="/coupons" element={
            <ProtectedRoute roles={['super_admin', 'manager', 'controleur', 'caissiere', 'comptable']}>
              <Coupons />
            </ProtectedRoute>
          } />

          <Route path="/coupons/:id" element={
            <ProtectedRoute roles={['super_admin', 'manager', 'controleur', 'caissiere', 'comptable']}>
              <CouponDetail />
            </ProtectedRoute>
          } />

          <Route path="/caisse" element={
            <ProtectedRoute roles={['super_admin', 'manager', 'caissiere', 'comptable']}>
              <Caisse />
            </ProtectedRoute>
          } />

          <Route path="/depenses" element={
            <ProtectedRoute roles={['super_admin', 'manager', 'caissiere', 'comptable']}>
              <Depenses />
            </ProtectedRoute>
          } />

          <Route path="/clients" element={
            <ProtectedRoute roles={['super_admin', 'manager', 'controleur', 'caissiere']}>
              <Clients />
            </ProtectedRoute>
          } />

          <Route path="/clients/:id" element={
            <ProtectedRoute roles={['super_admin', 'manager', 'controleur', 'caissiere']}>
              <ClientDetail />
            </ProtectedRoute>
          } />

          <Route path="/inventaire" element={
            <ProtectedRoute roles={['super_admin', 'manager']}>
              <Inventaire />
            </ProtectedRoute>
          } />

          <Route path="/inventaire/:id" element={
            <ProtectedRoute roles={['super_admin', 'manager']}>
              <InventaireDetail />
            </ProtectedRoute>
          } />

          <Route path="/employes" element={
            <ProtectedRoute roles={['super_admin', 'manager']}>
              <Employes />
            </ProtectedRoute>
          } />

          <Route path="/employes/:id" element={
            <ProtectedRoute roles={['super_admin', 'manager']}>
              <EmployeDetail />
            </ProtectedRoute>
          } />

          <Route path="/stations" element={
            <ProtectedRoute roles={['super_admin']}>
              <Stations />
            </ProtectedRoute>
          } />

          <Route path="/types-lavage" element={
            <ProtectedRoute roles={['super_admin', 'manager']}>
              <TypesLavage />
            </ProtectedRoute>
          } />

          <Route path="/services-speciaux" element={
            <ProtectedRoute roles={['super_admin', 'manager']}>
              <ServicesSpeciaux />
            </ProtectedRoute>
          } />

          <Route path="/incidents" element={
            <ProtectedRoute roles={['super_admin', 'manager']}>
              <Incidents />
            </ProtectedRoute>
          } />

          <Route path="/mon-espace" element={
            <ProtectedRoute roles={['laveur']}>
              <MonEspace />
            </ProtectedRoute>
          } />

          <Route path="/classement" element={
            <ProtectedRoute roles={['laveur', 'commercial', 'controleur', 'super_admin', 'manager']}>
              <Classement />
            </ProtectedRoute>
          } />

          <Route path="/espace-commercial" element={
            <ProtectedRoute roles={['commercial']}>
              <Commercial />
            </ProtectedRoute>
          } />

          <Route path="/commercial-analytics" element={
            <ProtectedRoute roles={['commercial']}>
              <CommercialAnalytics />
            </ProtectedRoute>
          } />

          <Route path="/marketing" element={
            <ProtectedRoute roles={['super_admin', 'manager']}>
              <Marketing />
            </ProtectedRoute>
          } />

          <Route path="/bons-lavage" element={
            <ProtectedRoute roles={['super_admin', 'manager']}>
              <BonsLavage />
            </ProtectedRoute>
          } />

          <Route path="/audit-logs" element={
            <ProtectedRoute roles={['super_admin']}>
              <AuditLogs />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </>
  )
}
