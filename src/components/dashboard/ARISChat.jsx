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
          content: `Context updated: Addressing ${selectedContext.id} (${selectedContext.type})\n\nRequirement: "${selectedContext.text}"\n\nHow would you like to proceed? I can "Ghost Write" a compliance response or perform a "Gap Analysis" against this clause.`,
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
      const res = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          context: selectedContext,
          history: messages,
        }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Drafting engine offline. Using local synthesis: I recommend highlighting our 'Cyber-First' framework as primary evidence for this requirement.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="studio-workbench" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .workbench-header {
          padding: 16px;
          border-bottom: 1px solid #27272a;
          background: #0c0c0f;
        }
        .workbench-title {
          font-size: 11px;
          font-weight: 800;
          color: #71717a;
          letter-spacing: 0.1em;
          margin-bottom: 4px;
        }
        .workbench-status {
          font-size: 10px;
          color: #3b82f6;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3b82f6;
          box-shadow: 0 0 8px #3b82f6;
        }
        .workbench-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .workbench-input-area {
          padding: 16px;
          border-top: 1px solid #27272a;
          background: #0c0c0f;
        }
        .ghost-write-btn {
          width: 100%;
          background: linear-gradient(135deg, #1d4ed8, #7c3aed);
          border: none;
          color: white;
          padding: 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 12px;
          cursor: pointer;
          transition: transform 0.1s;
        }
        .ghost-write-btn:active { transform: scale(0.98); }
        .workbench-textarea {
          width: 100%;
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 8px;
          color: #e4e4e7;
          font-size: 12px;
          padding: 10px;
          resize: none;
          outline: none;
        }
        .workbench-textarea:focus { border-color: #3b82f6; }
      `}</style>

      <div className="workbench-header">
        <div className="workbench-title">INTELLIGENCE WORKBENCH</div>
        <div className="workbench-status">
          <div className="status-dot" />
          {selectedContext ? `AUDITING: ${selectedContext.id}` : 'READY FOR CONTEXT'}
        </div>
      </div>

      <div className="workbench-messages">
        {messages.map((msg, i) => (
          <div key={i} style={{ 
            fontSize: '12px', 
            lineHeight: '1.6',
            color: msg.role === 'user' ? '#a1a1aa' : '#e4e4e7',
            background: msg.role === 'user' ? 'transparent' : '#18181b',
            padding: msg.role === 'user' ? '0' : '12px',
            borderRadius: '8px',
            border: msg.role === 'user' ? 'none' : '1px solid #27272a',
            whiteSpace: 'pre-wrap'
          }}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: '#71717a', marginBottom: '4px' }}>
              {msg.role === 'user' ? 'ME' : 'ARIS'}
            </div>
            {msg.content}
          </div>
        ))}
        {loading && <div style={{ fontSize: '10px', color: '#71717a' }}>Synthesizing compliance draft...</div>}
        <div ref={bottomRef} />
      </div>

      <div className="workbench-input-area">
        {selectedContext && (
          <button className="ghost-write-btn" onClick={() => sendMessage("Generate a 'Ghost Draft' response for this requirement based on our boilerplate.")}>
            ⚡ EXECUTE GHOST WRITER (CMD+K)
          </button>
        )}
        <textarea 
          ref={inputRef}
          className="workbench-textarea"
          placeholder="Command ARIS..."
          rows={3}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <div style={{ fontSize: '9px', color: '#52525b', marginTop: '8px', textAlign: 'center' }}>
          PRESS ENTER TO SEND • SHIFT+ENTER FOR NEW LINE
        </div>
      </div>
    </div>
  );
};

export default ARISChat;
