import { useState, useRef } from 'react'
import { Search, AlertCircle, CheckCircle, Upload, Download, Sparkles, Sliders, Shield, FileText } from 'lucide-react'
import { predictSingle, predictBatch } from '../api'
import { PRESETS, DEMO_TRANSACTIONS, DEFAULT_OPTIMAL_THRESHOLD, DEFAULT_FEATURES } from '../mlEngine'

function RiskGauge({ score, threshold }) {
    const pct = Math.round(score * 100)
    const isOver = score >= threshold
    const color = isOver ? '#fc8181' : score > 0.4 ? '#f6ad55' : '#48bb78'
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Calculated Fraud Probability</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color, fontSize: '1.2rem' }}>
                    {pct}%
                </span>
            </div>
            <div className="risk-bar-track" style={{ height: 10 }}>
                <div
                    className="risk-bar-fill"
                    style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${color}88, ${color})`
                    }}
                />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>0% Safe</span>
                <span style={{ color: 'var(--accent-blue)' }}>Cutoff: {(threshold * 100).toFixed(0)}%</span>
                <span>100% Critical</span>
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
                <div
                    className={`feature-bar-fill ${direction === 'increases_risk' ? 'pos' : 'neg'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="feature-bar-val">
                {contribution > 0 ? '+' : ''}{contribution.toFixed(3)}
            </span>
        </div>
    )
}

