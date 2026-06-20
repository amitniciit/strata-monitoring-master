import { useState, useRef } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const UploadPanel = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const validateFile = (selected) => {
    if (!selected) return false;
    const isJsonByName = selected.name?.toLowerCase().endsWith('.json');
    const isJsonByType = selected.type === 'application/json';
    return isJsonByName || isJsonByType;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected || !validateFile(selected)) {
      toast.error('Please select a valid .json file.');
      setFile(null);
      e.target.value = '';
      return;
    }
    setFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped || !validateFile(dropped)) {
      toast.error('Please drop a valid .json file.');
      return;
    }
    setFile(dropped);
  };

  const handleReset = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a JSON file.');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/upload/panel`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Panel uploaded successfully.');
      handleReset();
    } catch (err) {
      console.log('Error uploading file', err);
      toast.error('Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  const statusColor = uploading ? '#f0a500' : file ? '#00aa44' : '#64748b';
  const statusLabel = uploading ? 'Uploading…' : file ? 'Ready to upload' : 'No file selected';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .up-root {
          min-height: 100vh;
          background: #0b1120;
          background-image:
            radial-gradient(ellipse at 20% 20%, rgba(20,40,90,0.45) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 80%, rgba(14,40,80,0.3) 0%, transparent 50%);
          font-family: 'Inter', sans-serif;
          color: #e2e8f0;
          padding: 32px 24px;
        }
        .up-topbar {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 40px;
        }
        .up-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8;
          padding: 8px 16px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .up-back:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
        .up-breadcrumb {
          font-size: 12px;
          color: #475569;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.04em;
        }
        .up-hero {
          max-width: 720px;
          margin: 0 auto;
        }
        .up-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #3b82f6;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .up-eyebrow::before {
          content: '';
          display: inline-block;
          width: 24px;
          height: 2px;
          background: #3b82f6;
          border-radius: 1px;
        }
        .up-title {
          font-size: 28px;
          font-weight: 700;
          color: #f1f5f9;
          line-height: 1.2;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }
        .up-subtitle {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 36px;
          line-height: 1.6;
        }
        .up-dropzone {
          border: 1.5px dashed rgba(59,130,246,0.35);
          border-radius: 14px;
          background: rgba(15,23,42,0.6);
          padding: 48px 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s;
          position: relative;
          margin-bottom: 20px;
        }
        .up-dropzone.drag { border-color: #3b82f6; background: rgba(59,130,246,0.06); }
        .up-dropzone.has-file { border-color: #00aa44; border-style: solid; background: rgba(0,170,68,0.04); }
        .up-dropzone:hover { border-color: rgba(59,130,246,0.6); background: rgba(59,130,246,0.04); }
        .up-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: rgba(59,130,246,0.12);
          border: 1px solid rgba(59,130,246,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          transition: all 0.2s;
        }
        .up-dropzone.has-file .up-icon-wrap {
          background: rgba(0,170,68,0.12);
          border-color: rgba(0,170,68,0.25);
        }
        .up-drop-title {
          font-size: 16px;
          font-weight: 600;
          color: #cbd5e1;
          margin-bottom: 6px;
        }
        .up-drop-sub {
          font-size: 13px;
          color: #475569;
          margin-bottom: 20px;
        }
        .up-browse-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(59,130,246,0.15);
          border: 1px solid rgba(59,130,246,0.3);
          color: #60a5fa;
          padding: 8px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .up-browse-btn:hover { background: rgba(59,130,246,0.25); border-color: #3b82f6; color: #93c5fd; }
        .up-file-info {
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: rgba(0,170,68,0.08);
          border: 1px solid rgba(0,170,68,0.2);
          border-radius: 10px;
          padding: 12px 20px;
        }
        .up-file-name {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 600;
          color: #4ade80;
        }
        .up-file-size {
          font-size: 12px;
          color: #64748b;
          background: rgba(255,255,255,0.05);
          padding: 2px 8px;
          border-radius: 4px;
        }
        .up-status-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(15,23,42,0.8);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 13px;
        }
        .up-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          transition: background 0.3s;
        }
        .up-status-label { color: #94a3b8; }
        .up-status-val { font-weight: 600; margin-left: 4px; }
        .up-actions {
          display: flex;
          gap: 12px;
        }
        .up-btn-primary {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #1d4ed8, #2563eb);
          border: none;
          color: #fff;
          padding: 14px 28px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(37,99,235,0.3);
          letter-spacing: 0.01em;
        }
        .up-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #1e40af, #1d4ed8);
          box-shadow: 0 6px 20px rgba(37,99,235,0.4);
          transform: translateY(-1px);
        }
        .up-btn-primary:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }
        .up-btn-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8;
          padding: 14px 22px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }
        .up-btn-secondary:hover {
          background: rgba(255,255,255,0.09);
          color: #cbd5e1;
          border-color: rgba(255,255,255,0.18);
        }
        .up-specs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 28px;
        }
        .up-spec-card {
          background: rgba(15,23,42,0.7);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 14px 16px;
        }
        .up-spec-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #475569;
          margin-bottom: 4px;
        }
        .up-spec-val {
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
          font-family: 'JetBrains Mono', monospace;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes progress { from { width: 0% } to { width: 90% } }
        .up-progress-wrap {
          height: 3px;
          background: rgba(255,255,255,0.06);
          border-radius: 2px;
          margin-top: 12px;
          overflow: hidden;
        }
        .up-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          border-radius: 2px;
          animation: progress 2.5s ease-out forwards;
        }
        @media (max-width: 600px) {
          .up-specs { grid-template-columns: 1fr 1fr; }
          .up-title { font-size: 22px; }
        }
      `}</style>

      <div className="up-root">
        <div className="up-topbar">
          <Link to="/" className="up-back">← Dashboard</Link>
          <span className="up-breadcrumb">Panel Upload</span>
        </div>

        <div className="up-hero">
          <div className="up-eyebrow">Data Ingestion</div>
          <h1 className="up-title">Upload Panel Snapshot</h1>
          <p className="up-subtitle">
            Import a JSON panel file to update the monitoring system with new pillar coordinates, instrument readings, and extraction status.
          </p>

          <form onSubmit={handleUpload}>
            <div
              className={`up-dropzone ${dragOver ? 'drag' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                id="panel-json-input"
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className="up-icon-wrap">
                {file ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                )}
              </div>

              {!file ? (
                <>
                  <div className="up-drop-title">Drop your panel file here</div>
                  <div className="up-drop-sub">Drag & drop or click to browse — JSON format only</div>
                  <div className="up-browse-btn" onClick={(e) => e.stopPropagation()}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Browse files
                  </div>
                </>
              ) : (
                <>
                  <div className="up-drop-title" style={{ color: '#4ade80' }}>File ready</div>
                  <div className="up-file-info" onClick={(e) => e.stopPropagation()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span className="up-file-name">{file.name}</span>
                    <span className="up-file-size">{Math.round(file.size / 1024)} KB</span>
                  </div>
                </>
              )}
            </div>

            <div className="up-status-bar">
              <div className="up-status-dot" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
              <span className="up-status-label">Status:</span>
              <span className="up-status-val" style={{ color: statusColor }}>{statusLabel}</span>
              {uploading && <div style={{ marginLeft: 'auto' }}><div className="spinner" /></div>}
            </div>

            {uploading && (
              <div className="up-progress-wrap">
                <div className="up-progress-bar" />
              </div>
            )}

            <div className="up-actions" style={{ marginTop: uploading ? 16 : 12 }}>
              <button type="submit" className="up-btn-primary" disabled={uploading || !file}>
                {uploading ? (
                  <><div className="spinner" /> Uploading panel…</>
                ) : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Upload Panel</>
                )}
              </button>
              <button type="button" className="up-btn-secondary" onClick={handleReset} disabled={uploading}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
                Reset
              </button>
            </div>
          </form>

          <div className="up-specs">
            <div className="up-spec-card">
              <div className="up-spec-label">Accepted format</div>
              <div className="up-spec-val">.json only</div>
            </div>
            <div className="up-spec-card">
              <div className="up-spec-label">Endpoint</div>
              <div className="up-spec-val">/upload/panel</div>
            </div>
            <div className="up-spec-card">
              <div className="up-spec-label">Max file size</div>
              <div className="up-spec-val">10 MB</div>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer
        position="bottom-right"
        theme="dark"
        toastStyle={{
          background: '#1e293b',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#e2e8f0',
          fontSize: 13,
          borderRadius: 10,
        }}
      />
    </>
  );
};

export default UploadPanel;