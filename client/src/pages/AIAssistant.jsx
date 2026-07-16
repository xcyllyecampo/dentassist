import { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { Send, Bot, User } from 'lucide-react';

const INITIAL_MESSAGES = [
  { role: 'bot', text: "Hello! I'm the DentAssist AI Assistant. I can help you with:\n\n- Answering FAQs about dental procedures\n- Explaining treatments\n- Booking appointments\n- Clinic information\n\nHow can I help you today?" },
];

const KB = {
  'hello': "Hello! Welcome to DentAssist. How can I help you today?",
  'hi': "Hi there! How can I assist you with your dental needs?",
  'hours': "Our clinic operates Monday to Friday, 9:00 AM to 5:00 PM. Saturday 9:00 AM to 12:00 PM. We are closed on Sundays and holidays.",
  'location': "We are located at 123 Main Street, Manila, Philippines. Free parking is available behind the building.",
  'booking': "To book an appointment, you can:\n1. Use the Appointments page in the dashboard\n2. Call us at (02) 8123-4567\n3. I can help you book right now - just tell me your preferred date and time!",
  'cancellation': "You can cancel or reschedule an appointment up to 24 hours before your scheduled time. Please call us or use the dashboard.",
  'root canal': "A root canal is a treatment to repair and save a badly damaged or infected tooth. The procedure involves removing the damaged area of the tooth (the pulp), cleaning and disinfecting it, then filling and sealing it. The procedure typically takes 1-2 sessions and is done under local anesthesia.",
  'filling': "A dental filling is used to repair minor tooth damage such as cavities or small chips. The decayed portion of the tooth is removed and then filled with material like composite resin, amalgam, or gold. The procedure usually takes 30-60 minutes.",
  'extraction': "Tooth removal (extraction) may be necessary for severely damaged teeth, overcrowding, or impacted wisdom teeth. Simple extractions take about 20-40 minutes. Recovery typically takes 7-10 days.",
  'cleaning': "Professional dental cleaning (prophylaxis) removes plaque and tartar buildup. We recommend cleaning every 6 months. The procedure takes about 30-45 minutes and is painless.",
  'whitening': "Teeth whitening can brighten your smile by several shades. We offer in-office whitening (1-hour results) and take-home kits. Results last 6-12 months depending on care.",
  'braces': "Orthodontic treatment with braces can correct misaligned teeth and bite issues. Treatment typically lasts 18-24 months. We offer traditional metal braces, ceramic braces, and clear aligners.",
  'veneers': "Dental veneers are thin shells placed over the front of teeth to improve appearance. They can fix chips, gaps, and discoloration. Porcelain veneers last 10-15 years.",
  'cost': "Our pricing varies by procedure:\n- Consultation: $30\n- Cleaning: $80\n- Filling: $100-200\n- Root Canal: $500-800\n- Extraction: $150-300\n- Whitening: $300\n- Braces: $3,000-5,000\nWe accept most insurance plans.",
  'insurance': "We accept most major dental insurance plans including HMO, DMF, and PhilHealth. Please bring your insurance card to your appointment.",
  'pain': "If you're experiencing dental pain, please call us immediately at (02) 8123-4567. For after-hours emergencies, our emergency line is available. In the meantime, you can take over-the-counter pain relief (ibuprofen if not allergic) and apply a cold compress.",
  'emergency': "For dental emergencies (severe pain, broken tooth, knocked-out tooth), call our emergency line at (02) 8123-4568. Available 24/7. For a knocked-out tooth, keep it moist in milk and come in within 30 minutes.",
};

function getBotResponse(input) {
  const lower = input.toLowerCase().trim();

  if (lower.match(/\b(hello|hi|hey|good morning|good afternoon)\b/)) return KB['hello'];
  if (lower.match(/\b(hour|time|open|schedule|when)\b/)) return KB['hours'];
  if (lower.match(/\b(location|where|address|find|direction)\b/)) return KB['location'];
  if (lower.match(/\b(book|appointment|schedule|reserve)\b/)) return KB['booking'];
  if (lower.match(/\b(cancel|reschedule|change)\b/)) return KB['cancellation'];
  if (lower.match(/\b(root canal|root canal treatment)\b/)) return KB['root canal'];
  if (lower.match(/\b(fill|filling|cavity|cavities)\b/)) return KB['filling'];
  if (lower.match(/\b(extract|extraction|pull|remove tooth)\b/)) return KB['extraction'];
  if (lower.match(/\b(clean|cleaning|scaling|prophylaxis)\b/)) return KB['cleaning'];
  if (lower.match(/\b(white|whitening|bleach|brighten)\b/)) return KB['whitening'];
  if (lower.match(/\b(brace|braces|aligner|align|orthodont)\b/)) return KB['braces'];
  if (lower.match(/\b(veneer|veneers|laminate)\b/)) return KB['veneers'];
  if (lower.match(/\b(cost|price|how much|fee|charge|pricing)\b/)) return KB['cost'];
  if (lower.match(/\b(insurance|coverage|hmo|philhealth)\b/)) return KB['insurance'];
  if (lower.match(/\b(pain|hurt|ache|sore|throbbing)\b/)) return KB['pain'];
  if (lower.match(/\b(emergency|urgent|broken|knocked out|accident)\b/)) return KB['emergency'];

  return "I'm not sure I understand that question. I can help with:\n\n- Clinic hours & location\n- Dental procedures (fillings, root canals, extractions, etc.)\n- Pricing & insurance\n- Booking appointments\n- Emergency information\n\nPlease try asking about one of these topics!";
}

export default function AIAssistant() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEnd = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const botResponse = getBotResponse(input);
      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
      setTyping(false);
    }, 800 + Math.random() * 1200);
  };

  return (
    <Layout>
      <Header title="AI Dental Assistant" />
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-sky-100 overflow-hidden max-w-3xl mx-auto" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="bg-sky-900 text-white p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-700 rounded-full flex items-center justify-center">
              <Bot size={20} />
            </div>
            <div>
              <div className="font-bold">DentAssist AI</div>
              <div className="text-xs text-sky-300">Always available to help</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 140px)' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
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
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about procedures, hours, booking..."
                className="flex-1 px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button onClick={handleSend}
                className="bg-sky-600 text-white px-4 py-3 rounded-xl hover:bg-sky-700 transition-colors">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
