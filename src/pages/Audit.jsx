import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { AlertCircle, CheckCircle2, TrendingUp, FileText, Upload } from 'lucide-react';

// ─── Keyword Scorer ───────────────────────────────────────────────────────────
const KEYWORD_SCORES = {
  solicitation: 10, rfp: 10, pws: 10, sow: 10, combined: 10,
  rfq: 8, ifb: 8, amendment: 4, attachment: 2, exhibit: 2,
};

function scoreFiles(files) {
  return Array.from(files).map(file => {
    const n = file.name.toLowerCase().replace(/[^a-z0-9]/g, ' ');
    let score = 0;
    const matched = [];
    for (const [kw, pts] of Object.entries(KEYWORD_SCORES)) {
      if (n.includes(kw)) { score += pts; matched.push(kw.toUpperCase()); }
    }
    return { file, score, matched };
  }).sort((a, b) => b.score - a.score);
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── File Row ─────────────────────────────────────────────────────────────────
function FileRow({ ranked, index, isSelected, onSelect }) {
  const { file, score, matched } = ranked;
  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'bg-blue-950 border-blue-600'
          : 'bg-slate-900 border-slate-800 hover:border-slate-600'
      }`}
    >
      <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 ${
        index === 0 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
      }`}>
        #{index + 1}
      </div>
      <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-mono truncate ${isSelected ? 'text-white font-semibold' : 'text-slate-400'}`}>
          {file.name}
        </p>
        <div className="flex gap-1 mt-1 flex-wrap">
          {matched.map(kw => (
            <span key={kw} className="text-xs font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900">
              {kw}
            </span>
          ))}
          {matched.length === 0 && (
            <span className="text-xs font-mono text-slate-700">no keywords matched</span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-mono font-bold ${score > 0 ? 'text-blue-400' : 'text-slate-700'}`}>+{score}pts</p>
        <p className="text-xs text-slate-600 font-mono">{formatBytes(file.size)}</p>
      </div>
      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
        isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-700'
      }`}>
        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
    </div>
  );
}

// ─── Main Audit Component ─────────────────────────────────────────────────────
export default function Audit() {
  const [rankedFiles, setRankedFiles] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [compliance, setCompliance] = useState(null);
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleFilesChange(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setRankedFiles(scoreFiles(files));
    setSelectedIndex(0);
    setCompliance(null);
    setExecutiveSummary('');
    setError('');
  }

  async function handleAudit() {
    const selected = rankedFiles[selectedIndex];
    if (!selected) return;
    setLoading(true);
    setError('');
    setCompliance(null);
    setExecutiveSummary('');

    try {
      const formData = new FormData();
      formData.append('file', selected.file);

      const res = await fetch('/api/audit', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit failed');

      setCompliance(data.compliance);
      setExecutiveSummary(data.executiveSummary || '');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const c = compliance;

  return (
    <div className="w-full min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-white">Aris Compliance Auditor</h1>
            <p className="text-slate-400 text-sm mt-1">7-Pillar Federal Solicitation Analysis</p>
          </div>
        </div>

        {/* Upload Zone */}
        <label
          className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-700 rounded-xl p-10 cursor-pointer bg-slate-900 hover:border-blue-600 transition-colors mb-4"
          onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-blue-600'); }}
          onDragLeave={e => e.currentTarget.classList.remove('border-blue-600')}
          onDrop={e => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-blue-600');
            if (e.dataTransfer.files.length) {
              setRankedFiles(scoreFiles(e.dataTransfer.files));
              setSelectedIndex(0);
              setCompliance(null);
              setExecutiveSummary('');
              setError('');
            }
          }}
        >
          <Upload className="w-8 h-8 text-slate-600" />
          <p className="text-slate-400 text-sm font-mono">
            Drop PDFs here or <span className="text-blue-400">click to browse</span>
          </p>
          <p className="text-slate-700 text-xs font-mono uppercase tracking-widest">
            Multiple files accepted — keyword ranker auto-selects primary
          </p>
          <input type="file" accept=".pdf" multiple onChange={handleFilesChange} className="hidden" />
        </label>

        {/* File Ranker */}
        {rankedFiles.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                Ranked Documents ({rankedFiles.length})
              </p>
              <div className="flex-1 h-px bg-slate-800" />
              <p className="text-xs font-mono text-slate-700">click to change selection</p>
            </div>
            <div className="flex flex-col gap-2">
              {rankedFiles.map((rf, i) => (
                <FileRow
                  key={`${rf.file.name}-${i}`}
                  ranked={rf}
                  index={i}
                  isSelected={i === selectedIndex}
                  onSelect={() => setSelectedIndex(i)}
                />
              ))}
            </div>
            <div className="mt-3 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-500 flex gap-2">
              <span className="text-blue-500">◆</span>
              <span>
                <span className="text-slate-300 font-bold">Primary: </span>
                <span className="text-blue-400">{rankedFiles[selectedIndex]?.file.name}</span>
                {selectedIndex === 0
                  ? <span className="text-green-600"> (auto-selected)</span>
                  : <span className="text-orange-500"> (manually overridden)</span>
                }
              </span>
            </div>
          </div>
        )}

        {/* Run Button */}
        <button
          onClick={handleAudit}
          disabled={loading || rankedFiles.length === 0}
          className="mb-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-bold font-mono uppercase tracking-widest rounded-lg transition-all flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
              Auditing {rankedFiles[selectedIndex]?.file.name}...
            </>
          ) : rankedFiles.length > 0
              ? `Audit "${rankedFiles[selectedIndex]?.file.name}" →`
              : 'Upload PDFs to begin →'
          }
        </button>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-950 border border-red-800 rounded-lg text-red-400 text-sm font-mono">
            ⚠ {error}
          </div>
        )}

        {/* ── COMPLIANCE MATRIX GRID ── */}
        {c && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Compliance Matrix — 7 Pillars
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <p className="text-slate-500 text-xs uppercase tracking-widest font-mono mb-1">Solicitation ID</p>
                <p className="text-white font-semibold break-words font-mono">{c.solicitation_id || 'NOT FOUND'}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <p className="text-slate-500 text-xs uppercase tracking-widest font-mono mb-1">Deadline Date</p>
                <p className="text-white font-semibold font-mono">{c.deadline_date || 'NOT FOUND'}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <p className="text-slate-500 text-xs uppercase tracking-widest font-mono mb-1">Set-Aside Type</p>
                <p className="text-white font-semibold font-mono">{c.set_aside_type || 'NOT FOUND'}</p>
              </div>

              <div className={`border rounded-lg p-4 flex flex-col items-center justify-center ${
                (c.risk_score_1_to_10 || 0) <= 3 ? 'bg-green-950 border-green-800' :
                (c.risk_score_1_to_10 || 0) <= 6 ? 'bg-orange-950 border-orange-800' :
                'bg-red-950 border-red-800'
              }`}>
                <p className="text-slate-500 text-xs uppercase tracking-widest font-mono mb-1">Risk Score</p>
                <div className="flex items-baseline gap-1">
                  <p className={`text-4xl font-black font-mono ${
                    (c.risk_score_1_to_10 || 0) <= 3 ? 'text-green-400' :
                    (c.risk_score_1_to_10 || 0) <= 6 ? 'text-orange-400' : 'text-red-400'
                  }`}>{c.risk_score_1_to_10 ?? '–'}</p>
                  <p className="text-slate-500 font-mono">/10</p>
                </div>
                <p className={`text-xs font-bold font-mono tracking-widest ${
                  (c.risk_score_1_to_10 || 0) <= 3 ? 'text-green-500' :
                  (c.risk_score_1_to_10 || 0) <= 6 ? 'text-orange-500' : 'text-red-500'
                }`}>
                  {(c.risk_score_1_to_10 || 0) <= 3 ? 'LOW' : (c.risk_score_1_to_10 || 0) <= 6 ? 'MEDIUM' : 'HIGH'}
                </p>
              </div>

              {/* Bonding */}
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4">
                <p className="text-slate-500 text-xs uppercase tracking-widest font-mono mb-3">Bonding Requirements</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Bid Bond', value: c.bonding_reqs?.bid_bond },
                    { label: 'Performance Bond', value: c.bonding_reqs?.performance_bond },
                    { label: 'Payment Bond', value: c.bonding_reqs?.payment_bond },
                  ].map(({ label, value }) => (
                    <div key={label} className={`rounded p-3 border ${!value || value === 'NOT FOUND' ? 'bg-slate-950 border-slate-800' : 'bg-blue-950 border-blue-800'}`}>
                      <p className="text-slate-600 text-xs font-mono uppercase mb-1">{label}</p>
                      <p className={`text-sm font-mono font-semibold ${!value || value === 'NOT FOUND' ? 'text-slate-700 italic' : 'text-blue-300'}`}>
                        {value || 'NOT FOUND'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4">
                <p className="text-slate-500 text-xs uppercase tracking-widest font-mono mb-1">Past Performance Threshold</p>
                <p className="text-white text-sm font-mono break-words">{c.past_performance_threshold || 'NOT FOUND'}</p>
              </div>

              <div className={`md:col-span-2 rounded-lg p-4 border ${
                Array.isArray(c.technical_disqualifiers) && c.technical_disqualifiers[0] !== 'NOT FOUND'
                  ? 'bg-red-950 border-red-900' : 'bg-slate-900 border-slate-800'
              }`}>
                <p className={`text-xs uppercase tracking-widest font-mono mb-2 ${
                  Array.isArray(c.technical_disqualifiers) && c.technical_disqualifiers[0] !== 'NOT FOUND'
                    ? 'text-red-500' : 'text-slate-500'
                }`}>Technical Disqualifiers</p>
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
          </div>
        )}

        {/* ── EXECUTIVE SUMMARY ── */}
        {executiveSummary && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              Bid / No-Bid Executive Summary
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 overflow-hidden">
              <div className="max-w-none break-words">
                <ReactMarkdown
                  components={{
                    h1: ({ ...p }) => <h1 className="text-xl font-bold text-white mt-4 mb-3" {...p} />,
                    h2: ({ ...p }) => <h2 className="text-lg font-bold text-white mt-4 mb-2" {...p} />,
                    h3: ({ ...p }) => <h3 className="text-base font-semibold text-slate-300 mt-3 mb-2" {...p} />,
                    p: ({ ...p }) => <p className="text-slate-300 mb-3 leading-relaxed break-words" {...p} />,
                    ul: ({ ...p }) => <ul className="mb-4 space-y-1 list-none" {...p} />,
                    ol: ({ ...p }) => <ol className="list-decimal list-inside mb-4 space-y-1" {...p} />,
                    li: ({ ...p }) => <li className="text-slate-300 text-sm break-words" {...p} />,
                    strong: ({ ...p }) => <strong className="text-white font-bold" {...p} />,
                    hr: ({ ...p }) => <hr className="border-slate-800 my-4" {...p} />,
                  }}
                >
                  {executiveSummary}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-slate-800 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-400 ml-4 font-mono text-sm">Running 7-pillar compliance audit...</p>
          </div>
        )}

      </div>
    </div>
  );
}
