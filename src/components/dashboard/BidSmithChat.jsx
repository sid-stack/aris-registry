import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  Brain,
  Activity,
  Loader2
} from 'lucide-react';

const BidSmithChat = ({ selectedContext, onLog, onCommand, reportData }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `🎯 **BIDSMITH_SESSION_INITIALIZED**\n\nI've deployed our **Stateless Intelligence Bridge** to analyze the solicitation payload.\n\n**Current Mission Context:**\n• Agency: Defense Health Agency\n• Risk Score: HIGH (87% confidence)\n• 142 technical requirements detected\n• RMF/ATO compliance traps identified\n\n**Agentic Pipeline Tools:**\n• Win probability modeling\n• Competitive positioning\n• Risk mitigation strategies\n• Pricing optimization\n• Technical compliance mapping\n\nStanding by for command.`,
      isPredictive: true
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const quickPrompts = ['Win probability', 'Risk analysis', 'Draft response'];

  useEffect(() => {
    if (selectedContext) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `CONTEXT_ATTACHED: ${selectedContext.id || selectedContext.requirement}\n\nUnderstood. I've locked onto this requirement. Standing by to generate a "Ghost Draft" or execute a "Gap Audit".`,
        },
      ]);
    }
  }, [selectedContext]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    const userMsg = { role: 'user', content: userText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/govcon/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sb-token') || localStorage.getItem('aris_authenticated')}`
        },
        body: JSON.stringify({
          message: userText,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          context: selectedContext
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'NETWORK_ERROR');

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ **ERROR**: ${err.message}. Please check your connection or access key.` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bidsmith-panel bidsmith-chat-enhanced minimalist-gpt">
      <div className="chat-header mobile-minimal">
        <div className="chat-title">
          <div className="title-left">
            <div className="ai-icon-wrapper">
              <Brain size={18} className="ai-icon" />
              <div className="ai-pulse" />
            </div>
            <span className="title-text">BIDSMITH INTELLIGENCE</span>
          </div>
          <div className="status-indicators hide-mobile">
            <div className="status-item glass">
              <Activity size={10} className="status-active" />
              <span>LIVE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`message-item ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`} style={{ marginBottom: '16px' }}>
            <div className="message-container" style={{ display: 'flex', gap: '12px', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role !== 'user' && <Brain size={16} color="#3b82f6" style={{ marginTop: '4px' }} />}
              <div className="message-content" style={{ 
                background: msg.role === 'user' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.05)',
                maxWidth: '85%',
                fontSize: '14px',
                color: '#e2e8f0',
                lineHeight: 1.5
              }}>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="loading-indicator shimmer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', color: '#94a3b8', fontSize: '13px' }}>
            <Loader2 size={14} className="animate-spin" />
            <span>SYNTHESIZING...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area" style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="input-wrapper chat-composer" style={{ position: 'relative' }}>
          <textarea 
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Analyze win probability or compliance risk..."
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '12px 48px 12px 12px',
              color: '#fff',
              fontSize: '14px',
              minHeight: '44px',
              resize: 'none',
              outline: 'none'
            }}
          />
          <button 
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              position: 'absolute',
              right: '8px',
              top: '8px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              padding: '6px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <Send size={16} />
          </button>
        </div>
        <div className="chat-composer-hints" style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              className="chat-hint-chip"
              onClick={() => sendMessage(prompt)}
              disabled={loading}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '4px 10px',
                borderRadius: '44px',
                color: '#94a3b8',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BidSmithChat;
