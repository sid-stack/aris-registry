import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  Send, 
  Plus, 
  Search, 
  Download, 
  Shield, 
  Cpu,
  Loader2,
  ChevronRight,
  User,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { govAI } from './lib/gemini';
import { ComplianceRequirement, Message, View } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [view, setView] = useState<View>('workspace');
  const [rfpText, setRfpText] = useState('');
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [proposal, setProposal] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Welcome to GovCon AI. I'm your specialized assistant for government contracting. How can I help you with your RFP today?" }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGenerateMatrix = async () => {
    if (!rfpText) return;
    setIsGenerating(true);
    try {
      const matrix = await govAI.generateComplianceMatrix(rfpText);
      setRequirements(matrix);
      setView('compliance');
      setMessages(prev => [...prev, { role: 'model', text: "I've analyzed the RFP and generated a preliminary compliance matrix. You can review it in the Compliance tab." }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDraftProposal = async () => {
    setIsGenerating(true);
    try {
      const draft = await govAI.draftExecutiveSummary({
        companyInfo: "Small, woman-owned business (WOSB) specializing in cloud migration services.",
        rfpHighlights: rfpText || "Cloud migration RFP emphasizing cost-effectiveness and minimal disruption."
      });
      setProposal(draft);
      setView('proposal');
      setMessages(prev => [...prev, { role: 'model', text: "I've drafted an Executive Summary based on your requirements. You can edit it in the Proposal tab." }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user' as const, text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsGenerating(true);

    try {
      const response = await govAI.chat(
        [...messages, userMsg],
        "You are GovCon AI, a specialized assistant for government contracting. You help with RFP analysis, compliance matrices, and proposal drafting. Be professional, accurate, and focus on FAR/DFARS compliance where relevant."
      );
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="font-bold text-xl tracking-tight">GovCon AI</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setView('workspace')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              view === 'workspace' ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Workspace</span>
          </button>
          <button 
            onClick={() => setView('compliance')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              view === 'compliance' ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <CheckSquare className="w-5 h-5" />
            <span>Compliance</span>
          </button>
          <button 
            onClick={() => setView('proposal')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              view === 'proposal' ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <FileText className="w-5 h-5" />
            <span>Proposal</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-2 text-slate-400 text-sm">
            <Cpu className="w-4 h-4" />
            <span>Gemini 3.1 Pro</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <span>Projects</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium text-slate-900">Cloud Migration RFP</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              SP
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Editor/Grid Area */}
          <div className="flex-1 overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              {view === 'workspace' && (
                <motion.div 
                  key="workspace"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-4xl mx-auto space-y-6"
                >
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <h2 className="font-semibold text-lg">RFP Document Input</h2>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleGenerateMatrix}
                          disabled={!rfpText || isGenerating}
                          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                          Generate Matrix
                        </button>
                        <button 
                          onClick={handleDraftProposal}
                          disabled={isGenerating}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                          Draft Proposal
                        </button>
                      </div>
                    </div>
                    <textarea 
                      value={rfpText}
                      onChange={(e) => setRfpText(e.target.value)}
                      placeholder="Paste RFP text here (e.g., Section L, Section M, Statement of Work)..."
                      className="w-full h-[600px] p-6 focus:outline-none resize-none text-slate-700 leading-relaxed"
                    />
                  </div>
                </motion.div>
              )}

              {view === 'compliance' && (
                <motion.div 
                  key="compliance"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Compliance Matrix</h2>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium">
                      <Plus className="w-4 h-4" />
                      Add Requirement
                    </button>
                  </div>
                  
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">ID</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Requirement</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Source</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Strategy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {requirements.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                No requirements generated yet. Paste RFP text in the Workspace to begin.
                              </td>
                            </tr>
                          ) : (
                            requirements.map((req) => (
                              <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs text-slate-500">{req.id}</td>
                                <td className="px-6 py-4 text-sm text-slate-700">{req.requirement}</td>
                                <td className="px-6 py-4 text-xs font-medium text-slate-600">{req.source}</td>
                                <td className="px-6 py-4">
                                  <select 
                                    value={req.status}
                                    className="text-xs font-medium px-2 py-1 rounded border border-slate-200 bg-white"
                                    onChange={(e) => {
                                      const newReqs = requirements.map(r => r.id === req.id ? { ...r, status: e.target.value as any } : r);
                                      setRequirements(newReqs);
                                    }}
                                  >
                                    <option value="unknown">Unknown</option>
                                    <option value="Meets">Meets</option>
                                    <option value="Partially Meets">Partially Meets</option>
                                    <option value="Does Not Meet">Does Not Meet</option>
                                    <option value="Not Applicable">N/A</option>
                                  </select>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500 italic">{req.strategy}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {view === 'proposal' && (
                <motion.div 
                  key="proposal"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-4xl mx-auto space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Proposal Draft</h2>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Preview</button>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Finalize</button>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 min-h-[800px]">
                    <div className="markdown-body prose prose-slate max-w-none">
                      {proposal ? (
                        <ReactMarkdown>{proposal}</ReactMarkdown>
                      ) : (
                        <div className="text-slate-400 italic">No proposal draft generated yet. Use the AI assistant or Workspace to start drafting.</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chat Panel */}
          <aside className="w-96 bg-white border-l border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <Bot className="w-5 h-5 text-blue-600" />
                <span>AI Assistant</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Live</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={cn(
                  "flex gap-3",
                  msg.role === 'user' ? "flex-row-reverse" : ""
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    msg.role === 'user' ? "bg-slate-900" : "bg-blue-100"
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className={cn(
                    "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none"
                  )}>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  </div>
                  <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-slate-200">
              <div className="relative">
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask anything about the RFP..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none h-24"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isGenerating}
                  className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                AI can make mistakes. Verify critical compliance data.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
