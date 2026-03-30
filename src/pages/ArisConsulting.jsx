import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ArisConsulting() {
  const [markdown, setMarkdown] = useState('');
  const [form, setForm] = useState({ name: '', email: '', service: 'AI Debt Audit', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  useEffect(() => {
    fetch('/content/services.md')
      .then(res => res.text())
      .then(setMarkdown)
      .catch(err => setMarkdown(`# Error\nCould not load services.md: ${err.message}`));
  }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setForm({ name: '', email: '', service: 'AI Debt Audit', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#111', padding: '40px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto 40px', lineHeight: 1.7, fontSize: 15 }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e5e5', maxWidth: 800, margin: '0 auto 40px' }} />

      <section style={{ maxWidth: 480, margin: '0 auto', padding: '40px', background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', border: '1px solid #ebebeb' }}>
        <img src="/aris-labs.png" alt="ARIS Labs" style={{ height: 40, marginBottom: 16, display: 'block' }} />
        <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>ARIS Labs Consultancy</h3>
        <p style={{ margin: '0 0 28px', color: '#555', fontSize: 14 }}>No sales fluff. Expect a response within 4 hours.</p>

        {status === 'success' ? (
          <p style={{ color: '#16a34a', fontWeight: 600 }}>Sent. We'll be in touch shortly.</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input name="name" type="text" required value={form.name} onChange={handleChange} style={inputStyle} placeholder="Your name" />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input name="email" type="email" required value={form.email} onChange={handleChange} style={inputStyle} placeholder="you@company.com" />
            </div>
            <div>
              <label style={labelStyle}>Service</label>
              <select name="service" value={form.service} onChange={handleChange} style={inputStyle}>
                <option>AI Debt Audit</option>
                <option>Stateless Bridge</option>
                <option>MCP Injection</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Message</label>
              <textarea name="message" required value={form.message} onChange={handleChange} style={{ ...inputStyle, height: 100, resize: 'vertical' }} placeholder="Describe the problem..." />
            </div>
            {status === 'error' && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>Something went wrong. Try again.</p>}
            <button type="submit" disabled={status === 'sending'} style={btnStyle}>
              {status === 'sending' ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        )}
      </section>
    </div>
  );

}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#333' };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 7, fontSize: 14, boxSizing: 'border-box', outline: 'none', background: '#fafafa' };
const btnStyle = { padding: '11px 0', background: '#111', color: '#fff', border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4 };
