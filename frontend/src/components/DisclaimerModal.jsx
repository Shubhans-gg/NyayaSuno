import React from 'react';
import { X, ShieldAlert, Check } from 'lucide-react';

const DisclaimerModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4 text-navy-900">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-navy-900">Legal Safety & Disclaimers</h3>
            <p className="text-xs text-slate-500">NyayaSuno Citizen Protection Protocol</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed mb-6">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="text-navy-900 font-semibold block mb-0.5">1. Informational Assistant, Not an Advocate</strong>
            NyayaSuno is an educational legal information assistant. Interacting with NyayaSuno does not establish an attorney-client privilege or representation under the Advocates Act, 1961.
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="text-navy-900 font-semibold block mb-0.5">2. No Guaranteed Outcomes</strong>
            Legal cases are decided by competent courts, tribunals, and authorities based on factual evidence and discretion. NyayaSuno never guarantees legal victory or recovery.
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="text-navy-900 font-semibold block mb-0.5">3. State Laws & Jurisdictional Nuances</strong>
            Tenancy, rent control, and stamp duty vary significantly between Indian states (e.g., Maharashtra, Delhi, Karnataka, Tamil Nadu).
          </div>

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-900">
            <strong className="text-blue-950 font-semibold block mb-0.5">4. National Legal Aid Helpline: 15100</strong>
            If you need free advocate representation or qualify under Section 12 of the Legal Services Authorities Act, call 15100 (24x7 Toll-Free).
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm"
        >
          <Check className="w-4 h-4" />
          <span>I Understand & Acknowledge</span>
        </button>
      </div>
    </div>
  );
};

export default DisclaimerModal;

