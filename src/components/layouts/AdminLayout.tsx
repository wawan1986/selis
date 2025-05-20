
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePwa } from '@/context/PwaContext';
import { Button } from '@/components/ui/button';
import {
  CircleUser,
  LogOut,
  BarChart,
  Store,
  Users,
  Settings,
  LayoutGrid,
  Package,
  Layers,
  Home,
  Menu,
  X,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const { networkStatus } = usePwa();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigationLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { path: '/admin/brand', label: 'Brand', icon: <Settings size={20} /> },
    { path: '/admin/branches', label: 'Branches', icon: <LayoutGrid size={20} /> },
    { path: '/admin/stores', label: 'Stores', icon: <Store size={20} /> },
    { path: '/admin/categories', label: 'Categories', icon: <Layers size={20} /> },
    { path: '/admin/menu', label: 'Menu Items', icon: <Package size={20} /> },
    { path: '/admin/stock', label: 'Stock Items', icon: <Package size={20} /> },
    { path: '/admin/users', label: 'Users', icon: <Users size={20} /> },
    { path: '/admin/reports', label: 'Reports', icon: <BarChart size={20} /> },
  ];

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Top navigation bar */}
      <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={toggleMobileSidebar}
                className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary md:hidden"
              >
                {isMobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              {networkStatus === 'offline' && (
                <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                  Offline Mode
                </div>
              )}
              <div className="flex items-center space-x-2">
                <CircleUser className="h-8 w-8 text-gray-400" />
                <span className="hidden md:block font-medium text-gray-700 dark:text-gray-200">
                  {user?.name}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for desktop */}
        <aside className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700">
            <div className="h-0 flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="px-4 mb-6">
                <h2 className="text-xl font-bold text-primary">POS Admin</h2>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigationLinks.map((link) => (
                  <a
                    key={link.path}
                    href={link.path}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(link.path);
                    }}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
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
          </div>
        </aside>

        {/* Mobile sidebar */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleMobileSidebar}></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  onClick={toggleMobileSidebar}
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="px-4 mb-6">
                  <h2 className="text-xl font-bold text-primary">POS Admin</h2>
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  {navigationLinks.map((link) => (
                    <a
                      key={link.path}
                      href={link.path}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(link.path);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
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
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 md:p-6 bg-gray-100 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
