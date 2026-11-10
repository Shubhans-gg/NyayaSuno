import React, { useState, useEffect } from 'react';
import { 
  BookOpen, ExternalLink, ShieldCheck, PhoneCall, 
  Search, Scale, HelpCircle, CheckCircle2, ChevronRight, FileText 
} from 'lucide-react';
import { legalAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ResourcesPage = () => {
  const { language } = useAuth();
  const [categories, setCategories] = useState([]);
  const [helplines, setHelplines] = useState([]);
  const [sources, setSources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLegalData();
  }, []);

  const loadLegalData = async () => {
    try {
      const [catRes, helpRes, srcRes] = await Promise.all([
        legalAPI.getCategories(),
        legalAPI.getHelplines(),
        legalAPI.getSources()
      ]);
      setCategories(catRes.data.categories || []);
      setHelplines(helpRes.data.helplines || []);
      setSources(srcRes.data.sources || []);
    } catch (err) {
      console.error('Error fetching legal resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSources = sources.filter(src => {
    const matchesCat = selectedCategory === 'all' || 
      src.category?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      src.act_name?.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesQuery = !searchQuery || 
      src.act_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      src.section?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      src.heading?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      src.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Verified Statutory Legal Repository</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
            {language === 'hi' ? 'सत्यापित कानूनी स्रोत एवं हेल्पलाइन' : 'Legal Knowledge Base & Government Helplines'}
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            All NyayaSuno intelligence is grounded in official legislation from India Code and Ministry notifications. Explore the underlying acts and direct citizen helplines below.
          </p>
        </div>

        {/* Emergency Helplines Cards */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <PhoneCall className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-navy-900">Official National Helplines (Toll-Free)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {helplines.map((h, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider mb-2 inline-block">
                    {h.category}
                  </span>
                  <h3 className="text-xs font-bold text-navy-900 leading-tight mb-1">{h.name}</h3>
                  <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">{h.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-base font-extrabold text-navy-900">{h.number}</span>
                  <a
                    href={h.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Visit Official Portal"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* E-Daakhil Citizen Consumer Guide */}
        <div className="bg-gradient-to-r from-blue-900 to-navy-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Citizen Redressal Guide</span>
            <h2 className="text-xl sm:text-2xl font-bold mt-1 mb-2">How to File a Consumer Complaint on E-Daakhil Without an Advocate</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              Under the Consumer Protection Act 2019, any citizen who paid consideration for goods or services can file a complaint directly from their computer or phone without paying an advocate fee.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <span className="font-bold text-amber-400 block mb-1">Step 1: Register Account</span>
                <p className="text-slate-300">Visit edaakhil.nic.in and register using your mobile number and Aadhaar/OTP verification.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <span className="font-bold text-amber-400 block mb-1">Step 2: Upload Evidence</span>
                <p className="text-slate-300">Upload your invoice, warranty card, communication trail, and defective product photos.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <span className="font-bold text-amber-400 block mb-1">Step 3: Online Fee & Hearing</span>
                <p className="text-slate-300">Pay nominal online court fee (exempt up to ₹5 Lakhs) and attend hearings via video conference.</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://edaakhil.nic.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-xs transition"
              >
                <span>Open E-Daakhil Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://consumerhelpline.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white font-semibold text-xs transition"
              >
                <span>National Consumer Helpline (1915)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Statutory Knowledge Explorer */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-navy-900">Explore Grounded Statutory Sections</h2>
              <p className="text-xs text-slate-500">Live search through indexed provisions and official India Code links.</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search act, section, or keyword..."
                className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedCategory === 'all'
                  ? 'bg-navy-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Provisions ({sources.length})
            </button>
            <button
              onClick={() => setSelectedCategory('consumer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedCategory === 'consumer'
                  ? 'bg-navy-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Consumer Rights (CPA 2019)
            </button>
            <button
              onClick={() => setSelectedCategory('rental')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedCategory === 'rental'
                  ? 'bg-navy-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Rental & Tenancy
            </button>
            <button
              onClick={() => setSelectedCategory('wages')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedCategory === 'wages'
                  ? 'bg-navy-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Wages & Employment
            </button>
            <button
              onClick={() => setSelectedCategory('legal aid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedCategory === 'legal aid'
                  ? 'bg-navy-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Free Legal Aid (NALSA)
            </button>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSources.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold text-navy-900 truncate">{item.act_name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 shrink-0">
                      {item.section}
                    </span>
                  </div>
                  {item.heading && (
                    <h3 className="text-xs font-bold text-slate-700 mb-2">{item.heading}</h3>
                  )}
                  <p className="text-xs text-slate-600 leading-relaxed font-normal mb-4">
                    {item.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Jurisdiction: {item.jurisdiction || 'All India'}</span>
                  <div className="flex items-center gap-2">
                    {item.india_code_url && (
                      <a
                        href={item.india_code_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                      >
                        <span>India Code</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {item.official_url && (
                      <a
                        href={item.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-800 font-semibold flex items-center gap-1"
                      >
                        <span>Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};

export default ResourcesPage;

