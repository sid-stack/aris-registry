import React, { useState, useRef, useEffect } from 'react';

const SUGGESTED_QUESTIONS = [
  "What are the bid-killer risks?",
  "How do I fix the ATO issue?",
  "What does conditional bid mean?",
  "Is our SPRS score required?",
];

const TypingDots = () => (
  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '10px 14px' }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: '#4a7cff',
        animation: `arisTypingPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
      }} />
    ))}
  </div>
);

const ChatMessage = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '12px',
    }}>
      {!isUser && (
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: 800, color: '#fff',
          flexShrink: 0, marginRight: '8px', marginTop: '2px',
          fontFamily: 'monospace', letterSpacing: '-0.5px',
        }}>A</div>
      )}
      <div style={{
        maxWidth: '80%',
        background: isUser
          ? 'linear-gradient(135deg, #1d4ed8, #2563eb)'
          : '#18181b',
        color: isUser ? '#fff' : '#e4e4e7',
        padding: '10px 14px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
        fontSize: '12.5px',
        lineHeight: 1.6,
        border: isUser ? 'none' : '1px solid #27272a',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.content}
      </div>
    </div>
  );
};

const ARISChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "ARIS online. I've analyzed the DHA Video Imaging Archive solicitation.\n\nRisk Score: 87/100 — HIGH. Two bid-killer flags detected.\n\nWhat do you need to know?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    const userMsg = { role: 'user', content: userText };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);
    setHasError(false);

    try {
      const res = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: updatedHistory.filter(m => m.role !== 'assistant' || updatedHistory.indexOf(m) > 0),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setHasError(true);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Connection failed. Make sure the ARIS API server is running on port 8080.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{`
        @keyframes arisTypingPulse {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes arisChatSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes arisBubblePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74, 124, 255, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(74, 124, 255, 0); }
        }
        .aris-chat-input::placeholder { color: #52525b; }
        .aris-chat-input:focus { outline: none; border-color: #4a7cff !important; }
        .aris-suggested-btn:hover { background: #27272a !important; border-color: #4a7cff !important; color: #e4e4e7 !important; }
        .aris-send-btn:hover:not(:disabled) { background: #2563eb !important; }
        .aris-close-btn:hover { background: #27272a !important; }
      `}</style>

      {/* Floating Bubble */}
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: isOpen ? 'none' : 'arisBubblePulse 2.5s ease-in-out infinite',
          boxShadow: '0 4px 20px rgba(74, 124, 255, 0.4)',
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          fontSize: '20px',
        }}
        aria-label="Open ARIS Chat"
      >
        {isOpen ? '✕' : '⚡'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '92px',
          right: '28px',
          width: '360px',
          height: '500px',
          background: '#09090b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9998,
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          animation: 'arisChatSlideIn 0.25s ease',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid #27272a',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#0c0c0f',
            flexShrink: 0,
          }}>
            <div style={{
              width: '32px', height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px',
            }}>⚡</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#e4e4e7', letterSpacing: '0.02em' }}>
                ARIS Intelligence
              </div>
              <div style={{ fontSize: '10px', color: '#4a7cff', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
                ● ONLINE · DHA AUDIT LOADED
              </div>
            </div>
            <button
              className="aris-close-btn"
              onClick={() => setIsOpen(false)}
              style={{
                marginLeft: 'auto', background: 'transparent', border: 'none',
                color: '#71717a', cursor: 'pointer', fontSize: '16px',
                width: '28px', height: '28px', borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >✕</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {messages.map((msg, i) => (
              <ChatMessage key={i} msg={msg} />
            ))}
            {loading && (
              <div style={{ display: 'flex' }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 800, color: '#fff',
                  flexShrink: 0, marginRight: '8px', fontFamily: 'monospace',
                }}>A</div>
                <div style={{
                  background: '#18181b', border: '1px solid #27272a',
                  borderRadius: '4px 16px 16px 16px',
                }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested Questions — only show when no conversation yet */}
          {messages.length === 1 && (
            <div style={{ padding: '0 16px 10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  className="aris-suggested-btn"
                  onClick={() => sendMessage(q)}
                  style={{
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '20px',
                    color: '#a1a1aa',
                    fontSize: '11px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >{q}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #27272a',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-end',
            flexShrink: 0,
            background: '#0c0c0f',
          }}>
            <textarea
              ref={inputRef}
              className="aris-chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this RFP..."
              rows={1}
              style={{
                flex: 1,
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '10px',
                color: '#e4e4e7',
                fontSize: '12.5px',
                padding: '9px 12px',
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                transition: 'border-color 0.15s',
                maxHeight: '100px',
                overflowY: 'auto',
              }}
            />
            <button
              className="aris-send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                background: '#1d4ed8',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                width: '36px',
                height: '36px',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                opacity: loading || !input.trim() ? 0.5 : 1,
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
              aria-label="Send"
            >➤</button>
          </div>
        </div>
      )}
    </>
  );
};

export default ARISChat;
