import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Send, Mic, Paperclip, Plus, Trash2, MessageSquare, 
  Scale, Globe, Loader2, Sparkles, ShieldAlert, ArrowDown, 
  ExternalLink, FileText, CheckCircle2, X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { chatAPI, documentsAPI } from '../services/api';
import LegalCard from '../components/LegalCard';
import VoiceRecorder from '../components/VoiceRecorder';
import ReportModal from '../components/ReportModal';

const SUGGESTED_QUESTIONS = [
  {
    title_en: "Can my landlord refuse to return my security deposit?",
    title_hi: "क्या मेरा मकान मालिक सिक्योरिटी डिपॉजिट रोकने का हकदार है?",
    query: "Can my landlord refuse to return my security deposit under the Model Tenancy Act?"
  },
  {
    title_en: "What can I do if my employer doesn't pay my salary?",
    title_hi: "कंपनी ने वेतन नहीं दिया तो मैं क्या कानूनी कदम उठा सकता हूँ?",
    query: "What legal actions can I take if my employer delayed or withheld my salary for 2 months?"
  },
  {
    title_en: "What are my rights as a consumer for a defective product?",
    title_hi: "खराब सामान मिलने पर उपभोक्ता के क्या अधिकार हैं?",
    query: "What are my rights as a consumer under CPA 2019 if the seller refuses a refund for a defective product?"
  },
  {
    title_en: "How should I respond to this legal notice?",
    title_hi: "लीगल नोटिस मिलने पर क्या सावधानियां बरतनी चाहिए?",
    query: "What is the legal procedure and time limit to reply to a legal notice received from an advocate?"
  }
];

