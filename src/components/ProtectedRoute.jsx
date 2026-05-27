import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-nb-blue">
        <div className="flex flex-col items-center gap-3 text-white/70">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="font-mono text-sm">Memuatkan...</span>
        </div>
      </div>
    )
  }

  return user ? children : <Navigate to="/auth" replace />
}
