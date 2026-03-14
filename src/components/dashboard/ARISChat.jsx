import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Terminal, Send, Zap, MessageSquare } from 'lucide-react';

const ARISChat = ({ selectedContext }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Workbench initialized. Select a requirement from the Linter to begin automated drafting or compliance verification.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (selectedContext) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `SESSION_CONTEXT_ATTACHED: ${selectedContext.id}\n\nREQUIREMENT:\n"${selectedContext.text}"\n\nI have cross-referenced this against NIST 800-171 and FAR Part 15. I can generate a "Ghost Draft" or perform a "Gap Audit".`,
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
      // Mocked for Demo Strength
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `PROPOSAL_DRAFT_SYSTEM_X:\n\nBased on your past performance on DHA Contract #8172, I recommend the following response:\n\n"Our solution implements a FIPS 140-2 validated encryption module for all data-at-rest within the Video Archive environment, meeting the specific technical requirements of ${selectedContext?.id || 'the clause'}..."` 
        }]);
        setLoading(false);
      }, 1500);
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <div className="studio-workbench" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#09090b' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #1a1a1a', background: '#0c0c0e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={12} color="#71717a" />
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: '#a1a1aa' }}>WORKBENCH</span>
        </div>
        <div style={{ fontSize: '9px', background: '#18181b', color: '#52525b', padding: '2px 6px', borderRadius: '3px', border: '1px solid #27272a', fontFamily: 'Space Mono' }}>
          {selectedContext ? selectedContext.id : 'IDLE'}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '1px', background: msg.role === 'user' ? '#1d4ed8' : '#3f3f46' }} />
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#52525b', letterSpacing: '0.1em' }}>
                {msg.role === 'user' ? 'REQUESTOR' : 'ARIS_AGENT'}
              </span>
            </div>
            <div style={{ 
              fontSize: '12px', 
              lineHeight: '1.6',
              color: msg.role === 'user' ? '#71717a' : '#d4d4d8',
              paddingLeft: '24px',
              fontFamily: msg.role === 'assistant' ? 'Inter, sans-serif' : 'Inter, sans-serif',
              whiteSpace: 'pre-wrap'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '24px' }}>
            <div className="animate-pulse" style={{ width: '4px', height: '4px', background: '#3b82f6', borderRadius: '50%' }} />
            <span style={{ fontSize: '10px', color: '#52525b', fontWeight: 600 }}>SYNTHESIZING...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '16px', borderTop: '1px solid #1a1a1a', background: '#0c0c0e' }}>
        {selectedContext && (
          <button 
            onClick={() => sendMessage("Generate a high-scoring technical response for this requirement.")}
            style={{ 
              width: '100%', 
              background: '#1d4ed8', 
              border: 'none', 
              color: 'white', 
              padding: '10px', 
              borderRadius: '4px', 
              fontSize: '10px', 
              fontWeight: 700, 
              letterSpacing: '0.05em',
              marginBottom: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Zap size={12} fill="white" />
            EXECUTE GHOST WRITER
          </button>
        )}
        <div style={{ position: 'relative' }}>
          <textarea 
            ref={inputRef}
            placeholder="Command ARIS..."
            style={{ 
              width: '100%', 
              background: '#09090b', 
              border: '1px solid #1a1a1a', 
              borderRadius: '4px', 
              color: '#d4d4d8', 
              fontSize: '12px', 
              padding: '12px', 
              paddingRight: '40px',
              resize: 'none', 
              outline: 'none',
              height: '80px',
              fontFamily: 'inherit'
            }}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button 
            onClick={() => sendMessage()}
            style={{ position: 'absolute', right: '12px', bottom: '12px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <Send size={14} color="#52525b" />
          </button>
        </div>
        <div style={{ fontSize: '9px', color: '#3f3f46', marginTop: '10px', textAlign: 'center', letterSpacing: '0.05em' }}>
          PRESS ENTER TO DISPATCH COMMAND
        </div>
      </div>
    </div>
  );
};

export default ARISChat;
