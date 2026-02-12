
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';
import { Book, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, logout, isLoading } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated && !isLoading && !['/login', '/signup'].includes(location.pathname)) {
    return <>{children}</>;
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-serif">
      {isAuthenticated && !isLoading && (
        <nav className="bg-white border-b border-stone-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <Link to="/" className="flex items-center gap-2">
                  <div className="bg-stone-800 p-2 rounded">
                    <Book className="text-stone-100 w-5 h-5" />
                  </div>
                  <span className="font-bold text-xl tracking-tight hidden sm:block">mastewal</span>
                </Link>
              </div>

              <div className="flex items-center gap-4 sm:gap-6">
                <Link 
                  to="/" 
                  className={`text-sm font-medium transition-colors hover:text-stone-600 ${location.pathname === '/' ? 'text-stone-900 underline underline-offset-4' : 'text-stone-500'}`}
                >
                  Shop
                </Link>
                
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-stone-600 ${location.pathname === '/admin' ? 'text-stone-900 underline underline-offset-4' : 'text-stone-500'}`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                
                <div className="h-6 w-px bg-stone-200 mx-2" />

                <div className="flex items-center gap-2 text-stone-500">
                  <UserIcon className="w-4 h-4" />
                  <span className="text-xs font-sans font-medium hidden md:block">{user?.name}</span>
                </div>

                <button 
                  onClick={handleLogout}
                  className="p-2 text-stone-500 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