const AssistantPage = () => {
  const [searchParams] = useSearchParams();
  const { language, setLanguage, user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Document attachment
  const [attachedDoc, setAttachedDoc] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Reporting modal
  const [reportingMsgId, setReportingMsgId] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load conversation list on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Handle URL query parameter pre-fill
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      handleSendMessage(q);
    }
  }, [searchParams]);

  const loadConversations = async () => {
    try {
      const res = await chatAPI.getConversations();
      setConversations(res.data);
      if (res.data.length > 0 && !activeConvId) {
        // Load most recent
        loadConversationMessages(res.data[0].id);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadConversationMessages = async (convId) => {
    try {
      setActiveConvId(convId);
      const res = await chatAPI.getConversation(convId);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Error fetching conversation messages:', err);
    }
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setAttachedDoc(null);
    setInputText('');
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    try {
      await chatAPI.deleteConversation(convId);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConvId === convId) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const handleSendMessage = async (textToSend = null) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || loading) return;

    setInputText('');
    setLoading(true);

    // Optimistically add user message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageContent,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const docIds = attachedDoc ? [attachedDoc.document_id] : [];
      const res = await chatAPI.sendMessage({
        message: messageContent,
        conversation_id: activeConvId,
        language: language,
        document_ids: docIds
      });

      const { conversation_id, message_id, content, structured_data, created_at } = res.data;

      // Update active conv ID
      if (!activeConvId) {
        setActiveConvId(conversation_id);
        loadConversations();
      }

      // Add assistant response
      const assistantMsg = {
        id: message_id,
        role: 'assistant',
        content: content,
        structured_data: structured_data,
        created_at: created_at
      };

      setMessages(prev => [...prev, assistantMsg]);
      setAttachedDoc(null); // Clear attachment once used
    } catch (err) {
      console.error('Chat error:', err);
      // Fallback friendly error
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'We encountered a momentary communication error. Please try again.',
        structured_data: {
          understanding: 'Your query was received, but there was an unexpected connection timeout.',
          relevant_laws: [],
          simple_explanation: 'Please check your internet connection or resubmit your query. For immediate emergency legal aid, call NALSA Helpline 15100.',
          possible_next_steps: ['Resend your message', 'Contact NALSA Helpline 15100 for immediate legal counseling'],
          documents_needed: [],
          sources: [],
          disclaimer: 'NyayaSuno automated educational assistant.'
        },
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Voice recording completion handler
  const handleAudioRecorded = async (audioBlob, mimeType, transcriptFallback) => {
    if (!audioBlob) return;
    setLoading(true);

    const tempUserMsg = {
      id: `temp-voice-${Date.now()}`,
      role: 'user',
      content: transcriptFallback || '🎙️ Spoken voice query (Transcribing...)',
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice_query.webm');
      if (activeConvId) formData.append('conversation_id', activeConvId);
      formData.append('language', language);

      const res = await chatAPI.sendVoice(formData);
      const { transcribed_text, transcription_provider, chat_response } = res.data;

      // Update optimistic user message with actual transcribed text & Wispr Flow badge
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.findIndex(m => m.id === tempUserMsg.id);
        if (lastIdx !== -1) {
          updated[lastIdx].content = `"${transcribed_text}"`;
          updated[lastIdx].provider = transcription_provider || 'Wispr Flow';
        }
        return updated;
      });

      // Set conversation ID
      if (!activeConvId && chat_response.conversation_id) {
        setActiveConvId(chat_response.conversation_id);
        loadConversations();
      }

      // Add assistant response
      const assistantMsg = {
        id: chat_response.message_id,
        role: 'assistant',
        content: chat_response.content,
        structured_data: chat_response.structured_data,
        created_at: chat_response.created_at
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Voice chat error:', err);
      // If voice upload failed, prompt user to use text or browser STT
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Voice processing could not be completed. You can also type your legal question directly.',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Direct document attachment upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await documentsAPI.upload(formData);
      setAttachedDoc(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Document upload failed. Supported formats: PDF, PNG, JPG.');
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50 min-h-[calc(100vh-4rem)]">
      
      {/* Sidebar: Conversation History */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200">
        
        {/* New Chat Button */}
        <div className="p-4 border-b border-slate-200">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'hi' ? 'नई कानूनी बातचीत' : 'New Legal Consultation'}</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-slate-300" />
              <span>{language === 'hi' ? 'कोई पुरानी बातचीत नहीं है' : 'No previous conversations'}</span>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeConvId === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => loadConversationMessages(conv.id)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 font-semibold border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="truncate">{conv.title || 'Legal Inquiry'}</span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Free Legal Aid Banner */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
            <span className="font-bold text-navy-900 block mb-0.5">NALSA Legal Helpline</span>
            <span className="text-[11px] text-slate-500 block mb-2">Free legal representation for eligible citizens</span>
            <a
              href="tel:15100"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 text-navy-950 font-bold text-xs"
            >
              <span>Call 15100</span>
            </a>
          </div>
        </div>

      </aside>

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto w-full px-4 sm:px-6">
        
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          
          {/* Welcome Screen if empty */}
          {messages.length === 0 && !loading && (
            <div className="max-w-xl mx-auto text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-navy-900 text-amber-500 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Scale className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-navy-900 mb-2">
                {language === 'hi' ? 'नमस्ते! मैं न्यायसुनो हूँ।' : 'Welcome to NyayaSuno'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mb-8 leading-relaxed">
                {language === 'hi'
                  ? 'अपनी कानूनी समस्या हिन्दी या अंग्रेजी में बोलकर या लिखकर बताएं। मैं सत्यापित भारतीय कानूनों से सटीक जानकारी और अगले कदम बताऊंगा।'
                  : 'Explain your legal issue in natural Hindi, English, or Hinglish. I retrieve statutory provisions from India Code and explain your rights in plain language.'}
              </p>

              {/* Suggestion Chips */}
              <div className="space-y-2 text-left">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  {language === 'hi' ? 'अक्सर पूछे जाने वाले सवाल:' : 'Frequently Asked Citizen Questions:'}
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {SUGGESTED_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q.query)}
                      className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40 text-xs text-slate-700 font-medium text-left transition flex items-center justify-between group shadow-xs"
                    >
                      <span>{language === 'hi' ? q.title_hi : q.title_en}</span>
                      <Sparkles className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Render Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              
              {/* User message */}
              {msg.role === 'user' && (
                <div className="flex justify-end">
                  <div className="max-w-xl px-4 py-3 rounded-2xl rounded-tr-xs bg-blue-600 text-white text-sm shadow-sm">
                    <p className="leading-relaxed font-normal">{msg.content}</p>
                    {msg.provider && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-blue-200 font-semibold bg-blue-700/60 px-2 py-0.5 rounded-full">
                        <span>⚡ {msg.provider}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Assistant response */}
              {msg.role === 'assistant' && (
                <div className="flex justify-start">
                  <div className="w-full">
                    {msg.structured_data ? (
                      <LegalCard
                        data={msg.structured_data}
                        messageId={msg.id}
                        language={language}
                        onReport={(id) => setReportingMsgId(id)}
                      />
                    ) : (
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 text-sm text-slate-800 shadow-sm leading-relaxed">
                        {msg.content}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm max-w-md w-full">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-navy-900">
                      {language === 'hi' ? 'कानूनी धाराओं का मिलान हो रहा है...' : 'Searching India Code Repository...'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Retrieving statutory sections & synthesizing plain language explanation...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="py-4 border-t border-slate-200 bg-slate-50">
          
          {/* Document attachment tag */}
          {attachedDoc && (
            <div className="mb-2 flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 w-max">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="font-semibold">{attachedDoc.file_name}</span>
              <span className="text-slate-500">({attachedDoc.document_type})</span>
              <button
                type="button"
                onClick={() => setAttachedDoc(null)}
                className="text-slate-400 hover:text-slate-600 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-white rounded-2xl border border-slate-300 p-2 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition"
          >
            {/* File attachment button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingDoc}
              className="p-2 text-slate-400 hover:text-navy-900 rounded-xl hover:bg-slate-100 transition"
              title="Attach legal document (PDF, PNG, JPG)"
            >
              {uploadingDoc ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              ) : (
                <Paperclip className="w-5 h-5" />
              )}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'अपनी कानूनी समस्या लिखें या माइक बटन दबाकर बोलें...'
                  : 'Ask about rent, salary, consumer rights, or legal notice...'
              }
              className="flex-1 text-sm bg-transparent border-0 focus:outline-none px-2 text-slate-800 placeholder-slate-400"
            />

            {/* Voice Recorder Component */}
            <VoiceRecorder
              language={language}
              disabled={loading}
              onTranscriptionComplete={(text) => {
                setInputText(text);
              }}
              onAudioRecorded={handleAudioRecorded}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className={`p-2.5 rounded-xl transition ${
                inputText.trim() && !loading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Quick language toggle & disclaimer */}
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Language:</span>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`font-semibold ${language === 'en' ? 'text-blue-600 underline' : 'hover:text-slate-600'}`}
              >
                English
              </button>
              <span>/</span>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`font-semibold ${language === 'hi' ? 'text-blue-600 underline' : 'hover:text-slate-600'}`}
              >
                हिन्दी
              </button>
            </div>
            <span>Educational legal assistance. Call 15100 for NALSA free counsel.</span>
          </div>

        </div>

      </main>

      {/* Inaccuracy Reporting Modal */}
      <ReportModal
        isOpen={!!reportingMsgId}
        onClose={() => setReportingMsgId(null)}
        messageId={reportingMsgId}
        conversationId={activeConvId}
      />

    </div>
  );
};

export default AssistantPage;

