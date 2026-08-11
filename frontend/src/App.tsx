import { Routes, Route } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import UserLayout from './layouts/UserLayout'
import AdminLayout from './layouts/AdminLayout'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

import UserDashboard from './pages/user/UserDashboard'
import JoinQueue from './pages/user/JoinQueue'
import QueueStatus from './pages/user/QueueStatus'
import History from './pages/user/History'
import Notifications from './pages/user/Notifications'
import Profile from './pages/user/Profile'

import AdminDashboard from './pages/admin/AdminDashboard'
import ServiceManagement from './pages/admin/ServiceManagement'
import QueueManagement from './pages/admin/QueueManagement'
import Reports from './pages/admin/Reports'

function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<UserLayout />}>
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/join-queue" element={<JoinQueue />} />
        <Route path="/queue-status" element={<QueueStatus />} />
        <Route path="/history" element={<History />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/services" element={<ServiceManagement />} />
        <Route path="/admin/queue-management" element={<QueueManagement />} />
        <Route path="/admin/reports" element={<Reports />} />
      </Route>
    </Routes>
  )
}

export default App
