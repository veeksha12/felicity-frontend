import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Calendar, LayoutDashboard, Users } from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    closeMobileMenu();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/events', label: 'Events' },
  ];

  const userMenuItems = [];
  if (user) {
    if (user.role === 'Organizer') {
      userMenuItems.push({
        label: 'Organizer Dashboard',
        path: '/organizer',
        icon: LayoutDashboard,
      });
    } else if (user.role === 'Admin') {
      userMenuItems.push({
        label: 'Admin Dashboard',
        path: '/admin',
        icon: LayoutDashboard,
      });
    } else if (user.role === 'Participant') {
      userMenuItems.push({
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
      });
      userMenuItems.push({
        label: 'My Events',
        path: '/my-events',
        icon: Calendar,
      });
      userMenuItems.push({
        label: 'My Teams',
        path: '/my-teams',
        icon: Users,
      });
      userMenuItems.push({
        label: 'Clubs',
        path: '/clubs',
        icon: Users,
      });
    }

    userMenuItems.push({
      label: 'Profile',
      path: '/profile',
      icon: User,
    });
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-black/95 backdrop-blur-lg border-b border-disco-pink/20 shadow-disco'
          : 'bg-transparent'
          }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link
              to="/"
              className="flex items-center space-x-3 group"
              onClick={closeMobileMenu}
            >
              <div className="relative">
                <img
                  src="/public/logo.png"
                  alt="Felicity Logo"
                  className="w-12 h-12 object-contain transform group-hover:scale-110 transition-transform duration-300"
                />

                <div className="absolute inset-0 rounded-full bg-gradient-disco opacity-50 blur-lg group-hover:opacity-75 transition-opacity" />
              </div>
              <div className="hidden xs:block">
                <span className="text-xl sm:text-2xl font-display tracking-wider text-gradient">
                  FELICITY
                </span>
                <div className="text-[10px] sm:text-xs text-gray-400 -mt-1 uppercase tracking-tighter">IIIT HYDERABAD</div>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative text-sm font-medium tracking-wide transition-colors duration-300 ${isActive(link.path)
                    ? 'text-disco-pink'
                    : 'text-gray-300 hover:text-white'
                    }`}
                >
                  {link.label}
                  {isActive(link.path) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-disco-pink to-disco-purple"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              ))}

              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 px-4 py-2 rounded-full bg-glass hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-disco flex items-center justify-center">
                      <User size={16} />
                    </div>
                    <span className="text-sm font-medium">{user.firstName}</span>
                  </button>

                  <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-disco-pink/30 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right">
                    <div className="p-4 border-b border-gray-800">
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-disco-purple/20 text-disco-purple rounded">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-2">
                      {userMenuItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="flex items-center space-x-3 px-4 py-2 hover:bg-white/5 transition-colors"
                        >
                          <item.icon size={16} />
                          <span className="text-sm">{item.label}</span>
                        </Link>
                      ))}
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-2 w-full hover:bg-red-500/10 text-red-400 transition-colors"
                      >
                        <LogOut size={16} />
                        <span className="text-sm">Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn-retro px-6 py-2 text-sm"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 bg-black/95 backdrop-blur-lg">
              <div className="flex flex-col h-full pt-24 px-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={closeMobileMenu}
                    className={`py-4 text-lg font-medium border-b border-gray-800 transition-colors ${isActive(link.path) ? 'text-disco-pink' : 'text-gray-300'
                      }`}
                  >
                    {link.label}
                  </Link>
                ))}

                {isAuthenticated ? (
                  <>
                    <div className="py-4 border-b border-gray-800">
                      <p className="font-medium text-lg truncate">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-400 mt-1 truncate">{user.email}</p>
                    </div>

                    {userMenuItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={closeMobileMenu}
                        className="flex items-center space-x-3 py-4 border-b border-gray-800 text-gray-300"
                      >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                      </Link>
                    ))}

                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 py-4 text-red-400"
                    >
                      <LogOut size={20} />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <div className="py-6 space-y-4">
                    <Link
                      to="/login"
                      onClick={closeMobileMenu}
                      className="block w-full py-3 text-center border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={closeMobileMenu}
                      className="block w-full btn-retro text-center"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-20" />
    </>
  );
};

export default Navbar;
