import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scale, Mic, FileText, BookOpen, ShieldAlert, User, LogOut, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout, language, setLanguage } = useAuth();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const navLinks = [
    { to: '/assistant', label: language === 'hi' ? 'एआई सहायक' : 'Assistant', icon: Mic },
    { to: '/documents', label: language === 'hi' ? 'दस्तावेज़ विश्लेषण' : 'Documents', icon: FileText },
    { to: '/resources', label: language === 'hi' ? 'कानूनी स्रोत' : 'Legal Sources', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center text-amber-500 shadow-sm group-hover:bg-navy-800 transition">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-navy-900 font-sans">NyayaSuno</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold uppercase tracking-wider">AI</span>
              <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold">
                ⚡ Wispr Flow Voice
              </span>
            </div>
            <p className="text-[11px] text-slate-700 font-medium -mt-1">
              {language === 'hi' ? 'कानूनी स्पष्टता, आपकी भाषा में' : 'Legal clarity, in your language'}
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions: Language Switcher & Auth */}
        <div className="flex items-center gap-3">
          
          {/* Language Switcher Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            title="Toggle Hindi / English"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          {/* User authentication */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-100 transition"
              >
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline text-xs font-medium text-slate-700 max-w-[120px] truncate">
                  {user?.name || 'Account'}
                </span>
              </Link>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/auth"
                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-navy-900 transition"
              >
                {language === 'hi' ? 'लॉग इन' : 'Log In'}
              </Link>
              <Link
                to="/auth?signup=true"
                className="px-3.5 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-semibold hover:bg-navy-800 shadow-sm transition"
              >
                {language === 'hi' ? 'शुरू करें' : 'Get Started'}
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;

