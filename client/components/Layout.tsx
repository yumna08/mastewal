
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';
import { useCartStore } from '../store/useCartStore';
import { LayoutDashboard, LogOut, MoonStar, ShoppingBag, SunMedium, User as UserIcon } from 'lucide-react';
import CartDrawer from './CartDrawer';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, logout, isLoading } = useAuthStore();
  const hydrateCart = useCartStore((state) => state.hydrateCart);
  const cartCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));
  const [cartOpen, setCartOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return (window.localStorage.getItem('mastewal_theme') as 'light' | 'dark' | null) || 'light';
  });

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('mastewal_theme', theme);
  }, [theme]);

  React.useEffect(() => {
    const storedTheme = window.localStorage.getItem('mastewal_theme') as 'light' | 'dark' | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
    hydrateCart();
  }, [hydrateCart]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated && !isLoading && !['/login', '/signup'].includes(location.pathname)) {
    return <>{children}</>;
  }

  const isAdmin = user?.role === 'admin';
  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Books', to: '/' }
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-serif transition-colors duration-300 dark:bg-stone-950 dark:text-stone-100">
      {isAuthenticated && !isLoading && (
        <nav className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/85 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex min-h-16 items-center justify-between gap-4 py-2">
              <div className="flex items-center gap-3">
                <Link to="/" className="group flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-stone-900 via-stone-700 to-stone-500 text-xs font-bold tracking-[0.2em] text-stone-100 shadow-md transition-transform duration-300 group-hover:-translate-y-0.5 dark:from-stone-100 dark:via-stone-300 dark:to-stone-500 dark:text-stone-900">
                    MS
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-stone-500 dark:text-stone-400">Bookstore</p>
                    <p className="text-lg font-semibold leading-none tracking-tight">mastewal</p>
                  </div>
                </Link>
              </div>

              <div className="hidden items-center rounded-full border border-stone-200 bg-stone-100/70 p-1 sm:flex dark:border-stone-800 dark:bg-stone-900/60">
                {navLinks.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-all ${location.pathname === item.to ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-800 dark:text-stone-50' : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'}`}
                  >
                    {item.label}
                  </Link>
                ))}
                
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className={`ml-1 flex items-center gap-1 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all ${location.pathname === '/admin' ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-800 dark:text-stone-50' : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'}`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                  title="Toggle dark mode"
                >
                  {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                  <span className="hidden md:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>

                <button onClick={() => setCartOpen(true)} className="relative rounded-full border border-stone-200 bg-stone-50 p-2 transition hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-900 dark:hover:bg-stone-800">
                  <ShoppingBag className="h-5 w-5 text-stone-500 dark:text-stone-400" />
                  {cartCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-stone-950">
                      {cartCount}
                    </span>
                  )}
                </button>
                
                <div className="mx-1 h-6 w-px bg-stone-200 dark:bg-stone-800" />

                <div className="hidden items-center gap-2 text-stone-500 md:flex">
                  <UserIcon className="w-4 h-4" />
                  <span className="text-xs font-sans font-medium hidden md:block">{user?.name}</span>
                </div>

                <button 
                  onClick={handleLogout}
                  className="rounded-full p-2 text-stone-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
        {children}
      </main>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};

export default Layout;
