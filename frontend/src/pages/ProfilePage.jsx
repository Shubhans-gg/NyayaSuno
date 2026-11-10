import React from 'react';
import { User, Mail, Calendar, Globe, Shield, PhoneCall, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, language, setLanguage } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-navy-900 mb-2">Guest Session</h2>
          <p className="text-xs text-slate-500 mb-4">You are currently using NyayaSuno in guest mode. Sign in to save your consultations.</p>
          <button
            onClick={() => navigate('/auth')}
            className="px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-semibold"
          >
            Log In or Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy-900">{user.name}</h1>
              <p className="text-xs text-slate-500">{user.email}</p>
              <span className="inline-flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Account</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Data Protection: AES-256 Encrypted</span>
            </div>
          </div>

          {/* Preferences */}
          <div className="pt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Assistant Preferences</h3>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-blue-600" />
                <div>
                  <h4 className="text-xs font-bold text-navy-900">Preferred Language</h4>
                  <p className="text-[11px] text-slate-500">Choose default language for voice and text answers</p>
                </div>
              </div>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white font-semibold text-slate-700 focus:outline-none"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-8 flex justify-end">
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>

        </div>

        {/* Emergency Card */}
        <div className="bg-navy-900 text-white rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Need Immediate Legal Help?</h4>
              <p className="text-xs text-slate-400">NALSA National Legal Aid Helpline: 15100</p>
            </div>
          </div>
          <a
            href="tel:15100"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-xs transition"
          >
            Call 15100
          </a>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;

