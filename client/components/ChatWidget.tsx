
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Minus, Sparkles } from 'lucide-react';
import { apiFetch, getApiErrorMessage } from '../services/api';
import { Message } from '../types';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadSession = React.useCallback(async (id: string) => {
    const data = await apiFetch<{ session: { _id: string; messages: Array<{ _id: string; role: 'user' | 'assistant'; content: string; createdAt: string }>; updatedAt: string } }>(
      `/api/chat/sessions/${id}`
    );
    const mapped = data.session.messages.map((msg, index) => ({
      id: msg._id || `${data.session._id}-${index}`,
      role: msg.role,
      content: msg.content,
      timestamp: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now(),
    }));
    setMessages(mapped);
    setSessionId(data.session._id);
    localStorage.setItem('mastewal_chat_session', data.session._id);
  }, []);

  const loadSessions = React.useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch<{ sessions: Array<{ _id: string }> }>('/api/chat/sessions');
      const storedSession = localStorage.getItem('mastewal_chat_session');
      const sessionToLoad = storedSession && data.sessions.some((session) => session._id === storedSession)
        ? storedSession
        : data.sessions[0]?._id || null;
      if (sessionToLoad) {
        await loadSession(sessionToLoad);
      } else {
        setMessages([]);
        setSessionId(null);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load chat history.'));
    }
  }, [loadSession]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen, loadSessions]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const data = await apiFetch<{ sessionId: string; answer: string }>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: input, sessionId }),
      });
      setSessionId(data.sessionId);
      localStorage.setItem('mastewal_chat_session', data.sessionId);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: data.answer,
          timestamp: Date.now(),
        },
      ]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send message.'));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <div className="w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-stone-800 text-stone-100 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold font-sans leading-none">Bookstore Assistant</h3>
                <span className="text-[10px] text-stone-400 font-sans">Online • Knowledge Base Connected</span>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-stone-700 rounded transition-colors">
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 font-sans bg-stone-50">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <p className="text-stone-400 text-sm">Welcome to mastewal!</p>
                <p className="text-stone-500 text-xs italic">Ask me about our inventory, store policies, or upcoming events.</p>
              </div>
            )}
            {error && (
              <div className="text-center text-xs font-sans text-red-500 bg-white border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-stone-800 text-stone-50 rounded-tr-none' 
                      : 'bg-white text-stone-800 border border-stone-200 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-none px-4 py-2 flex gap-1 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t border-stone-200 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 bg-stone-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-stone-800 outline-none transition-shadow"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2 bg-stone-800 text-stone-100 rounded-full hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-stone-800 text-white p-4 rounded-full shadow-xl hover:scale-105 transition-all flex items-center gap-2 group"
        >
            <span className="text-sm font-medium pl-1 max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
            Ask mastewal
          </span>
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