export default function PredictPage() {
    const [tab, setTab] = useState('single')
    const [features, setFeatures] = useState(DEFAULT_FEATURES)
    const [threshold, setThreshold] = useState(DEFAULT_OPTIMAL_THRESHOLD)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)

    const [batchLoading, setBatchLoading] = useState(false)
    const [batchResult, setBatchResult] = useState(null)
    const [batchError, setBatchError] = useState(null)
    const [filterClass, setFilterClass] = useState('all')
    const fileRef = useRef()

    const handleSinglePredict = async () => {
        setLoading(true)
        setError(null)
        try {
            const { data } = await predictSingle(features, threshold)
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
            const { data } = await predictBatch(file, threshold)
            setBatchResult(data)
        } catch (e) {
            setBatchError(e.response?.data?.detail || e.message)
        } finally {
            setBatchLoading(false)
        }
    }

    const handleLoadDemoBatch = async () => {
        setBatchLoading(true)
        setBatchError(null)
        try {
            const { data } = await predictBatch(DEMO_TRANSACTIONS, threshold)
            setBatchResult(data)
        } catch (e) {
            setBatchError(e.message)
        } finally {
            setBatchLoading(false)
        }
    }

    const downloadBatchCSV = () => {
        if (!batchResult) return
        const rows = [['transaction_id', 'amount', 'risk_score', 'decision', 'actual_class']]
        batchResult.predictions.forEach((p) => {
            rows.push([p.transaction_id, p.amount, p.risk_score, p.decision, p.actual_class !== null ? p.actual_class : 'N/A'])
        })
        const csv = rows.map((r) => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `scored_transactions_cutoff_${threshold.toFixed(2)}.csv`
        a.click()
    }

    const maxAbs = result?.explanation ? Math.max(...result.explanation.map((e) => Math.abs(e.contribution)), 1e-9) : 1

    const filteredBatch = batchResult?.predictions ? batchResult.predictions.filter((p) => {
        if (filterClass === 'fraud') return p.fraud_label === 1
        if (filterClass === 'legit') return p.fraud_label === 0
        return true
    }) : []

    return (
        <div className="fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2>Fraud Prediction & Risk Scoring</h2>
                    <p>Real-time client inference using pre-trained Logistic Regression + RobustScaler.</p>
                </div>
                {/* Global threshold quick-tuner */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 14px', background: 'rgba(255,255,255,0.03)',
                    borderRadius: 10, border: '1px solid var(--border)'
                }}>
                    <Sliders size={14} color="var(--accent-blue)" />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Cutoff:</span>
                    <input
                        type="range"
                        min="0.10"
                        max="0.95"
                        step="0.01"
                        value={threshold}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value)
                            setThreshold(val)
                            if (result) handleSinglePredict()
                        }}
                        style={{ width: 90, accentColor: 'var(--accent-blue)' }}
                    />
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.84rem', color: 'var(--accent-blue)' }}>
                        {threshold.toFixed(2)}
                    </span>
                    {threshold === 0.84 && (
                        <span style={{ fontSize: '0.68rem', color: '#48bb78', background: 'rgba(72,187,120,0.15)', padding: '2px 6px', borderRadius: 4 }}>
                            Optimal
                        </span>
                    )}
                </div>
            </div>

            <div className="tabs">
                <button className={`tab-btn${tab === 'single' ? ' active' : ''}`} onClick={() => setTab('single')}>
                    Single Transaction
                </button>
                <button className={`tab-btn${tab === 'batch' ? ' active' : ''}`} onClick={() => setTab('batch')}>
                    Batch CSV Analysis
                </button>
            </div>

            {/* ── Single tab ── */}
            {tab === 'single' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
                    {/* Feature form */}
                    <div className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <p className="section-title" style={{ margin: 0 }}>Transaction Features</p>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>30 PCA + Amount inputs</span>
                        </div>

                        {/* Presets */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
                                Quick Test Presets:
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {PRESETS.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        className="btn btn-ghost"
                                        style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: 20 }}
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
                        </div>

                        {/* Dropdown for all 30 demo transactions */}
                        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Or choose from 30 benchmark transactions:</span>
                            <select
                                style={{
                                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                    color: 'var(--text-primary)', fontSize: '0.75rem', padding: '4px 8px', borderRadius: 6
                                }}
                                onChange={(e) => {
                                    const idx = parseInt(e.target.value)
                                    if (!isNaN(idx) && DEMO_TRANSACTIONS[idx]) {
                                        setFeatures(DEMO_TRANSACTIONS[idx])
                                        setResult(null)
                                    }
                                }}
                            >
                                <option value="">-- Select Transaction --</option>
                                {DEMO_TRANSACTIONS.map((tx, idx) => (
                                    <option key={idx} value={idx}>
                                        Tx #{String(idx + 1).padStart(2, '0')}: ${parseFloat(tx.Amount).toFixed(2)} ({tx.Class === 1 ? 'Fraud' : 'Legit'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Form Inputs */}
                        <div className="form-grid" style={{ marginBottom: 20 }}>
                            {['Amount', 'Time', 'V14', 'V4', 'V12', 'V10', 'V17', 'V11', 'V1', 'V2', 'V3', 'V7'].map((key) => (
                                <div key={key} className="form-group">
                                    <label className="form-label">{key}</label>
                                    <input
                                        type="number"
                                        step="any"
                                        className="form-input"
                                        value={features[key] ?? 0}
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
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                <Search size={15} />
                                {loading ? 'Evaluating…' : 'Analyze Transaction'}
                            </button>
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setFeatures(DEFAULT_FEATURES)
                                    setResult(null)
                                }}
                            >
                                Reset
                            </button>
                        </div>

                        {error && (
                            <div className="alert alert-error" style={{ marginTop: 16 }}>
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    {/* Prediction Result Card */}
                    <div>
                        {result ? (
                            <div className="glass-card fade-in" style={{
                                border: result.fraud_label === 1
                                    ? '1px solid rgba(252, 129, 129, 0.4)'
                                    : '1px solid rgba(72, 187, 120, 0.4)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                        {result.transaction_id}
                                    </span>
                                    <span style={{
                                        fontSize: '0.68rem', padding: '2px 8px', borderRadius: 12,
                                        background: result.fraud_label === 1 ? 'rgba(252, 129, 129, 0.15)' : 'rgba(72, 187, 120, 0.15)',
                                        color: result.fraud_label === 1 ? '#fc8181' : '#48bb78',
                                        fontWeight: 700
                                    }}>
                                        {result.decision}
                                    </span>
                                </div>

                                {/* Decision Badge */}
                                <div style={{
                                    padding: '16px',
                                    borderRadius: 12,
                                    textAlign: 'center',
                                    marginBottom: 18,
                                    background: result.fraud_label === 1 ? 'rgba(252, 129, 129, 0.1)' : 'rgba(72, 187, 120, 0.1)',
                                    border: result.fraud_label === 1 ? '1px solid #fc8181' : '1px solid #48bb78',
                                }}>
                                    {result.fraud_label === 1 ? (
                                        <>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fc8181', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                <AlertCircle size={22} /> FRAUD DETECTED
                                            </div>
                                            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                                Triggering Step-Up 2FA Challenge & Fraud Review
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#48bb78', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                <CheckCircle size={22} /> LEGITIMATE
                                            </div>
                                            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                                Seamless Instant Cardholder Authorization
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Risk Gauge */}
                                <div style={{ marginBottom: 20 }}>
                                    <RiskGauge score={result.risk_score} threshold={threshold} />
                                </div>

                                {/* Reason Codes */}
                                {result.reason_codes?.length > 0 && (
                                    <div style={{ marginBottom: 18 }}>
                                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                                            Decision Explainability Reasons:
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {result.reason_codes.map((r, i) => (
                                                <div key={i} style={{
                                                    fontSize: '0.74rem', padding: '6px 10px',
                                                    background: 'rgba(255,255,255,0.02)', borderRadius: 6,
                                                    borderLeft: `3px solid ${result.fraud_label === 1 ? '#fc8181' : '#48bb78'}`
                                                }}>
                                                    {r}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Feature Contributions */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                            Log-Odds Feature Contributions:
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Top 6</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {result.explanation?.slice(0, 6).map((e) => (
                                            <FeatureBar
                                                key={e.feature}
                                                feature={e.feature}
                                                contribution={e.contribution}
                                                direction={e.direction}
                                                maxAbs={maxAbs}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-card empty-state" style={{ minHeight: 340, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Shield size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Ready to Evaluate</p>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 240, margin: '0 auto' }}>
                                    Select a quick preset or click "Analyze Transaction" to run in-browser inference.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Batch tab ── */}
            {tab === 'batch' && (
                <div>
                    <div className="glass-card" style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                            <div>
                                <p className="section-title" style={{ margin: 0 }}>Batch Transaction Scoring</p>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                                    Upload any CSV or run the 30 Synchrony interview benchmark transactions.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleLoadDemoBatch}
                                    disabled={batchLoading}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    <Sparkles size={14} />
                                    Load 30 Interview Demo Transactions
                                </button>
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => fileRef.current?.click()}
                                    disabled={batchLoading}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    <Upload size={14} /> Upload Custom CSV
                                </button>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".csv"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleBatchFile(e.target.files[0])}
                                />
                            </div>
                        </div>

                        {batchError && (
                            <div className="alert alert-error" style={{ marginTop: 14 }}>
                                <AlertCircle size={15} />
                                <span>{batchError}</span>
                            </div>
                        )}
                    </div>

                    {/* Batch Results */}
                    {batchResult && (
                        <div className="fade-in">
                            {/* Summary KPI Grid */}
                            <div className="stat-grid" style={{ marginBottom: 20 }}>
                                <div className="stat-card blue">
                                    <div className="stat-val">{batchResult.total_scanned}</div>
                                    <div className="stat-label">Transactions Evaluated</div>
                                </div>
                                <div className="stat-card red">
                                    <div className="stat-val">{batchResult.fraud_count}</div>
                                    <div className="stat-label">Fraud Detected (2FA Challenged)</div>
                                </div>
                                <div className="stat-card green">
                                    <div className="stat-val">{batchResult.legitimate_count}</div>
                                    <div className="stat-label">Legitimate (Approved)</div>
                                </div>
                                <div className="stat-card orange">
                                    <div className="stat-val">${batchResult.prevented_fraud_amount?.toLocaleString()}</div>
                                    <div className="stat-label">Protected Transaction Volume</div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="glass-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Filter:</span>
                                        <button
                                            className={`btn btn-ghost${filterClass === 'all' ? ' active' : ''}`}
                                            style={{ fontSize: '0.74rem', padding: '3px 10px' }}
                                            onClick={() => setFilterClass('all')}
                                        >
                                            All ({batchResult.predictions.length})
                                        </button>
                                        <button
                                            className={`btn btn-ghost${filterClass === 'fraud' ? ' active' : ''}`}
                                            style={{ fontSize: '0.74rem', padding: '3px 10px', color: '#fc8181' }}
                                            onClick={() => setFilterClass('fraud')}
                                        >
                                            Fraud ({batchResult.fraud_count})
                                        </button>
                                        <button
                                            className={`btn btn-ghost${filterClass === 'legit' ? ' active' : ''}`}
                                            style={{ fontSize: '0.74rem', padding: '3px 10px', color: '#48bb78' }}
                                            onClick={() => setFilterClass('legit')}
                                        >
                                            Legit ({batchResult.legitimate_count})
                                        </button>
                                    </div>

                                    <button
                                        className="btn btn-ghost"
                                        onClick={downloadBatchCSV}
                                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem' }}
                                    >
                                        <Download size={14} /> Download Scored CSV
                                    </button>
                                </div>

                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Transaction ID</th>
                                                <th>Amount</th>
                                                <th>Risk Score</th>
                                                <th>Decision (Cutoff {threshold.toFixed(2)})</th>
                                                <th>Actual Label</th>
                                                <th>Accuracy Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredBatch.map((row) => {
                                                const isMatch = row.actual_class !== null
                                                    ? (row.fraud_label === row.actual_class)
                                                    : true

                                                return (
                                                    <tr key={row.row_index}>
                                                        <td style={{ color: 'var(--text-muted)' }}>{row.row_index}</td>
                                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                                                            {row.transaction_id}
                                                        </td>
                                                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                                                            ${Number(row.amount || 0).toFixed(2)}
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <div className="risk-bar-track" style={{ width: 60, height: 6 }}>
                                                                    <div
                                                                        className="risk-bar-fill"
                                                                        style={{
                                                                            width: `${Math.round(row.risk_score * 100)}%`,
                                                                            background: row.fraud_label === 1 ? '#fc8181' : '#48bb78'
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: row.fraud_label === 1 ? '#fc8181' : '#48bb78' }}>
                                                                    {(row.risk_score * 100).toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span style={{
                                                                fontSize: '0.72rem', padding: '2px 8px', borderRadius: 10,
                                                                fontWeight: 700,
                                                                background: row.fraud_label === 1 ? 'rgba(252,129,129,0.15)' : 'rgba(72,187,120,0.15)',
                                                                color: row.fraud_label === 1 ? '#fc8181' : '#48bb78',
                                                            }}>
                                                                {row.decision}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontSize: '0.76rem' }}>
                                                            {row.actual_class !== null ? (
                                                                row.actual_class === 1 ? '🔴 Fraud' : '🟢 Legit'
                                                            ) : '—'}
                                                        </td>
                                                        <td>
                                                            {row.actual_class !== null ? (
                                                                isMatch ? (
                                                                    <span style={{ color: '#48bb78', fontSize: '0.74rem', fontWeight: 600 }}>✓ Correct</span>
                                                                ) : (
                                                                    <span style={{ color: '#f6ad55', fontSize: '0.74rem', fontWeight: 600 }}>Mismatch</span>
                                                                )
                                                            ) : 'Scored'}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
