import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AuthPage      from './pages/AuthPage'
import Dashboard     from './pages/Dashboard'
import AddExpense    from './pages/AddExpense'
import EditExpense   from './pages/EditExpense'
import MonthlyPage   from './pages/MonthlyPage'
import TagPage       from './pages/TagPage'
import HutangPage    from './pages/HutangPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/add" element={
            <ProtectedRoute><AddExpense /></ProtectedRoute>
          } />
          <Route path="/edit/:id" element={
            <ProtectedRoute><EditExpense /></ProtectedRoute>
          } />
          <Route path="/monthly" element={
            <ProtectedRoute><MonthlyPage /></ProtectedRoute>
          } />
          <Route path="/hutang" element={
            <ProtectedRoute><HutangPage /></ProtectedRoute>
          } />
          <Route path="/tag/:tag" element={
            <ProtectedRoute><TagPage /></ProtectedRoute>
          } />

          {/* Default */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
