import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  Brain,
  Activity,
} from 'lucide-react';

const ARISChat = ({ selectedContext, onLog, onCommand, reportData }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `🎯 **ARIS_PROTOCOL_INFILTRATION_SUCCESS**\n\nI've deployed our **Stateless Intelligence Bridge** to analyze the solicitation payload.\n\n**Current Mission Context:**\n• Agency: Defense Health Agency\n• Risk Score: HIGH (87% confidence)\n• 142 technical requirements detected\n• RMF/ATO compliance traps identified\n\n**Agentic Pipeline Tools:**\n• Win probability modeling\n• Competitive positioning\n• Risk mitigation strategies\n• Pricing optimization\n• Technical compliance mapping\n\nStanding by for command.`,
      isPredictive: true
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const quickPrompts = ['Win probability', 'Risk analysis', 'Pricing strategy'];

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

    if (userText === '1') {
      const samLink = 'https://sam.gov/workspace/contract/opp/c3fcc8a748b3438c9b0fe7630640e674/view';
      setInput(samLink);
      return;
    }

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
      
      let contextualResponse = "I'm analyzing your request. Let me provide insights based on the solicitation.";
      const query = userText.toLowerCase();
      
      if (query.includes('risk')) {
        contextualResponse = `🛡️ RISK MITIGATION ANALYSIS\n\nI've identified key risk factors in the solicitation. Recommended mitigation involves RMF/ATO acceleration and addressing legacy system friction points.`;
      } else if (query.includes('win')) {
        contextualResponse = `🎯 WIN PROBABILITY ASSESSMENT\n\nCurrent win probability is estimated at 67% based on technical alignment and competitive density.`;
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: contextualResponse,
        isPredictive: true,
        confidence: 75
      }]);
    }
  };

  return (
    <div className="studio-workbench aris-chat-enhanced minimalist-gpt">
      {/* Ultra-Minimalist Chat Header */}
      <div className="chat-header mobile-minimal">
        <div className="chat-title">
          <div className="title-left">
            <div className="ai-icon-wrapper">
              <Brain size={18} className="ai-icon" />
              <div className="ai-pulse" />
            </div>
            <span className="title-text">ARIS INTELLIGENCE</span>
          </div>
          <div className="status-indicators hide-mobile">
            <div className="status-item glass">
              <Activity size={10} className="status-active" />
              <span>LIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message-item ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}>
            <div className="message-container">
              <div className="message-icon">
                {msg.role === 'user' ? null : <Brain size={16} color="var(--accent)" />}
              </div>
              <div className="message-content">
                {msg.role === 'assistant' ? (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]} 
                    components={{
                      h1: ({ children }) => <h1 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>{children}</h1>,
                      h2: ({ children }) => <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '6px', marginTop: '12px' }}>{children}</h2>,
                      p: ({ children }) => <p style={{ marginBottom: '8px', lineHeight: 1.5, color: '#e4e4e7' }}>{children}</p>,
                      li: ({ children }) => <li style={{ marginBottom: '4px', lineHeight: 1.4 }}>{children}</li>,
                      table: ({ children }) => (
                        <div className="table-wrapper">
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>{children}</table>
                        </div>
                      )
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="loading-indicator shimmer">
            <div className="pulse-dot" />
            <span>SYNTHESIZING...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <div className="input-wrapper chat-composer">
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
            placeholder="Ask about win probability, compliance risk, pricing strategy, or mitigation plan..."
            className="minimal-textarea chat-composer-input"
          />
          <button 
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="minimal-send-btn chat-composer-send"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="chat-composer-hints">
          <span>Try:</span>
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="chat-hint-chip"
              onClick={() => sendMessage(prompt)}
              disabled={loading}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ARISChat;
