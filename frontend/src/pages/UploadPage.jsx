import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Table, Zap } from 'lucide-react'
import { uploadDataset, uploadSampleDataset } from '../api'

export default function UploadPage() {
    const [dragging, setDragging] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const fileRef = useRef()

    const handleFile = async (file) => {
        if (!file) return
        setLoading(true)
        setError(null)
        setResult(null)
        try {
            const form = new FormData()
            form.append('file', file)
            const { data } = await uploadDataset(form)
            setResult(data)
        } catch (e) {
            setError(e.response?.data?.detail || e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleLoadSample = async () => {
        setLoading(true)
        setError(null)
        setResult(null)
        try {
            const { data } = await uploadSampleDataset()
            setResult(data)
        } catch (e) {
            setError(e.response?.data?.detail || e.message)
        } finally {
            setLoading(false)
        }
    }

    const onDrop = (e) => {
        e.preventDefault()
        setDragging(false)
        handleFile(e.dataTransfer.files[0])
    }

    return (
        <div className="fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2>Upload Dataset</h2>
                    <p>Upload a CSV transaction dataset to begin fraud detection analysis.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleLoadSample}
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    <Zap size={14} /> Quick Load 10k Sample Data
                </button>
            </div>

            {/* Drop Zone */}
            <div className="glass-card" style={{ marginBottom: 24 }}>
                <div
                    className={`upload-zone${dragging ? ' dragging' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileRef.current?.click()}
                >
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".csv"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFile(e.target.files[0])}
                    />
                    <div className="upload-icon">
                        <Upload size={28} />
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>
                        {loading ? 'Processing...' : 'Drop your CSV here'}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                        {loading ? 'Validating and masking sensitive fields...' : 'or click to browse  ·  CSV files only'}
                    </p>
                    {loading && (
                        <div className="spinner" style={{ margin: '20px auto 0' }}></div>
                    )}
                </div>
            </div>

            {/* Hints */}
            <div className="glass-card" style={{ marginBottom: 24 }}>
                <p className="section-title">Supported Formats</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    {[
                        { name: 'Kaggle creditcard.csv', desc: 'V1-V28 features + Amount + Class' },
                        { name: 'Custom CSV', desc: 'Any columns — target: fraud / class / is_fraud / label' },
                        { name: 'Sample Generator', desc: 'python generate_sample_data.py in backend/' },
                    ].map((item) => (
                        <div key={item.name} style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '12px 16px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <FileText size={14} color="var(--accent-blue)" />
                                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.name}</span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="alert alert-error fade-in" style={{ marginBottom: 20 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{error}</span>
                </div>
            )}

            {/* Success Result */}
            {result && (
                <div className="fade-in">
                    <div className="alert alert-success" style={{ marginBottom: 20 }}>
                        <CheckCircle size={16} style={{ flexShrink: 0 }} />
                        <div>
                            <strong>{result.message}</strong>
                            {result.target_column && (
                                <span style={{ marginLeft: 8, opacity: 0.8 }}>
                                    Target: <code style={{ fontFamily: 'var(--font-mono)' }}>{result.target_column}</code>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="stat-grid" style={{ marginBottom: 24 }}>
                        {[
                            { label: 'Rows', val: result.num_rows.toLocaleString(), color: 'blue' },
                            { label: 'Columns', val: result.num_cols, color: 'green' },
                            { label: 'Target Column', val: result.target_column || '—', color: result.target_column ? 'green' : 'orange' },
                        ].map((s) => (
                            <div key={s.label} className={`stat-card ${s.color}`}>
                                <div className={`stat-icon ${s.color}`}><Table size={18} /></div>
                                <div className="stat-val" style={{ fontSize: '1.4rem' }}>{s.val}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Columns */}
                    <div className="glass-card" style={{ marginBottom: 20 }}>
                        <p className="section-title">Detected Columns ({result.columns.length})</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {result.columns.map((col) => (
                                <span
                                    key={col}
                                    className={`badge ${col === result.target_column ? 'badge-fraud' : 'badge-blue'}`}
                                >
                                    {col === result.target_column && '★ '}
                                    {col}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Preview table */}
                    <div className="glass-card">
                        <p className="section-title">Data Preview (first 5 rows)</p>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>{result.columns.slice(0, 10).map((c) => <th key={c}>{c}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {result.preview.map((row, i) => (
                                        <tr key={i}>
                                            {result.columns.slice(0, 10).map((c) => (
                                                <td key={c} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                                                    {String(row[c] ?? '').slice(0, 20)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {result.columns.length > 10 && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 10 }}>
                                + {result.columns.length - 10} more columns not shown
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
