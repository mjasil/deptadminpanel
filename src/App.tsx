import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Products from './pages/Products';
import Orders from './pages/Orders';

function App() {
  const [currentPage, setCurrentPage] = useState<'products' | 'orders'>('products');

  return (
    <AuthProvider>
      <ProtectedRoute>
        <DashboardLayout currentPage={currentPage} onNavigate={setCurrentPage}>
          {currentPage === 'products' && <Products />}
          {currentPage === 'orders' && <Orders />}
        </DashboardLayout>
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
