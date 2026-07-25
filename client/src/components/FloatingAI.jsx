import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Send, Bot, User, MessageCircle, X, Minus } from 'lucide-react';

const QUICK_CHIPS = [
  "Today's appointments",
  "Queue status",
  "Room overview",
  "Patient count",
];

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    text: "Hello! I'm DentAssist AI. I have access to your clinic's live data.\n\nTry asking me:\n- \"Who's my first patient today?\"\n- \"How many patients are waiting?\"\n- \"What's room 3's status?\"\n\nOr pick a quick action below:",
  },
];

export default function FloatingAI() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [source, setSource] = useState(null);
  const messagesEnd = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) {
      const inputEl = document.getElementById('ai-chat-input');
      if (inputEl) inputEl.focus();
    }
  }, [open]);

  if (!user || user.role === 'PATIENT') return null;

  const handleSend = async (text) => {
    const msg = text || input.trim();
    if (!msg || typing) return;

    const userMsg = { role: 'user', text: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const chatHistory = messages.slice(-10).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [m.text],
      }));

      const res = await api.post('/ai/chat', { message: msg, history: chatHistory });
      setSource(res.data.source);
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "Sorry, the AI service is currently unavailable. Please try again later.",
      }]);
    }
    setTyping(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#0F766E] hover:bg-[#0D6D65] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        >
          <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="bg-slate-900 text-white p-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0D6D65] rounded-full flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div>
                <div className="font-bold text-sm">DentAssist AI</div>
                <div className="text-[10px] text-[#14B8A6] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  Live clinic data
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {source && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full mr-2 ${
                  source === 'gemini' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {source === 'gemini' ? 'AI-Powered' : 'Offline Mode'}
                </span>
              )}
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-[#0D6D65] rounded transition-colors">
                <Minus size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 bg-[#F0FDFA] text-[#0F766E] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={12} />
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-[13px] leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-[#0F766E] text-white rounded-br-sm'
                    : 'bg-slate-50 text-slate-900 border border-slate-200 rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 bg-[#F0FDFA] text-[#0F766E] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <User size={12} />
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-[#F0FDFA] text-[#0F766E] rounded-full flex items-center justify-center">
                  <Bot size={12} />
                </div>
                <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-[#14B8A6] rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-[#14B8A6] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1.5 h-1.5 bg-[#14B8A6] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          {/* Quick Chips */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSend(chip)}
                  className="text-[11px] px-2.5 py-1 bg-[#F0FDFA] text-[#0D6D65] rounded-full hover:bg-[#99F6E4] transition-colors font-medium"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 p-3 shrink-0">
            <div className="flex gap-2">
              <input
                id="ai-chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about patients, rooms, queue..."
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
                disabled={typing}
              />
              <button
                onClick={() => handleSend()}
                disabled={typing || !input.trim()}
                className="bg-[#0F766E] text-white px-3 py-2 rounded-lg hover:bg-[#0D6D65] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
