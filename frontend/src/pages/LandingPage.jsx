import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Scale, Mic, FileText, ArrowRight, ShieldCheck, CheckCircle2, 
  HelpCircle, Volume2, Sparkles, Building2, Briefcase, ShoppingBag, 
  BookOpen, PhoneCall, ChevronRight, Play, Square 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ttsService } from '../services/speech';

const LandingPage = () => {
  const navigate = useNavigate();
  const { language } = useAuth();
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  const sampleQuestionHindi = "मेरे मकान मालिक ने ₹50,000 की सिक्योरिटी डिपॉजिट वापस करने से मना कर दिया। मुझे क्या करना चाहिए?";
  const sampleQuestionEnglish = "My landlord refused to refund my security deposit of ₹50,000 after I moved out. What can I do?";

  const playDemoAudio = () => {
    if (isPlayingDemo) {
      ttsService.stop();
      setIsPlayingDemo(false);
    } else {
      setIsPlayingDemo(true);
      const text = language === 'hi'
        ? "नमस्ते! न्यायसुनो में आपका स्वागत है। मॉडल टेनेंसी एक्ट के तहत मकान मालिक बिना वैध कारण के सिक्योरिटी डिपॉजिट नहीं रोक सकता। आप रेंट अथॉरिटी में आवेदन कर सकते हैं।"
        : "Hello! Welcome to NyayaSuno. Under the Model Tenancy Act, a landlord cannot arbitrarily withhold your security deposit upon handover. You have the statutory right to file a claim before the Rent Authority.";
      ttsService.speak(text, language, () => {
        setIsPlayingDemo(false);
      });
    }
  };

  const featureCards = [
    {
      icon: Mic,
      title: language === 'hi' ? 'Wispr Flow आवाज़-प्रथम कानूनी बातचीत' : 'Wispr Flow Voice Dictation',
      description: language === 'hi'
        ? 'Wispr Flow तकनीक से संचालित स्वाभाविक आवाज़ पहचान। यह फिलर शब्दों को हटाकर कानूनी समस्या को सटीक रूप से समझता है।'
        : 'Powered by Wispr Flow. Ultra-low latency voice recognition that strips filler words and auto-formats speech in Hindi, English, and Hinglish.'
    },
    {
      icon: ShieldCheck,
      title: language === 'hi' ? 'सत्यापित भारतीय कानूनों पर आधारित' : 'Verified India Code Grounding',
      description: language === 'hi'
        ? 'उपभोक्ता संरक्षण अधिनियम 2019, मॉडल टेनेंसी एक्ट, वेज कोड और नालसा के सत्यापित कानूनी प्रावधानों से सीधे उत्तर।'
        : 'Direct citations from verified statutory acts, avoiding fabricated claims or hallucinations.'
    },
    {
      icon: FileText,
      title: language === 'hi' ? 'दस्तावेज़ एवं नोटिस विश्लेषण' : 'Legal Document Understanding',
      description: language === 'hi'
        ? 'रेंट एग्रीमेंट, लीगल नोटिस या वेतन पर्ची अपलोड करें। एआई जोखिम वाली शर्तों और समय-सीमाओं को समझाएगा।'
        : 'Upload rental agreements, employment contracts, or legal notices to identify deadlines and risks.'
    },
    {
      icon: Building2,
      title: language === 'hi' ? 'मुफ्त कानूनी सहायता (NALSA)' : 'Free Legal Aid Access',
      description: language === 'hi'
        ? 'जानिए क्या आप धारा 12 के तहत सरकारी मुफ्त वकील के पात्र हैं। NALSA 15100 हेल्पलाइन से सीधे जुड़ें।'
        : 'Check your eligibility for free government advocates under Section 12 of NALSA Act.'
    }
  ];

  const domainCategories = [
    {
      icon: Building2,
      title: language === 'hi' ? 'किराएदारी और मकान मालिक' : 'Tenant & Rental Rights',
      query: 'Mere landlord ne mera security deposit wapas nahi kiya. Main kya kar sakta hoon?',
      sample: 'Security deposits, illegal eviction, cutoff of water or electricity.'
    },
    {
      icon: Briefcase,
      title: language === 'hi' ? 'रोजगार एवं बकाया वेतन' : 'Employment & Unpaid Wages',
      query: 'Company ne 2 mahine se salary nahi di hai, kya legal steps hain?',
      sample: 'Delayed salary, notice period dispute, arbitrary wage cuts, gratuity.'
    },
    {
      icon: ShoppingBag,
      title: language === 'hi' ? 'उपभोक्ता अधिकार एवं ई-दाखिल' : 'Consumer Rights & Claims',
      query: 'Defective product ka refund nahi mil raha, E-Daakhil par kaise file karein?',
      sample: 'E-commerce fraud, defective items, deficiency in service, helpline 1915.'
    },
    {
      icon: Scale,
      title: language === 'hi' ? 'लीगल नोटिस और कानूनी प्रक्रिया' : 'Legal Notices & NALSA',
      query: 'Mujhe legal notice mila hai, iska jawab kaise dena chahiye?',
      sample: 'Responding to notices, limitation period, free legal aid helpline 15100.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200 bg-gradient-to-b from-white via-slate-50 to-blue-50/40">
        
        {/* Subtle geometric background shapes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-40">
          <div className="absolute top-12 left-10 w-72 h-72 rounded-full bg-blue-200/50 blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-amber-100/60 blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-semibold mb-6 shadow-xs">
            <Scale className="w-3.5 h-3.5 text-blue-600" />
            <span>Built for Scaler x Wispr Flow Hackathon</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span className="text-blue-700">Voice-First India Code Intelligence</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-900 tracking-tight font-sans max-w-4xl mx-auto leading-tight">
            {language === 'hi' ? (
              <>
                कानूनी स्पष्टता, <span className="text-blue-600">आपकी अपनी भाषा में।</span>
              </>
            ) : (
              <>
                Indian Legal Clarity, <span className="text-blue-600">In Your Own Voice.</span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {language === 'hi'
              ? 'मकान मालिक से विवाद, बकाया वेतन, उपभोक्ता धोखाधड़ी या लीगल नोटिस? न्यायसुनो से हिन्दी या अंग्रेजी में बोलकर पूछें और सत्यापित कानूनों के आधार पर सरल मार्गदर्शन पाएं।'
              : 'Struggling with a withheld security deposit, delayed salary, consumer dispute, or a confusing legal notice? Speak naturally in Hindi, English, or Hinglish to receive verified legal guidance.'}
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              to="/assistant"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2.5 group"
            >
              <Mic className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
              <span>{language === 'hi' ? 'न्यायसुनो से बोलकर पूछें' : 'Talk to NyayaSuno'}</span>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition" />
            </Link>

            <button
              onClick={playDemoAudio}
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-navy-900 font-semibold text-sm shadow-xs hover:bg-slate-50 transition flex items-center justify-center gap-2"
            >
              {isPlayingDemo ? (
                <>
                  <Square className="w-4 h-4 text-rose-600 fill-rose-600" />
                  <span>{language === 'hi' ? 'आवाज़ बंद करें' : 'Stop Audio'}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-blue-600" />
                  <span>{language === 'hi' ? 'आवाज़ का नमूना सुनें' : 'Listen to Voice Demo'}</span>
                </>
              )}
            </button>
          </div>

          {/* Interactive Prompt Teaser */}
          <div className="mt-12 max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>{language === 'hi' ? 'उदाहरण प्रश्न (Try asking directly):' : 'Sample Citizen Inquiries'}</span>
              </span>
              <span className="text-xs text-blue-600 font-medium">Click to ask instantly</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {domainCategories.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(`/assistant?q=${encodeURIComponent(item.query)}`)}
                  className="p-3.5 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className="w-4 h-4 text-blue-600 group-hover:scale-110 transition" />
                    <h4 className="text-xs font-bold text-navy-900">{item.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    "{item.query}"
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
              {language === 'hi' ? 'सरल एवं पारदर्शी प्रक्रिया' : 'Simple 4-Step Architecture'}
            </h2>
            <h3 className="text-3xl font-extrabold text-navy-900">
              {language === 'hi' ? 'न्यायसुनो कैसे काम करता है?' : 'How NyayaSuno Works'}
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              Transforming complex statutory law into structured citizen-friendly guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 relative">
              <div className="w-9 h-9 rounded-xl bg-navy-900 text-white flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h4 className="text-base font-bold text-navy-900 mb-2">
                {language === 'hi' ? 'बोलें या लिखें' : 'Speak or Type'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Explain your dispute in everyday Hindi, English or Hinglish through our microphone interface.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 relative">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h4 className="text-base font-bold text-navy-900 mb-2">
                {language === 'hi' ? 'सत्यापित खोज (RAG)' : 'Statutory RAG Retrieval'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our vector engine retrieves exact sections from the Model Tenancy Act, CPA 2019, Wage Code, or NALSA.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 relative">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-navy-900 flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <h4 className="text-base font-bold text-navy-900 mb-2">
                {language === 'hi' ? 'सरल स्पष्टीकरण' : 'Simple Explanation'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gemini translates legalese into clear steps, explaining what the law actually means in your situation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 relative">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-4">
                4
              </div>
              <h4 className="text-base font-bold text-navy-900 mb-2">
                {language === 'hi' ? 'अगले कदम और स्रोत' : 'Next Steps & Citations'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive an actionable checklist of documents, official portal links (E-Daakhil), and NALSA Helpline 15100.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 md:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h3 className="text-3xl font-extrabold text-navy-900">
              {language === 'hi' ? 'विशेषताएं जो हमें अलग बनाती हैं' : 'Engineered for Citizen Accessibility'}
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              Grounded, reliable, voice-first legal guidance designed for the diverse needs of India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featureCards.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-700 shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-navy-900 mb-1.5">{feat.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{feat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Emergency Helplines Banner */}
      <section className="py-12 bg-navy-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Official Government Support</span>
            <h3 className="text-2xl font-bold mt-1">Need Urgent Legal Representation or Mediation?</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              NyayaSuno provides guidance, but when you need an assigned advocate in court or free legal aid, the Government of India provides 24x7 toll-free services.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-3 rounded-xl bg-navy-800 border border-navy-700 text-center">
              <span className="text-[11px] text-slate-400 block">NALSA Free Legal Aid</span>
              <span className="text-lg font-bold text-amber-400">15100</span>
            </div>
            <div className="px-4 py-3 rounded-xl bg-navy-800 border border-navy-700 text-center">
              <span className="text-[11px] text-slate-400 block">National Consumer Helpline</span>
              <span className="text-lg font-bold text-amber-400">1915</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;

