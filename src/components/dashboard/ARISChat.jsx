import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Sparkles, 
  Terminal, 
  Send, 
  Zap, 
  MessageSquare, 
  ShieldCheck, 
  FileText,
  CreditCard,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';



const ARISChat = ({ selectedContext, onLog, onCommand }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Workbench online. I'm ready to analyze your solicitation directives. Select a requirement from the Linter to begin our technical synthesis.",
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
          content: `CONTEXT_ATTACHED: ${selectedContext.id}\n\nUnderstood. I've locked onto this requirement. I'm seeing direct friction points with NIST 800-171 and FAR Part 15. I'm standing by to generate a "Ghost Draft" or execute a "Gap Audit" for the team.`,
        },
      ]);
    }
  }, [selectedContext]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleGhostWrite = async () => {
    if (!selectedContext) return;
    
    setLoading(true);
    onLog(`INIT_GHOSTWRITER_PIPELINE: ${selectedContext.id}`, 'info');
    
    // Simulate multi-stage machine reasoning logs
    setTimeout(() => onLog(`PARSING_DFARS_CLAUSE: Cross-referencing Section L instructions...`, 'info'), 300);
    setTimeout(() => onLog(`EVALUATING_TECHNICAL_ALIGNMENT: Analyzing Past Performance references...`, 'info'), 800);
    setTimeout(() => onLog(`SYNTHESIZING_NARRATIVE: Applying 'Cyber-First' win themes...`, 'success'), 1200);

    try {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `### 📝 SYNTHESIZED COMPLIANCE NARRATIVE\n\n**Requirement:** ${selectedContext.id}\n**Evaluation Subfactor:** Technical Approach\n\n"I've drafted this response to emphasize your FIPS 140-2 compliance. Our solution implements a validated encryption module for all data-at-rest within the Video Archive environment. This directly addresses the confidentiality requirements of ${selectedContext.id} by ensuring that all DHMS-managed video assets are encrypted at the block level before storage, utilizing AES-256 GCM as the primary cipher suite as specified in our NIST 800-171 self-assessment ($SPRS: 110/110)."\n\n**[!] MISSION CRITICAL:** I recommend a quick peer-review of the legacy DHS LDAP integration before we finalize this bid section.` 
        }]);
        setLoading(false);
        onLog(`GHOSTWRITER_OUTPUT_READY: ${selectedContext.id}`, 'success');
      }, 1500);
    } catch (err) {
      setLoading(false);
      onLog(`PIPELINE_ERROR: Failed to synthesize draft.`, 'error');
    }
  };

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    if (userText.toLowerCase() === 'run security-audit' && onCommand) {
      const handled = onCommand(userText);
      if (handled) {
        setInput('');
        return;
      }
    }

    if (userText.toLowerCase().includes('write') || userText.toLowerCase().includes('draft')) {
      handleGhostWrite();
      setInput('');
      return;
    }

    const userMsg = { role: 'user', content: userText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    onLog('USER_CMD_DISPATCHED: Processing intent...', 'info');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: messages.slice(-8)
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'CMD_EXECUTION_FAILED');
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message 
      }]);
      setLoading(false);
      onLog('CMD_EXECUTION_COMPLETE', 'success');
    } catch (err) {
      setLoading(false);
      onLog(`ERROR: ${err.message}`, 'error');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `PIPELINE_ERROR: ${err.message}` 
      }]);
    }
  };

  return (
    <div className="studio-workbench" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#09090b' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #1a1a1a', background: '#0c0c0e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={12} color="#71717a" />
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: '#a1a1aa' }}>INTELLIGENCE WORKBENCH</span>
        </div>
        <div style={{ fontSize: '9px', background: '#18181b', color: '#52525b', padding: '2px 6px', borderRadius: '3px', border: '1px solid #27272a', fontFamily: 'Space Mono' }}>
          {selectedContext ? selectedContext.id : 'IDLE'}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '1px', background: msg.role === 'user' ? '#3b82f6' : '#27272a' }} />
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#52525b', letterSpacing: '0.1em' }}>
                {msg.role === 'user' ? 'ME' : 'ARIS'}
              </span>
            </div>
            <div className={`prose prose-invert max-w-none font-inter ${msg.role === 'user' ? 'text-zinc-400' : 'text-zinc-300'}`} style={{ paddingLeft: '24px', fontSize: '13px', lineHeight: '1.6' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            </div>
            {msg.role === 'assistant' && (
              <div style={{ 
                paddingLeft: '24px', 
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: loading && i === messages.length - 1 ? 0 : 0.4,
                transition: 'opacity 0.3s'
              }}>
                <div style={{ height: '1px', width: '12px', background: '#27272a' }} />
                <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.1em', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={8} /> SYNTHESIS_COMPLETE
                </span>
              </div>
            )}
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

      <div style={{ padding: '16px', borderTop: '1px solid #1a1a1a', background: '#09090b' }}>
        {selectedContext && (
          <div style={{ marginBottom: '16px' }}>
             <button 
              onClick={handleGhostWrite}
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
                marginBottom: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#2563eb'}
              onMouseOut={(e) => e.target.style.background = '#1d4ed8'}
            >
              <Zap size={12} fill="white" />
              EXECUTE RESPONSE SYNTHESIS
            </button>

          </div>
        )}
        <div style={{ position: 'relative' }}>
          <textarea 
            ref={inputRef}
            placeholder="Enter Mission Directive... (e.g. 'Synthesize technical response')"
            style={{ 
              width: '100%', 
              background: '#0c0c0e', 
              border: '1px solid #1a1a1a', 
              borderRadius: '4px', 
              color: '#d4d4d8', 
              fontSize: '12px', 
              padding: '12px 40px 12px 12px',
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
            style={{ position: 'absolute', right: '12px', top: '12px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <Send size={14} color="#52525b" />
          </button>
        </div>
        <div style={{ fontSize: '9px', color: '#3f3f46', marginTop: '10px', textAlign: 'center', letterSpacing: '0.05em' }}>
          PRESS ENTER TO DISPATCH COMMAND • CMD+K TO GHOST WRITE
        </div>
      </div>
    </div>
  );
};

export default ARISChat;
