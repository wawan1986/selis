
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePwa } from '@/context/PwaContext';
import { Button } from '@/components/ui/button';
import { CircleUser, LogOut, ShoppingCart, BarChart, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface PosLayoutProps {
  children: React.ReactNode;
}

const PosLayout: React.FC<PosLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { networkStatus } = usePwa();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navigationLinks = user?.role === 'manager' 
    ? [
        { path: '/pos', label: 'POS', icon: <ShoppingCart size={20} /> },
        { path: '/manager/dashboard', label: 'Dashboard', icon: <BarChart size={20} /> },
        { path: '/manager/reports', label: 'Reports', icon: <BarChart size={20} /> },
        { path: '/manager/stock', label: 'Stock', icon: <BarChart size={20} /> },
        { path: '/manager/settings', label: 'Settings', icon: <BarChart size={20} /> },
        { path: '/pos/history', label: 'History', icon: <BarChart size={20} /> },
      ]
    : [
        { path: '/pos', label: 'POS', icon: <ShoppingCart size={20} /> },
        { path: '/pos/history', label: 'History', icon: <BarChart size={20} /> },
      ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile header */}
      <header className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-20">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="flex items-center space-x-1">
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
              {user?.storeName || 'POS System'}
            </h1>
            {networkStatus === 'offline' && (
              <div className="ml-2 px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                Offline
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            <span className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              {user?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={18} />
            </Button>
          </div>
        </div>
        
        {/* Navigation tabs for mobile */}
        <div className="px-2 py-1 bg-gray-50 dark:bg-gray-700 flex overflow-x-auto">
          {navigationLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => {
                navigate(link.path);
              }}
              className={`px-3 py-2 text-sm font-medium whitespace-nowrap ${
                location.pathname === link.path
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      </header>

      {/* Sidebar for mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-10 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleSidebar}></div>
          <div className="relative flex flex-col w-72 max-w-xs bg-white dark:bg-gray-800 h-full">
            <div className="flex items-center justify-between px-4 py-6">
              <div className="flex-shrink-0">
                <h2 className="text-xl font-bold text-primary">{user?.storeName || 'POS System'}</h2>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="px-4 py-2">
              <div className="flex items-center space-x-3 mb-6">
                <CircleUser className="h-10 w-10 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-800 dark:text-white">{user?.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{user?.role}</div>
                </div>
              </div>
              
              {user?.branchName && (
                <div className="px-3 py-2 mb-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Branch</div>
                  <div className="font-medium text-gray-800 dark:text-white">{user.branchName}</div>
                </div>
              )}
              
              <nav className="space-y-1 mt-6">
                {navigationLinks.map((link) => (
                  <a
                    key={link.path}
                    href={link.path}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(link.path);
                      setIsSidebarOpen(false);
                    }}
                    className={`flex items-center px-3 py-3 text-sm font-medium rounded-md ${
                      location.pathname === link.path
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="mr-3">{link.icon}</div>
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
            
            <div className="mt-auto p-4 border-t dark:border-gray-700">
              <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 relative">
        {children}
      </main>
    </div>
  );
};

export default PosLayout;
