import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import MainDashboard from './components/dashboard/MainDashboard'

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <MainDashboard />
      </ProtectedRoute>
    </AuthProvider>
  )
}

export default App
