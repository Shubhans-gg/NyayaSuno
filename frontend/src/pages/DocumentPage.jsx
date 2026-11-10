import React, { useState } from 'react';
import { 
  UploadCloud, FileText, AlertTriangle, Calendar, ShieldCheck, 
  CheckCircle2, Loader2, ArrowRight, Sparkles, Scale, Info, HelpCircle 
} from 'lucide-react';
import { documentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LegalCard from '../components/LegalCard';

const DocumentPage = () => {
  const { language } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  // Question answering state
  const [question, setQuestion] = useState('');
  const [answering, setAnswering] = useState(false);
  const [questionAnswer, setQuestionAnswer] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (selectedFile) => {
    setError(null);
    setFile(selectedFile);
    setUploading(true);
    setAnalysis(null);
    setQuestionAnswer(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await documentsAPI.upload(formData);
      setAnalysis(res.data);
    } catch (err) {
      console.error('Document processing error:', err);
      setError(err.response?.data?.detail || 'Failed to extract text or analyze document. Please check the file format.');
    } finally {
      setUploading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim() || !analysis || answering) return;

    setAnswering(true);
    try {
      const res = await documentsAPI.askQuestion({
        document_id: analysis.document_id,
        question: question.trim(),
        language: language
      });
      setQuestionAnswer(res.data);
    } catch (err) {
      console.error('Error asking document question:', err);
      alert('Could not answer question based on document.');
    } finally {
      setAnswering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Document Intelligence & Risk Analysis</span>
          </div>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
            {language === 'hi' ? 'कानूनी दस्तावेज़ एवं नोटिस विश्लेषण' : 'Legal Document & Notice Understanding'}
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            {language === 'hi'
              ? 'अपना रेंट एग्रीमेंट, लीगल नोटिस, नौकरी का कॉन्ट्रैक्ट या इनवॉइस अपलोड करें। एआई जोखिम वाली शर्तों, समय-सीमाओं और आपके अधिकारों का विश्लेषण करेगा।'
              : 'Upload your rental agreement, legal notice, employment contract, or consumer invoice. Our engine extracts clauses, flags high-risk liabilities, and explains your statutory rights.'}
          </p>
        </div>

        {/* Upload Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white rounded-2xl p-8 sm:p-12 text-center transition cursor-pointer shadow-xs"
        >
          <input
            type="file"
            id="docUploadInput"
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
          />
          <label htmlFor="docUploadInput" className="cursor-pointer block">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              {uploading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <UploadCloud className="w-7 h-7" />
              )}
            </div>

            <h3 className="text-base font-bold text-navy-900 mb-1">
              {uploading
                ? (language === 'hi' ? 'दस्तावेज़ का विश्लेषण हो रहा है...' : 'Extracting Text & Analyzing Clauses...')
                : (language === 'hi' ? 'दस्तावेज़ चुनें या यहाँ खींचकर छोड़ें' : 'Choose a file or drag & drop here')}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Supports PDF, PNG, JPG, JPEG (Max file size: 15MB)
            </p>
            <span className="inline-block px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition shadow-xs">
              Browse Files
            </span>
          </label>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Analysis Results Display */}
        {analysis && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Document Overview Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Classified Document Type
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <h2 className="text-xl font-bold text-navy-900">{analysis.document_type}</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                      {analysis.ocr_confidence}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">File: {analysis.file_name}</p>
                </div>
              </div>

              {/* Plain Language Summary */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Plain Language Summary</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  {analysis.plain_language_summary}
                </p>
              </div>

              {/* Key Dates & Deadlines */}
              {analysis.key_dates_and_deadlines?.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>Identified Dates & Deadlines</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.key_dates_and_deadlines.map((date, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900"
                      >
                        📅 {date}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clauses Risk Breakdown */}
            {analysis.important_clauses?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-blue-600" />
                  <span>Important Clauses & Legal Breakdown</span>
                </h3>

                <div className="space-y-3">
                  {analysis.important_clauses.map((clause, idx) => {
                    const isWarning = clause.risk_level === 'warning';
                    const isCritical = clause.risk_level === 'critical';
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition ${
                          isCritical
                            ? 'bg-rose-50/40 border-rose-200'
                            : isWarning
                            ? 'bg-amber-50/40 border-amber-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="text-xs font-bold text-navy-900">{clause.clause_title}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isCritical
                                ? 'bg-rose-100 text-rose-800'
                                : isWarning
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            Risk: {clause.risk_level}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {clause.plain_english_summary}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Potential Risks & Next Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Potential Risks */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Potential Risks & Red Flags</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  {analysis.potential_risks?.map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Next Steps */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Recommended Action Steps</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  {analysis.next_steps?.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Interactive Question Answering On Uploaded Document */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-bold text-navy-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <span>Ask a Specific Question About This Document</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Ask anything about the clauses (e.g. "What is my penalty if I break the lease early?", "What is the notice period?").
              </p>

              <form onSubmit={handleAskQuestion} className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. What are the rules regarding security deposit refund in this agreement?"
                  className="flex-1 text-xs border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!question.trim() || answering}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center gap-2 shadow-xs"
                >
                  {answering ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>Ask AI</span>
                </button>
              </form>

              {/* Render Document Q&A Answer */}
              {questionAnswer && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <LegalCard data={questionAnswer} language={language} />
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default DocumentPage;

