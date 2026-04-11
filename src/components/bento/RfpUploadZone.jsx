/**
 * RfpUploadZone — Drag-and-drop RFP ingestion card.
 * Accepts PDF files or raw SAM.gov URL.
 * Calls /api/audit/pdf (file) or /api/audit/link (URL).
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Link2, FileText, X, Loader2, CheckCircle2, Send } from 'lucide-react';

const ACCEPTED_MIME = ['application/pdf'];

export default function RfpUploadZone({
  onResult,
  onError,
  onStart,
  initialUrl = null,
  user = null,
  variant = 'card', // 'card' | 'chatBar'
}) {
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

  if (variant === 'chatBar') {
    return (
      <div style={cb.wrap}>
        <div style={cb.inner}>
          <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={onFileChange} />
          <button
            type="button"
            style={cb.iconBtn}
            title="Attach PDF"
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={18} color="#9ca3af" />
          </button>
          <div style={cb.modeToggle}>
            <button
              type="button"
              style={mode === 'url' ? cb.modeOn : cb.modeOff}
              onClick={() => { setMode('url'); setFile(null); }}
            >
              <Link2 size={14} />
            </button>
            <button
              type="button"
              style={mode === 'drop' ? cb.modeOn : cb.modeOff}
              onClick={() => { setMode('drop'); setUrl(''); }}
            >
              <FileText size={14} />
            </button>
          </div>
          {mode === 'url' ? (
            <input
              style={cb.textField}
              type="url"
              placeholder="Paste a SAM.gov opportunity URL or message…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canSubmit && !loading && handleSubmit()}
            />
          ) : (
            <div
              style={{
                ...cb.dropMini,
                ...(dragging ? cb.dropMiniActive : {}),
                ...(file ? cb.dropMiniFile : {}),
              }}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => !file && inputRef.current?.click()}
            >
              {!file ? (
                <span style={cb.dropHint}>Drop PDF or click to attach</span>
              ) : (
                <span style={cb.fileChip}>
                  <FileText size={14} color="#4ade80" />
                  <span style={cb.fileChipName}>{file.name}</span>
                  <button
                    type="button"
                    style={cb.clearMini}
                    onClick={(e) => {
                      e.stopPropagation();
                      reset();
                    }}
                  >
                    <X size={14} />
                  </button>
                </span>
              )}
            </div>
          )}
          <button
            type="button"
            style={{ ...cb.sendBtn, ...((!canSubmit || loading) ? cb.sendDisabled : {}) }}
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            title="Run audit"
          >
            {loading ? <Loader2 size={18} style={s.spin} /> : <Send size={18} />}
          </button>
        </div>
      </div>
    );
  }

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
    background: '#fff',
    border: '1px solid #dadce0',
    borderRadius: 8,
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
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0',
    textTransform: 'none',
    color: '#5f6368',
  },
  tabRow: {
    display: 'flex',
    gap: 4,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 12,
    fontWeight: 500,
    color: '#5f6368',
    background: 'transparent',
    border: '1px solid #dadce0',
    borderRadius: 4,
    padding: '6px 12px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tabActive: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 12,
    fontWeight: 500,
    color: '#1967d2',
    background: '#e8f0fe',
    border: '1px solid #d2e3fc',
    borderRadius: 4,
    padding: '6px 12px',
    cursor: 'pointer',
  },
  dropZone: {
    flex: 1,
    minHeight: 130,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1.5px dashed #dadce0',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
    gap: 6,
    background: '#f8f9fa',
  },
  dropZoneDragging: {
    borderColor: '#1a73e8',
    background: '#e8f0fe',
  },
  dropZoneFilled: {
    border: '1.5px solid #ceead6',
    background: '#e6f4ea',
    cursor: 'default',
  },
  uploadIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: '#fff',
    border: '1px solid #e8eaed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dropTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 400,
    color: '#202124',
  },
  dropSub: {
    margin: 0,
    fontSize: 13,
    color: '#5f6368',
  },
  fileRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 8px',
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    color: '#137333',
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
    background: '#f8f9fa',
    border: '1px solid #dadce0',
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 14,
    color: '#202124',
    fontFamily: 'inherit',
    outline: 'none',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    background: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '10px 0',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    letterSpacing: '0',
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

/** ChatGPT-style bottom composer */
const cb = {
  wrap: {
    width: '100%',
    maxWidth: 720,
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#fff',
    border: '1px solid #dadce0',
    borderRadius: 24,
    padding: '6px 8px 6px 12px',
    minHeight: 52,
    boxSizing: 'border-box',
    boxShadow: '0 1px 2px rgba(60,64,67,0.08)',
  },
  iconBtn: {
    flexShrink: 0,
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeToggle: {
    display: 'flex',
    gap: 2,
    padding: 2,
    borderRadius: 8,
    background: '#f1f3f4',
    flexShrink: 0,
  },
  modeOn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 30,
    borderRadius: 6,
    border: 'none',
    background: '#fff',
    color: '#1967d2',
    cursor: 'pointer',
    boxShadow: '0 1px 1px rgba(60,64,67,0.12)',
  },
  modeOff: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 30,
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    color: '#5f6368',
    cursor: 'pointer',
  },
  textField: {
    flex: 1,
    minWidth: 0,
    border: 'none',
    background: 'transparent',
    fontSize: 16,
    lineHeight: 1.45,
    color: '#202124',
    fontFamily: 'inherit',
    outline: 'none',
    padding: '8px 4px',
  },
  dropMini: {
    flex: 1,
    minHeight: 40,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    borderRadius: 12,
    border: '1px dashed #dadce0',
    cursor: 'pointer',
    background: '#f8f9fa',
  },
  dropMiniActive: {
    borderColor: '#1a73e8',
    background: '#e8f0fe',
  },
  dropMiniFile: {
    borderStyle: 'solid',
    borderColor: '#ceead6',
    background: '#e6f4ea',
  },
  dropHint: {
    fontSize: 14,
    color: '#80868b',
  },
  fileChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    minWidth: 0,
  },
  fileChipName: {
    flex: 1,
    fontSize: 14,
    color: '#202124',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  clearMini: {
    border: 'none',
    background: 'transparent',
    color: '#5f6368',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
  },
  sendBtn: {
    flexShrink: 0,
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    background: '#1a73e8',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.15s',
  },
  sendDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
};
