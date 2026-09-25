import { useState, useRef } from 'react'
import { Search, AlertCircle, CheckCircle, Upload, Download } from 'lucide-react'
import { predictSingle, predictBatch } from '../api'

function RiskGauge({ score }) {
    const pct = Math.round(score * 100)
    const color = score > 0.7 ? '#fc8181' : score > 0.4 ? '#f6ad55' : '#48bb78'
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Risk Score</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color, fontSize: '1.1rem' }}>{pct}%</span>
            </div>
            <div className="risk-bar-track">
                <div className="risk-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
            </div>
        </div>
    )
}

function FeatureBar({ feature, contribution, direction, maxAbs }) {
    const pct = maxAbs > 0 ? Math.min(100, Math.abs(contribution) / maxAbs * 100) : 0
    return (
        <div className="feature-bar-row">
            <span className="feature-bar-label" title={feature}>{feature}</span>
            <div className="feature-bar-track">
                <div className={`feature-bar-fill ${direction === 'increases_risk' ? 'pos' : 'neg'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="feature-bar-val">{contribution > 0 ? '+' : ''}{contribution.toFixed(4)}</span>
        </div>
    )
}

const DEFAULT_FEATURES = {
    Time: 80000, Amount: 284.0,
    V1: -1.35, V2: -0.07, V3: 2.54, V4: 1.37, V5: -0.34,
    V6: 0.46, V7: 0.24, V8: 0.10, V9: 0.36, V10: 0.09,
    V11: -0.55, V12: -0.62, V13: -0.99, V14: -0.31, V15: 1.47,
    V16: -0.47, V17: 0.21, V18: 0.02, V19: 0.40, V20: 0.25,
    V21: -0.02, V22: 0.28, V23: -0.11, V24: 0.07, V25: 0.13,
    V26: -0.19, V27: 0.13, V28: -0.02,
}

const PRESETS = [
    {
        name: '🟢 Clean Transaction',
        desc: 'Typical cardholder purchase ($42.50, low risk)',
        features: {
            Time: 45000, Amount: 42.50,
            V1: -0.12, V2: 0.15, V3: 0.88, V4: -0.42, V5: 0.10,
            V6: 0.22, V7: 0.05, V8: -0.08, V9: 0.35, V10: 0.12,
            V11: -0.18, V12: 0.04, V13: -0.25, V14: -0.08, V15: 0.45,
            V16: 0.12, V17: -0.05, V18: 0.08, V19: -0.12, V20: 0.04,
            V21: 0.01, V22: -0.05, V23: 0.02, V24: 0.04, V25: 0.02,
            V26: -0.03, V27: 0.01, V28: 0.00,
        },
    },
    {
        name: '🔴 Stolen Card Attack',
        desc: 'Acute outlier behavioral signals ($1,420, high risk)',
        features: {
            Time: 92000, Amount: 1420.0,
            V1: -4.85, V2: 3.92, V3: -6.42, V4: 4.88, V5: -2.15,
            V6: -1.82, V7: -5.10, V8: 2.45, V9: -3.12, V10: -6.80,
            V11: 4.12, V12: -6.95, V13: 0.45, V14: -8.45, V15: -0.85,
            V16: -4.20, V17: -8.12, V18: -2.85, V19: 1.85, V20: 0.95,
            V21: 0.88, V22: -0.42, V23: -0.35, V24: 0.12, V25: 0.45,
            V26: 0.52, V27: 1.15, V28: 0.42,
        },
    },
    {
        name: '🟡 Suspicious / Review',
        desc: 'Unusual amount ($640, moderate deviation)',
        features: {
            Time: 62000, Amount: 640.0,
            V1: -1.85, V2: 1.25, V3: -1.95, V4: 2.15, V5: -0.85,
            V6: -0.45, V7: -1.42, V8: 0.85, V9: -1.25, V10: -2.10,
            V11: 1.45, V12: -2.35, V13: 0.12, V14: -3.10, V15: -0.15,
            V16: -1.45, V17: -2.85, V18: -0.95, V19: 0.65, V20: 0.35,
            V21: 0.32, V22: -0.15, V23: -0.08, V24: 0.05, V25: 0.18,
            V26: 0.22, V27: 0.45, V28: 0.12,
        },
    },
]

export default function PredictPage() {
    const [tab, setTab] = useState('single')
    const [features, setFeatures] = useState(DEFAULT_FEATURES)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [batchLoading, setBatchLoading] = useState(false)
    const [batchResult, setBatchResult] = useState(null)
    const [batchError, setBatchError] = useState(null)
    const fileRef = useRef()

    const handleSinglePredict = async () => {
        setLoading(true)
        setError(null)
        setResult(null)
        try {
            const { data } = await predictSingle(features)
            setResult(data)
        } catch (e) {
            setError(e.response?.data?.detail || e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleBatchFile = async (file) => {
        if (!file) return
        setBatchLoading(true)
        setBatchError(null)
        setBatchResult(null)
        try {
            const form = new FormData()
            form.append('file', file)
            const { data } = await predictBatch(form)
            setBatchResult(data)
        } catch (e) {
            setBatchError(e.response?.data?.detail || e.message)
        } finally {
            setBatchLoading(false)
        }
    }

    const downloadBatchCSV = () => {
        if (!batchResult) return
        const rows = [['row_index', 'fraud_label', 'risk_score']]
        batchResult.predictions.forEach((p) => rows.push([p.row_index, p.fraud_label, p.risk_score]))
        const csv = rows.map((r) => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'batch_predictions.csv'; a.click()
    }

    const maxAbs = result?.explanation ? Math.max(...result.explanation.map((e) => Math.abs(e.contribution)), 1e-9) : 1

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>Fraud Prediction</h2>
                <p>Run single transaction analysis or batch predict from a CSV.</p>
            </div>

            <div className="tabs">
                <button className={`tab-btn${tab === 'single' ? ' active' : ''}`} onClick={() => setTab('single')}>
                    Single Transaction
                </button>
                <button className={`tab-btn${tab === 'batch' ? ' active' : ''}`} onClick={() => setTab('batch')}>
                    Batch Predict
                </button>
            </div>

            {/* ── Single tab ── */}
            {tab === 'single' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
                    {/* Feature form */}
                    <div className="glass-card">
                        <p className="section-title" style={{ marginBottom: 12 }}>Transaction Features</p>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Test:</span>
                            {PRESETS.map((p, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className="btn btn-ghost"
                                    style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 20 }}
                                    onClick={() => {
                                        setFeatures(p.features)
                                        setResult(null)
                                    }}
                                    title={p.desc}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                        <div className="form-grid" style={{ marginBottom: 20 }}>
                            {Object.entries(features).slice(0, 12).map(([key, val]) => (
                                <div key={key} className="form-group">
                                    <label className="form-label">{key}</label>
                                    <input
                                        type="number" step="any"
                                        className="form-input"
                                        value={val}
                                        onChange={(e) => setFeatures((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                                    />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleSinglePredict}
                                disabled={loading}
                            >
                                {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Analyzing…</> : <><Search size={15} /> Predict</>}
                            </button>
                            <button className="btn btn-ghost" onClick={() => setFeatures(DEFAULT_FEATURES)}>
                                Reset to Default
                            </button>
                        </div>
                        {error && <div className="alert alert-error fade-in" style={{ marginTop: 14 }}><AlertCircle size={14} /><span>{error}</span></div>}
                    </div>

                    {/* Results panel */}
                    <div>
                        {!result && !loading && (
                            <div className="glass-card" style={{ textAlign: 'center', padding: '50px 24px' }}>
                                <Search size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Hit Predict to see results</p>
                            </div>
                        )}

                        {result && (
                            <div className="fade-in">
                                {/* Verdict */}
                                <div className={`glass-card ${result.fraud_label === 1 ? 'glow-red fraud-alert-card' : 'glow-green'}`} style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                        <span className={`badge ${result.fraud_label === 1 ? 'badge-fraud' : 'badge-legit'}`} style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
                                            {result.fraud_label === 1 ? '🚨 FRAUD DETECTED' : '✅ LEGITIMATE'}
                                        </span>
                                    </div>
                                    <RiskGauge score={result.risk_score} />
                                </div>

                                {/* Reason codes */}
                                {result.reason_codes?.length > 0 && (
                                    <div className="glass-card" style={{ marginBottom: 16 }}>
                                        <p className="section-title">Reason Codes</p>
                                        {result.reason_codes.map((rc, i) => (
                                            <div key={i} className="reason-code">{rc}</div>
                                        ))}
                                    </div>
                                )}

                                {/* Feature contributions */}
                                {result.explanation?.length > 0 && (
                                    <div className="glass-card">
                                        <p className="section-title">Feature Contributions</p>
                                        {result.explanation.map((item, i) => (
                                            <FeatureBar key={i} {...item} maxAbs={maxAbs} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Batch tab ── */}
            {tab === 'batch' && (
                <div>
                    <div className="glass-card" style={{ marginBottom: 20 }}>
                        <div
                            className="upload-zone"
                            style={{ padding: '40px 30px' }}
                            onClick={() => fileRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); handleBatchFile(e.dataTransfer.files[0]) }}
                        >
                            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
                                onChange={(e) => handleBatchFile(e.target.files[0])} />
                            <div className="upload-icon"><Upload size={24} /></div>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                                {batchLoading ? 'Processing batch…' : 'Upload CSV for batch prediction'}
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 6 }}>
                                Drop a CSV with the same feature columns as training data
                            </p>
                            {batchLoading && <div className="spinner" style={{ margin: '16px auto 0' }}></div>}
                        </div>
                    </div>

                    {batchError && <div className="alert alert-error fade-in" style={{ marginBottom: 16 }}><AlertCircle size={14} /><span>{batchError}</span></div>}

                    {batchResult && (
                        <div className="fade-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <div className="alert alert-success" style={{ flex: 1, marginRight: 12 }}>
                                    <CheckCircle size={14} />
                                    <span><strong>{batchResult.total}</strong> transactions predicted ·
                                        <strong style={{ color: 'var(--accent-red)' }}> {batchResult.predictions.filter(p => p.fraud_label === 1).length} fraud</strong>
                                    </span>
                                </div>
                                <button className="btn btn-green" onClick={downloadBatchCSV}>
                                    <Download size={15} /> Export CSV
                                </button>
                            </div>

                            <div className="glass-card">
                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr><th>Row</th><th>Verdict</th><th>Risk Score</th></tr>
                                        </thead>
                                        <tbody>
                                            {batchResult.predictions.slice(0, 50).map((p) => (
                                                <tr key={p.row_index}>
                                                    <td style={{ fontFamily: 'var(--font-mono)' }}>#{p.row_index}</td>
                                                    <td><span className={`badge ${p.fraud_label === 1 ? 'badge-fraud' : 'badge-legit'}`}>{p.fraud_label === 1 ? 'Fraud' : 'Legit'}</span></td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div className="risk-bar-track" style={{ width: 80, height: 4 }}>
                                                                <div className="risk-bar-fill" style={{ width: `${Math.round(p.risk_score * 100)}%`, background: p.risk_score > 0.5 ? '#fc8181' : '#48bb78' }} />
                                                            </div>
                                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{(p.risk_score * 100).toFixed(1)}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {batchResult.predictions.length > 50 && (
                                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '10px 0 0 16px' }}>
                                        Showing 50 of {batchResult.predictions.length} rows. Export CSV for full results.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
