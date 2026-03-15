import { RouterProvider } from 'react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthGate } from './components/AuthGate';
import { router } from './routes';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--nu-purple)]" />
      </div>
    );
  }

  if (!user) {
    return <AuthGate />;
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
