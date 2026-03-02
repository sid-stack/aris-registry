import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

export default function Audit() {
  const [proposalData, setProposalData] = useState(null);
  const [complianceMatrix, setComplianceMatrix] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (pdfUrl) => {
    setLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfUrl }),
      });
      const data = await response.json();
      
      // Parse Part 1: JSON Matrix
      const jsonMatch = data.output.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        setComplianceMatrix(JSON.parse(jsonMatch[1]));
      }
      
      // Parse Part 2: Markdown Draft
      const markdownMatch = data.output.match(/PART 2:[\s\S]*?\n([\s\S]*)/);
      setProposalData(markdownMatch ? markdownMatch[1] : data.output);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-white">Aris Registry</h1>
            <p className="text-slate-400 text-sm mt-1">Federal Proposal Auditor</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            New RFP
          </button>
        </div>

        {/* PART 1: COMPLIANCE MATRIX */}
        {complianceMatrix && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              Compliance Matrix (7 Pillars)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Solicitation ID */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Solicitation ID</p>
                <p className="text-white font-semibold break-words">{complianceMatrix.solicitation_id || 'N/A'}</p>
              </div>

              {/* NAICS */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">NAICS Code</p>
                <p className="text-white font-semibold">{complianceMatrix.naics || 'N/A'}</p>
              </div>

              {/* Response Deadline */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Response Deadline</p>
                <p className="text-white font-semibold break-words">{complianceMatrix.response_deadline || 'N/A'}</p>
              </div>

              {/* Bonding Required */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Bonding Required</p>
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold">{complianceMatrix.bonding_required?.yes_no || 'No'}</p>
                  {complianceMatrix.bonding_required?.amount && (
                    <span className="text-slate-400 text-sm break-words">({complianceMatrix.bonding_required.amount})</span>
                  )}
                </div>
              </div>

              {/* Past Performance */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Past Performance Req.</p>
                <p className="text-white font-semibold text-sm break-words">{complianceMatrix.past_performance_requirements || 'None specified'}</p>
              </div>

              {/* Risk Score */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Risk Score</p>
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold text-lg">{complianceMatrix.risk_score || '5'}/10</p>
                  <TrendingUp className={`w-4 h-4 ${(complianceMatrix.risk_score || 5) > 6 ? 'text-red-500' : 'text-yellow-500'}`} />
                </div>
              </div>

              {/* Key Disqualifiers */}
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Key Disqualifiers</p>
                {Array.isArray(complianceMatrix.key_disqualifiers) ? (
                  <ul className="space-y-1">
                    {complianceMatrix.key_disqualifiers.map((d, i) => (
                      <li key={i} className="text-white text-sm flex gap-2">
                        <span className="text-red-500 flex-shrink-0">•</span>
                        <span className="break-words">{d}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white text-sm break-words">{complianceMatrix.key_disqualifiers || 'None identified'}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PART 2: PROPOSAL DRAFT - SURGICAL FIX APPLIED */}
        {proposalData && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-blue-500" />
              Federal Proposal Draft
            </h2>
            
            {/* SURGICAL FIX: overflow-hidden + break-words + whitespace-pre-wrap */}
            <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-8 overflow-hidden">
              <div className="max-w-none break-words whitespace-pre-wrap overflow-x-hidden">
                <ReactMarkdown
                  components={{
                    h1: ({ ...props }) => <h1 className="text-2xl font-bold text-white mt-6 mb-4" {...props} />,
                    h2: ({ ...props }) => <h2 className="text-xl font-bold text-white mt-5 mb-3" {...props} />,
                    h3: ({ ...props }) => <h3 className="text-lg font-semibold text-slate-300 mt-4 mb-2" {...props} />,
                    p: ({ ...props }) => <p className="text-slate-300 mb-3 leading-relaxed break-words" {...props} />,
                    ul: ({ ...props }) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
                    ol: ({ ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
                    li: ({ ...props }) => <li className="text-slate-300 break-words" {...props} />,
                    code: ({ inline, ...props }) => 
                      inline ? 
                        <code className="bg-slate-800 text-slate-200 px-2 py-1 rounded text-sm break-words" {...props} /> :
                        <code className="bg-slate-800 text-slate-200 p-4 rounded-lg block mb-4 overflow-x-auto break-words" {...props} />,
                    blockquote: ({ ...props }) => <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 text-slate-400 italic break-words" {...props} />,
                  }}
                >
                  {proposalData}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin">
              <div className="w-8 h-8 border-4 border-slate-800 border-t-blue-600 rounded-full"></div>
            </div>
            <p className="text-slate-400 ml-4">Analyzing proposal...</p>
          </div>
        )}
      </div>
    </div>
  );
}
