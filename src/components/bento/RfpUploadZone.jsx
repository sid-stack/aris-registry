/**
 * RfpUploadZone — Drag-and-drop RFP ingestion card.
 * Accepts PDF files or raw SAM.gov URL.
 * Calls /api/audit/pdf (file) or /api/audit/link (URL).
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Link2, FileText, X, Loader2, CheckCircle2, Zap } from 'lucide-react';

const ACCEPTED_MIME = ['application/pdf'];

export default function RfpUploadZone({ onResult, onError, onStart, initialUrl = null, user = null }) {
  const [mode, setMode]       = useState('drop');   // 'drop' | 'url'
  const [dragging, setDragging] = useState(false);
  const [file, setFile]       = useState(null);
  const [url, setUrl]         = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRef              = useRef(null);
  const didAutoSubmit         = useRef(null); // tracks last initialUrl we auto-fired

  const reset = () => { setFile(null); setUrl(''); setSuccess(false); };
  const authHeaders = {
    ...(user?.id ? { 'x-user-id': user.id } : {}),
    ...(user?.email ? { 'x-user-email': user.email } : {}),
    'x-subscribed': user?.isSubscribed ? 'true' : 'false',
  };

  // When a featured solicitation is clicked, switch to URL mode, populate, and fire
  useEffect(() => {
    if (initialUrl && initialUrl !== didAutoSubmit.current) {
      didAutoSubmit.current = initialUrl;
      setMode('url');
      setUrl(initialUrl);
      setSuccess(false);
      // Slight delay so state settles before submit
      setTimeout(() => submitUrl(initialUrl), 80);
    }
  }, [initialUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const onDragOver  = useCallback(e => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(e => { e.preventDefault(); setDragging(false); }, []);

  const onDrop = useCallback(e => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && ACCEPTED_MIME.includes(dropped.type)) {
      setFile(dropped);
    } else {
      onError?.({ message: 'Only PDF files are accepted.', code: 'VALIDATION', failedUrl: null });
    }
  }, [onError]);

  const onFileChange = e => {
    const chosen = e.target.files[0];
    if (chosen) setFile(chosen);
  };

  // ── Submit helpers ─────────────────────────────────────────────────────────
  const submitUrl = async (targetUrl) => {
    if (loading) return;
    const trimmed = (targetUrl || url).trim();
    if (!trimmed) return;
    setLoading(true);
    setSuccess(false);
    onStart?.();
    try {
      const res = await fetch('/api/audit/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json().catch(() => null);
      const cacheHeader = (res.headers.get('x-bidsmith-cache') || res.headers.get('x-cache') || '').toLowerCase();
      const cacheHitFromHeader = cacheHeader.includes('hit');
      const normalized = data ? {
        ...data,
        meta: {
          ...(data.meta || {}),
          cache_hit: data?.meta?.cache_hit === true || cacheHitFromHeader || data?.isCached === true,
        },
      } : data;
      if (!res.ok) {
        onError?.({ message: data?.error || `Request failed (${res.status})`, hint: data?.hint || null, code: data?.code || String(res.status), externalLinks: data?.externalLinks || [], failedUrl: trimmed, rawData: data });
        return;
      }
      setSuccess(true);
      onResult?.(normalized);
    } catch (err) {
      onError?.({ message: err.message, code: 'NETWORK_ERROR', failedUrl: trimmed });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (mode === 'url') { submitUrl(url); return; }
    if (mode === 'drop' && file) {
      setLoading(true);
      setSuccess(false);
      onStart?.();
      try {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/audit/pdf', { method: 'POST', headers: authHeaders, body: form });
        const data = await res.json().catch(() => null);
        const normalized = data ? {
          ...data,
          meta: {
            ...(data.meta || {}),
            cache_hit: data?.meta?.cache_hit === true || data?.isCached === true,
          },
        } : data;
        if (!res.ok) {
          onError?.({ message: data?.error || `Request failed (${res.status})`, hint: data?.hint || null, code: data?.code || String(res.status), externalLinks: [], failedUrl: null, rawData: data });
          return;
        }
        setSuccess(true);
        onResult?.(normalized);
      } catch (err) {
        onError?.({ message: err.message, code: 'NETWORK_ERROR', failedUrl: null });
      } finally {
        setLoading(false);
      }
      return;
    }
    onError?.({ message: 'Provide a PDF or SAM.gov URL.', code: 'VALIDATION', failedUrl: null });
  };

  const canSubmit = (mode === 'drop' && file) || (mode === 'url' && url.trim().length > 10);

  return (
    <div style={s.card}>
      {/* Header */}
      <div style={s.header}>
        <span style={s.label}>RFP Intake</span>
        <div style={s.tabRow}>
          <button style={mode === 'drop' ? s.tabActive : s.tab} onClick={() => { setMode('drop'); reset(); }}>
            <FileText size={12} style={{ marginRight: 4 }} /> Upload PDF
          </button>
          <button style={mode === 'url' ? s.tabActive : s.tab} onClick={() => { setMode('url'); reset(); }}>
            <Link2 size={12} style={{ marginRight: 4 }} /> SAM.gov URL
          </button>
        </div>
      </div>

      {/* Drop zone */}
      {mode === 'drop' && (
        <div
          style={{ ...s.dropZone, ...(dragging ? s.dropZoneDragging : {}), ...(file ? s.dropZoneFilled : {}) }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !file && inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={onFileChange} />

          {!file ? (
            <>
              <div style={s.uploadIcon}>
                <Upload size={22} color="#6b7280" />
              </div>
              <p style={s.dropTitle}>Drop your RFP here</p>
              <p style={s.dropSub}>PDF · Max 25 MB</p>
            </>
          ) : (
            <div style={s.fileRow}>
              <FileText size={18} color="#22c55e" />
              <span style={s.fileName}>{file.name}</span>
              <button style={s.clearBtn} onClick={e => { e.stopPropagation(); reset(); }}>
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* URL input */}
      {mode === 'url' && (
        <div style={s.urlWrap}>
          <input
            style={s.urlInput}
            type="url"
            placeholder="https://sam.gov/opp/..."
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmit()}
          />
        </div>
      )}

      {/* Submit */}
      <button
        style={{ ...s.submitBtn, ...((!canSubmit || loading) ? s.submitDisabled : {}) }}
        onClick={handleSubmit}
        disabled={!canSubmit || loading}
      >
        {loading ? (
          <><Loader2 size={14} style={s.spin} /> Analyzing…</>
        ) : success ? (
          <><CheckCircle2 size={14} style={{ marginRight: 6, color: '#22c55e' }} /> Done</>
        ) : (
          'Run Audit'
        )}
      </button>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const s = {
  card: {
    background: '#111111',
    border: '1px solid #1f1f1f',
    borderRadius: 16,
    padding: '20px 20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    height: '100%',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#6b7280',
  },
  tabRow: {
    display: 'flex',
    gap: 4,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 11,
    fontWeight: 500,
    color: '#6b7280',
    background: 'transparent',
    border: '1px solid #1f1f1f',
    borderRadius: 6,
    padding: '4px 10px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tabActive: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 11,
    fontWeight: 600,
    color: '#ffffff',
    background: '#1a1a1a',
    border: '1px solid #2f2f2f',
    borderRadius: 6,
    padding: '4px 10px',
    cursor: 'pointer',
  },
  dropZone: {
    flex: 1,
    minHeight: 130,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1.5px dashed #1f1f1f',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
    gap: 6,
  },
  dropZoneDragging: {
    borderColor: '#3b82f6',
    background: 'rgba(59,130,246,0.04)',
  },
  dropZoneFilled: {
    border: '1.5px solid #1f2f1f',
    background: 'rgba(34,197,94,0.04)',
    cursor: 'default',
  },
  uploadIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: '#1a1a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dropTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 500,
    color: '#e5e7eb',
  },
  dropSub: {
    margin: 0,
    fontSize: 11,
    color: '#4b5563',
  },
  fileRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 8px',
  },
  fileName: {
    flex: 1,
    fontSize: 12,
    color: '#d1fae5',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    padding: 2,
  },
  urlWrap: {
    flex: 1,
  },
  urlInput: {
    width: '100%',
    boxSizing: 'border-box',
    background: '#0d0d0d',
    border: '1px solid #1f1f1f',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 12,
    color: '#f9fafb',
    fontFamily: 'inherit',
    outline: 'none',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    background: '#ffffff',
    color: '#000000',
    border: 'none',
    borderRadius: 10,
    padding: '10px 0',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    letterSpacing: '-0.01em',
  },
  submitDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
  spin: {
    marginRight: 6,
    animation: 'spin 1s linear infinite',
  },
};
