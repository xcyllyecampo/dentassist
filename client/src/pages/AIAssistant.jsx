import { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import api from '../lib/api';
import { Send, Bot, User } from 'lucide-react';

const INITIAL_MESSAGES = [
  { role: 'assistant', text: "Hello! I'm the DentAssist AI Assistant. I can help you with:\n\n- Answering FAQs about dental procedures\n- Explaining treatments\n- Booking appointments\n- Clinic information\n\nHow can I help you today?" },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [source, setSource] = useState(null);
  const messagesEnd = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setTyping(true);

    try {
      const chatHistory = messages.slice(-10).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text,
      }));

      const res = await api.post('/ai/chat', { message: currentInput, history: chatHistory });
      setSource(res.data.source);
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "I'm sorry, I'm having trouble connecting. Please make sure the AI service is running and try again." }]);
    }
    setTyping(false);
  };

  return (
    <Layout>
      <Header title="AI Dental Assistant" />
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-sky-100 overflow-hidden max-w-3xl mx-auto" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="bg-sky-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-700 rounded-full flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div>
                <div className="font-bold">DentAssist AI</div>
                <div className="text-xs text-sky-300">Always available to help</div>
              </div>
            </div>
            {source && (
              <span className={`text-xs px-3 py-1 rounded-full ${source === 'openai' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>
                {source === 'openai' ? 'GPT-4' : 'Demo Mode'}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 140px)' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center shrink-0">
                    <Bot size={16} />
                  </div>
                )}
                <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-sky-600 text-white rounded-br-sm'
                    : 'bg-sky-50 text-sky-900 border border-sky-100 rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="bg-sky-50 border border-sky-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          <div className="border-t border-sky-100 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !typing && handleSend()}
                placeholder="Ask about procedures, hours, booking..."
                className="flex-1 px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                disabled={typing}
              />
              <button onClick={handleSend} disabled={typing || !input.trim()}
                className="bg-sky-600 text-white px-4 py-3 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
