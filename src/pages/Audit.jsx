import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { AlertCircle, CheckCircle2, FileText, Upload, Link, AlertTriangle } from 'lucide-react';

const KEYWORD_SCORES = {
  solicitation: 10, rfp: 10, pws: 10, sow: 10, combined: 10,
  rfq: 8, ifb: 8, amendment: 4, attachment: 2, exhibit: 2,
};

function scoreFiles(files) {
  return Array.from(files).map(file => {
    const n = file.name.toLowerCase().replace(/[^a-z0-9]/g, ' ');
    let score = 0; const matched = [];
    for (const [kw, pts] of Object.entries(KEYWORD_SCORES))
      if (n.includes(kw)) { score += pts; matched.push(kw.toUpperCase()); }
    return { file, score, matched };
  }).sort((a, b) => b.score - a.score);
}

function formatBytes(b) {
  return b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;
}

const LOADING_STEPS = [
  "Connecting to SAM.gov...",
  "Ranking attachments...",
  "Running compliance audit...",
  "Validating requirements...",
];

function useLoadingCycle(active) {
  const [step, setStep] = useState(0);
  const ref = useRef();
  useEffect(() => {
    if (!active) { setStep(0); return; }
    ref.current = setInterval(() => setStep(s => Math.min(s + 1, LOADING_STEPS.length - 1)), 6000);
    return () => clearInterval(ref.current);
  }, [active]);
  return LOADING_STEPS[step];
}

function RiskBanner({ compliance }) {
  if (!compliance) return null;
  const score = compliance.risk_score_1_to_10;
  const disqualifiers = Array.isArray(compliance.technical_disqualifiers) &&
    compliance.technical_disqualifiers[0] !== 'NOT FOUND';
  if (disqualifiers || score >= 8)
    return (
      <div className="flex items-center gap-3 p-4 mb-6 bg-red-950 border border-red-700 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
        <p className="text-red-300 font-mono font-bold text-sm">⚠ Potential Disqualifier Identified — Review Before Bidding</p>
      </div>
    );
  if (score >= 5)
    return (
      <div className="flex items-center gap-3 p-4 mb-6 bg-orange-950 border border-orange-800 rounded-lg">
        <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
        <p className="text-orange-300 font-mono font-bold text-sm">⚠ High Risk — Missing data on critical pillars</p>
      </div>
    );
  return (
    <div className="flex items-center gap-3 p-4 mb-6 bg-green-950 border border-green-800 rounded-lg">
      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
      <p className="text-green-300 font-mono font-bold text-sm">✓ No disqualifiers detected — Eligible to bid</p>
    </div>
  );
}

