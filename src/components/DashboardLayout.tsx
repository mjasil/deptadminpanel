import { useState, ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { Package, ShoppingCart, LogOut, Menu, X, Zap } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage: 'products' | 'orders';
  onNavigate: (page: 'products' | 'orders') => void;
}

const DashboardLayout = ({ children, currentPage, onNavigate }: DashboardLayoutProps) => {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menuItems = [
    { id: 'products' as const, label: 'Products', icon: Package },
    { id: 'orders' as const, label: 'Orders', icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex h-screen overflow-hidden">
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:relative lg:translate-x-0 z-30 flex flex-col w-64 bg-gray-800 border-r border-gray-700 transition-transform duration-300 ease-in-out h-full`}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-left text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-gray-800 border-b border-gray-700 px-4 lg:px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-300 hover:text-white mr-4"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-semibold text-white capitalize">
                {currentPage}
              </h2>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-gray-900 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
