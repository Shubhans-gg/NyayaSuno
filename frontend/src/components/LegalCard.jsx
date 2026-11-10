import React, { useState } from 'react';
import { 
  ShieldCheck, AlertCircle, FileCheck, ExternalLink, 
  Volume2, VolumeX, Flag, CheckCircle2, ListOrdered, Scale, Sparkles 
} from 'lucide-react';
import { ttsService } from '../services/speech';

const LegalCard = ({ data, onReport, language = 'en', messageId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState({});

  if (!data) return null;

  const toggleSpeech = () => {
    if (isPlaying) {
      ttsService.stop();
      setIsPlaying(false);
    } else {
      // Build speech text from understanding and plain explanation
      const speechText = `${data.understanding}. ${data.simple_explanation}. Key steps: ${data.possible_next_steps?.join('. ')}`;
      setIsPlaying(true);
      ttsService.speak(speechText, language, () => {
        setIsPlaying(false);
      });
    }
  };

  const toggleStep = (idx) => {
    setCheckedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden my-4 transition-all hover:shadow-md">
      
      {/* Top Header Toolbar */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 px-5 py-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-500/20 text-blue-400">
            <Scale className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            {language === 'hi' ? 'कानूनी विश्लेषण एवं मार्गदर्शन' : 'Verified Legal Assessment'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Listen Button */}
          <button
            onClick={toggleSpeech}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
              isPlaying
                ? 'bg-amber-500 text-navy-900 animate-pulse'
                : 'bg-navy-700/80 hover:bg-navy-700 text-blue-200 hover:text-white'
            }`}
            title={isPlaying ? "Stop audio" : "Listen to answer in natural voice"}
          >
            {isPlaying ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'रोकें' : 'Stop Audio'}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'सुनें (Listen)' : 'Listen'}</span>
              </>
            )}
          </button>

          {/* Report inaccuracy */}
          <button
            onClick={() => onReport && onReport(messageId || 'msg')}
            className="p-1 text-slate-400 hover:text-rose-400 rounded transition"
            title="Report inaccurate or misleading answer"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* 1. Understanding Your Situation */}
        {data.understanding && (
          <section className="bg-blue-50/60 rounded-xl p-4 border border-blue-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>1. {language === 'hi' ? 'आपकी स्थिति की समझ' : 'Understanding Your Situation'}</span>
            </h4>
            <p className="text-sm text-slate-800 leading-relaxed font-normal">
              {data.understanding}
            </p>
          </section>
        )}

        {/* 2. Relevant Legal Provisions */}
        {data.relevant_laws && data.relevant_laws.length > 0 && (
          <section>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-slate-700" />
              <span>2. {language === 'hi' ? 'लागू होने वाले कानून एवं धाराएं' : 'Relevant Statutory Provisions'}</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.relevant_laws.map((law, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800 flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span className="font-semibold text-navy-900">{law.act || law.act_name}:</span>
                  <span>{law.section}</span>
                  {law.provision_title && (
                    <span className="text-slate-500">({law.provision_title})</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. Simple Explanation */}
        {data.simple_explanation && (
          <section>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              3. {language === 'hi' ? 'सरल भाषा में स्पष्टीकरण' : 'Explanation in Simple Language'}
            </h4>
            <div className="text-sm text-slate-700 leading-relaxed space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
              {data.simple_explanation}
            </div>
          </section>
        )}

        {/* 4. Possible Next Steps */}
        {data.possible_next_steps && data.possible_next_steps.length > 0 && (
          <section>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <ListOrdered className="w-4 h-4 text-emerald-600" />
              <span>4. {language === 'hi' ? 'संभावित अगले कदम (Next Steps)' : 'Possible Next Steps'}</span>
            </h4>
            <div className="space-y-2">
              {data.possible_next_steps.map((step, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                    checkedSteps[idx]
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    className={`mt-0.5 rounded-full p-0.5 transition ${
                      checkedSteps[idx] ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <div className="text-xs sm:text-sm font-medium leading-relaxed">
                    <span className="font-semibold mr-1.5">Step {idx + 1}:</span>
                    <span className={checkedSteps[idx] ? 'line-through text-slate-500' : ''}>
                      {step}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Documents You May Need */}
        {data.documents_needed && data.documents_needed.length > 0 && (
          <section>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-amber-600" />
              <span>5. {language === 'hi' ? 'आवश्यक दस्तावेज़ (Checklist)' : 'Documents You May Need'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.documents_needed.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/40 border border-amber-200/60 text-xs font-medium text-slate-800"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></div>
                  <span>{doc}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Sources and Official References */}
        {data.sources && data.sources.length > 0 && (
          <section className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>6. {language === 'hi' ? 'सत्यापित कानूनी स्रोत एवं धाराएं' : 'Verified Legal Citations'}</span>
            </h4>
            <div className="space-y-2">
              {data.sources.map((src, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-navy-900">{src.act_name}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                        {src.section}
                      </span>
                    </div>
                    {src.heading && (
                      <p className="text-xs text-slate-600 mt-0.5">{src.heading}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {src.india_code_url && (
                      <a
                        href={src.india_code_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 transition"
                      >
                        <span>India Code</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {src.official_url && (
                      <a
                        href={src.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 transition"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. Important Disclaimer */}
        <section className="bg-amber-50/70 border border-amber-300/60 rounded-xl p-3 text-[11px] text-amber-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold">{language === 'hi' ? 'महत्वपूर्ण अस्वीकरण:' : 'Legal Disclaimer:'}</strong>{' '}
            {data.disclaimer || 'NyayaSuno provides legal information for educational purposes only and is not a formal legal counsel. State laws may vary. For formal representation, contact NALSA at 15100.'}
          </p>
        </section>

      </div>
    </div>
  );
};

export default LegalCard;