function PillarGrid({ c }) {
  if (!c) return null;
  const riskColor = s => s <= 3 ? 'text-green-400' : s <= 6 ? 'text-orange-400' : 'text-red-400';
  const riskBg   = s => s <= 3 ? 'bg-green-950 border-green-800' : s <= 6 ? 'bg-orange-950 border-orange-800' : 'bg-red-950 border-red-800';
  const notFound = v => !v || v === 'NOT FOUND';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">

      {/* Solicitation ID */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <p className="text-slate-500 text-xs uppercase tracking-widest font-mono mb-1">Solicitation ID</p>
        <p className={`font-semibold font-mono text-sm break-words ${notFound(c.solicitation_id) ? 'text-slate-600 italic' : 'text-white'}`}>
          {c.solicitation_id || 'NOT FOUND'}
        </p>
      </div>

      {/* Deadline */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <p className="text-slate-500 text-xs uppercase tracking-widest font-mono mb-1">Deadline Date</p>
        <p className={`font-semibold font-mono text-sm ${notFound(c.deadline_date) ? 'text-slate-600 italic' : 'text-white'}`}>
          {c.deadline_date || 'NOT FOUND'}
        </p>
      </div>

      {/* Set-Aside */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <p className="text-slate-500 text-xs uppercase tracking-widest font-mono mb-1">Set-Aside Type</p>
        <p className={`font-semibold font-mono text-sm ${notFound(c.set_aside_type) ? 'text-slate-600 italic' : 'text-white'}`}>
          {c.set_aside_type || 'NOT FOUND'}
        </p>
      </div>

      {/* Risk Score */}
      <div className={`border rounded-lg p-4 flex flex-col items-center justify-center ${riskBg(c.risk_score_1_to_10 || 0)}`}>
        <p className="text-slate-500 text-xs uppercase tracking-widest font-mono mb-1">Risk Score</p>
        <div className="flex items-baseline gap-1">
          <p className={`text-4xl font-black font-mono ${riskColor(c.risk_score_1_to_10 || 0)}`}>
            {c.risk_score_1_to_10 ?? '–'}
          </p>
          <p className="text-slate-500 font-mono">/10</p>
        </div>
        <p className={`text-xs font-bold font-mono tracking-widest mt-1 ${riskColor(c.risk_score_1_to_10 || 0)}`}>
          {(c.risk_score_1_to_10||0) <= 3 ? 'LOW' : (c.risk_score_1_to_10||0) <= 6 ? 'MEDIUM' : 'HIGH'}
        </p>
      </div>

      {/* Bonding */}
      <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <p className="text-slate-500 text-xs uppercase tracking-widest font-mono mb-3">Bonding Requirements</p>
        <div className="grid grid-cols-3 gap-3">
          {[['Bid Bond', c.bonding_reqs?.bid_bond], ['Performance Bond', c.bonding_reqs?.performance_bond], ['Payment Bond', c.bonding_reqs?.payment_bond]].map(([label, val]) => (
            <div key={label} className={`rounded p-3 border ${notFound(val) ? 'bg-slate-950 border-slate-800' : 'bg-blue-950 border-blue-800'}`}>
              <p className="text-slate-600 text-xs font-mono uppercase mb-1">{label}</p>
              <p className={`text-sm font-mono font-semibold ${notFound(val) ? 'text-slate-700 italic' : 'text-blue-300'}`}>
                {val || 'NOT FOUND'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Past Performance */}
      <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <p className="text-slate-500 text-xs uppercase tracking-widest font-mono mb-1">Past Performance Threshold</p>
        <p className={`text-sm font-mono break-words ${notFound(c.past_performance_threshold) ? 'text-slate-600 italic' : 'text-white'}`}>
          {c.past_performance_threshold || 'NOT FOUND'}
        </p>
      </div>

      {/* Disqualifiers */}
      <div className={`md:col-span-2 rounded-lg p-4 border ${
        Array.isArray(c.technical_disqualifiers) && c.technical_disqualifiers[0] !== 'NOT FOUND'
          ? 'bg-red-950 border-red-900' : 'bg-slate-900 border-slate-800'}`}>
        <p className={`text-xs uppercase tracking-widest font-mono mb-2 ${
          Array.isArray(c.technical_disqualifiers) && c.technical_disqualifiers[0] !== 'NOT FOUND'
            ? 'text-red-500' : 'text-slate-500'}`}>Technical Disqualifiers</p>
        {Array.isArray(c.technical_disqualifiers) && c.technical_disqualifiers[0] !== 'NOT FOUND' ? (
          <ul className="space-y-1">
            {c.technical_disqualifiers.map((d, i) => (
              <li key={i} className="text-red-300 text-sm font-mono flex gap-2">
                <span className="text-red-600 flex-shrink-0">◆</span>{d}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-700 text-sm font-mono italic">NOT FOUND</p>
        )}
      </div>
    </div>
  );
}

function FileRow({ ranked, index, isSelected, onSelect }) {
  const { file, score, matched } = ranked;
  return (
    <div onClick={onSelect} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
      isSelected ? 'bg-blue-950 border-blue-600' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}>
      <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 ${
        index === 0 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>#{index+1}</div>
      <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-mono truncate ${isSelected ? 'text-white font-semibold' : 'text-slate-400'}`}>{file.name}</p>
        <div className="flex gap-1 mt-1 flex-wrap">
          {matched.map(kw => (
            <span key={kw} className="text-xs font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900">{kw}</span>
          ))}
          {matched.length === 0 && <span className="text-xs font-mono text-slate-700">no keywords matched</span>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-mono font-bold ${score > 0 ? 'text-blue-400' : 'text-slate-700'}`}>+{score}pts</p>
        <p className="text-xs text-slate-600 font-mono">{formatBytes(file.size)}</p>
      </div>
      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
        isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-700'}`}>
        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
    </div>
  );
}

export default function Audit() {
  const [samUrl, setSamUrl]           = useState('');
  const [rankedFiles, setRankedFiles] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [loadingUrl, setLoadingUrl]   = useState(false);
  const [error, setError]             = useState('');
  const loadingStep = useLoadingCycle(loadingUrl);

  function handleFilesChange(e) {
    const files = e.target.files;
    if (!files || !files.length) return;
    setRankedFiles(scoreFiles(files));
    setSelectedIndex(0);
    setResult(null); setError('');
  }

  async function handleUrlAudit() {
    if (!samUrl.trim()) return;
    setLoadingUrl(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/analyze-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: samUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'URL audit failed');
      setResult(data);
    } catch (e) { setError(e.message); }
    finally { setLoadingUrl(false); }
  }

  async function handleFileAudit() {
    const selected = rankedFiles[selectedIndex];
    if (!selected) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', selected.file);
      const res = await fetch('/api/audit', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit failed');
      setResult(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const c = result?.compliance;

  return (
    <div className="w-full min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8 pb-6 border-b border-slate-800">
          <h1 className="text-3xl font-bold text-white">Aris Compliance Auditor</h1>
          <p className="text-slate-400 text-sm mt-1 font-mono">7-Pillar Federal Solicitation Analysis — Paste a SAM.gov link or upload a PDF</p>
        </div>

        {/* ── URL INPUT ── */}
        <div className="mb-6 p-5 bg-slate-900 border border-slate-700 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Link className="w-4 h-4 text-blue-400" />
            <p className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">SAM.gov Direct Link</p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={samUrl}
              onChange={e => setSamUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUrlAudit()}
              placeholder="https://sam.gov/opp/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/view"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm font-mono text-slate-300 placeholder-slate-700 outline-none focus:border-blue-600 transition-colors"
            />
            <button
              onClick={handleUrlAudit}
              disabled={loadingUrl || !samUrl.trim()}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-bold font-mono rounded-lg transition-all whitespace-nowrap"
            >
              {loadingUrl ? 'Auditing...' : 'Run Audit →'}
            </button>
          </div>
          {loadingUrl && (
            <div className="flex items-center gap-3 mt-3">
              <div className="w-3 h-3 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin flex-shrink-0" />
              <p className="text-xs font-mono text-blue-400 tracking-widest">{loadingStep}</p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-slate-800" />
          <p className="text-xs font-mono text-slate-700 uppercase tracking-widest">or upload PDF</p>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* ── FILE UPLOAD ── */}
        <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-800 rounded-xl p-8 cursor-pointer bg-slate-900 hover:border-slate-600 transition-colors mb-4"
          onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-blue-600'); }}
          onDragLeave={e => e.currentTarget.classList.remove('border-blue-600')}
          onDrop={e => {
            e.preventDefault(); e.currentTarget.classList.remove('border-blue-600');
            if (e.dataTransfer.files.length) { setRankedFiles(scoreFiles(e.dataTransfer.files)); setSelectedIndex(0); setResult(null); setError(''); }
          }}>
          <Upload className="w-6 h-6 text-slate-600" />
          <p className="text-slate-500 text-sm font-mono">Drop PDFs or <span className="text-blue-400">click to browse</span></p>
          <p className="text-slate-700 text-xs font-mono uppercase tracking-widest">Multiple files — keyword ranker auto-selects primary</p>
          <input type="file" accept=".pdf" multiple onChange={handleFilesChange} className="hidden" />
        </label>

        {/* File ranker */}
        {rankedFiles.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Ranked ({rankedFiles.length})</p>
              <div className="flex-1 h-px bg-slate-800" />
            </div>
            <div className="flex flex-col gap-2 mb-3">
              {rankedFiles.map((rf, i) => (
                <FileRow key={`${rf.file.name}-${i}`} ranked={rf} index={i}
                  isSelected={i === selectedIndex} onSelect={() => setSelectedIndex(i)} />
              ))}
            </div>
            <button onClick={handleFileAudit} disabled={loading}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-bold font-mono rounded-lg transition-all flex items-center gap-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-slate-600 border-t-white rounded-full animate-spin" />Auditing...</>
                : `Audit "${rankedFiles[selectedIndex]?.file.name}" →`}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-950 border border-red-800 rounded-lg text-red-400 text-sm font-mono">⚠ {error}</div>
        )}

        {/* ── RESULTS ── */}
        {result && (
          <div>
            {/* Meta bar */}
            {result.title && (
              <div className="mb-4 p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <p className="text-white font-bold text-sm font-mono">{result.title}</p>
                <div className="flex gap-4 mt-1">
                  {result.agency && <p className="text-slate-500 text-xs font-mono">{result.agency}</p>}
                  {result.primaryDoc && result.primaryDoc !== 'description_text' &&
                    <p className="text-blue-400 text-xs font-mono">📄 {result.primaryDoc}</p>}
                  {result.source === 'description_text' &&
                    <p className="text-orange-400 text-xs font-mono">⚠ Audited from description text — upload PDF for full analysis</p>}
                  {result.attachmentsFound > 0 &&
                    <p className="text-slate-600 text-xs font-mono">{result.attachmentsFound} attachments ranked</p>}
                </div>
              </div>
            )}

            <RiskBanner compliance={c} />
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              7-Pillar Compliance Matrix
            </h2>
            <PillarGrid c={c} />

            {result.executiveSummary && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  Bid / No-Bid Executive Summary
                </h2>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 overflow-hidden">
                  <ReactMarkdown components={{
                    h2: ({...p}) => <h2 className="text-base font-bold text-white mt-4 mb-2" {...p} />,
                    p:  ({...p}) => <p className="text-slate-300 mb-3 leading-relaxed text-sm break-words" {...p} />,
                    ul: ({...p}) => <ul className="mb-4 space-y-1" {...p} />,
                    li: ({...p}) => <li className="text-slate-300 text-sm break-words" {...p} />,
                    ol: ({...p}) => <ol className="list-decimal list-inside mb-4 space-y-1" {...p} />,
                    strong: ({...p}) => <strong className="text-white font-bold" {...p} />,
                    hr: ({...p}) => <hr className="border-slate-800 my-4" {...p} />,
                  }}>
                    {result.executiveSummary}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
