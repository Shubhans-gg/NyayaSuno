import React from 'react';
import { Scale, PhoneCall, ExternalLink, ShieldAlert, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Footer = () => {
  const { language } = useAuth();

  return (
    <footer className="bg-navy-900 text-slate-300 border-t border-navy-800 mt-20">
      
      {/* Helpline banner */}
      <div className="bg-navy-800/80 border-b border-navy-700/60 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                {language === 'hi' ? 'निःशुल्क सरकारी कानूनी सहायता हेल्पलाइन (24x7)' : 'Free National Legal Aid Helpline (24x7 Toll-Free)'}
              </p>
              <p className="text-sm font-bold text-white tracking-wide">
                NALSA Helpline: <span className="text-amber-400">15100</span> &nbsp;|&nbsp; National Consumer Helpline: <span className="text-amber-400">1915</span>
              </p>
            </div>
          </div>
          <a
            href="https://nalsa.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-300 hover:text-white transition font-medium"
          >
            <span>{language === 'hi' ? 'नालसा आधिकारिक पोर्टल' : 'Official NALSA Portal'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & About */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Scale className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">NyayaSuno</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4 max-w-md">
              {language === 'hi'
                ? 'न्यायसुनो एक आवाज़-आधारित एआई कानूनी सूचना सहायक है, जो भारतीय नागरिकों को सरल हिन्दी और अंग्रेजी में उनके अधिकारों, कानूनों और प्रक्रियाओं को समझने में सहायता करता है।'
                : 'NyayaSuno is a voice-first AI legal information assistant designed to demystify Indian statutory laws, tenancy rules, salary dues, and consumer rights into clear, accessible language.'}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Grounded in verified India Code statutory legislation.</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              {language === 'hi' ? 'प्रमुख विषय' : 'Key Domains'}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="/assistant?q=tenant" className="hover:text-blue-300 transition">Tenant & Rental Rights</a></li>
              <li><a href="/assistant?q=salary" className="hover:text-blue-300 transition">Unpaid Salary & Wages</a></li>
              <li><a href="/assistant?q=consumer" className="hover:text-blue-300 transition">Consumer Protection & E-Daakhil</a></li>
              <li><a href="/assistant?q=nalsa" className="hover:text-blue-300 transition">Free Legal Aid (NALSA)</a></li>
              <li><a href="/documents" className="hover:text-blue-300 transition">Legal Notice Analysis</a></li>
            </ul>
          </div>

          {/* Official portals */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              {language === 'hi' ? 'आधिकारिक स्रोत' : 'Official Portals'}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="https://www.indiacode.nic.in" target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 flex items-center gap-1">
                  <span>India Code Repository</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://edaakhil.nic.in" target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 flex items-center gap-1">
                  <span>E-Daakhil Consumer Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://consumerhelpline.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 flex items-center gap-1">
                  <span>National Consumer Helpline</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://egazette.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 flex items-center gap-1">
                  <span>e-Gazette of India</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Legal Disclaimer Box */}
        <div className="mt-10 p-4 rounded-xl bg-navy-800/90 border border-amber-500/30 text-amber-200/90 text-[11px] leading-relaxed">
          <p className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>IMPORTANT LEGAL DISCLAIMER:</span>
          </p>
          <p>
            NyayaSuno is an automated educational and legal information assistant. It is NOT a law firm and does NOT provide formal legal advice, case representation, or guaranteed outcomes. Indian statutory laws and state rules may vary across jurisdictions. Users facing critical disputes or impending court deadlines should always verify details with a certified advocate or call the National Legal Services Authority (NALSA) Helpline at 15100.
          </p>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} NyayaSuno. Empowering citizens through accessible legal knowledge.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for Indian Citizens
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;

