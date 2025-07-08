/**
 * Protected Route Component
 * 
 * Wraps components that require authentication
 */

import { useAuth } from '../../contexts/AuthContext'
import LoginForm from './LoginForm'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login form if user is not authenticated
  if (!user) {
    return <LoginForm />
  }

  // Render protected content if user is authenticated
  return children
}