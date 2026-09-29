import { useState, useRef } from 'react'
import {
    DEMO_TRANSACTIONS,
    FEATURE_NAMES,
    calculatePrediction,
    calculateBatchPredictions,
    DEFAULT_OPTIMAL_THRESHOLD,
} from './mlEngine'
import {
    CheckCircle2,
    AlertCircle,
    UploadCloud,
    Download,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Play,
    Zap,
    Shield
} from 'lucide-react'
import './streamlitTheme.css'

export default function App() {
    const [activeTab, setActiveTab] = useState('sample')

    // Tab 1 state
    const [selectedIdx, setSelectedIdx] = useState(0)
    const [showFeatures, setShowFeatures] = useState(false)
    const [analysisResult, setAnalysisResult] = useState(null)
    const [showExplanation, setShowExplanation] = useState(true)

    // Tab 2 state
    const [batchData, setBatchData] = useState(null)
    const [batchLoading, setBatchLoading] = useState(false)
    const [batchResult, setBatchResult] = useState(null)
    const [fileName, setFileName] = useState('')
    const fileInputRef = useRef()

    const selectedRow = DEMO_TRANSACTIONS[selectedIdx] || DEMO_TRANSACTIONS[0]

    const handleAnalyze = () => {
        const res = calculatePrediction(selectedRow, DEFAULT_OPTIMAL_THRESHOLD)
        setAnalysisResult(res)
    }

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setFileName(file.name)
        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target?.result
            if (typeof text === 'string') {
                const rows = parseCSV(text)
                setBatchData(rows)
                setBatchResult(null)
            }
        }
        reader.readAsText(file)
    }

    const handleLoadDemoCSV = () => {
        setFileName('demo_transactions.csv (30 benchmark rows)')
        setBatchData(DEMO_TRANSACTIONS)
        setBatchResult(null)
    }

    const handleScoreBatch = () => {
        if (!batchData || !batchData.length) return
        setBatchLoading(true)
        setTimeout(() => {
            const res = calculateBatchPredictions(batchData, DEFAULT_OPTIMAL_THRESHOLD)
            setBatchResult(res)
            setBatchLoading(false)
        }, 150)
    }

    const handleDownloadCSV = () => {
        if (!batchResult) return
        const headers = ['Time', 'Amount', 'fraud_probability', 'risk_score', 'decision', 'Actual_Class']
        const csvRows = [headers.join(',')]
        batchResult.predictions.forEach((p, idx) => {
            const orig = batchData[idx] || {}
            csvRows.push([
                orig.Time ?? '',
                orig.Amount ?? p.amount,
                (p.risk_score / 100).toFixed(4),
                p.risk_score,
                p.decision,
                p.actual_class !== null ? p.actual_class : ''
            ].join(','))
        })
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'scored_fraud_predictions.csv'
        a.click()
    }

    return (
        <div className="st-app">
            {/* ── Left Sidebar (Streamlit st.sidebar replica) ── */}
            <aside className="st-sidebar">
                <h3>⚙️ System Status</h3>
                <div className="st-alert st-alert-success">
                    <CheckCircle2 size={16} />
                    <span><strong>Model Status:</strong> Loaded ✓</span>
                </div>

                <hr />

                <h3>🧠 Model Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#334155' }}>
                    <div><strong>Algorithm:</strong> <code style={{ background: '#E2E8F0', padding: '2px 6px', borderRadius: 4 }}>Logistic Regression</code></div>
                    <div><strong>Imbalance Handling:</strong> <code style={{ background: '#E2E8F0', padding: '2px 6px', borderRadius: 4 }}>SMOTE</code></div>
                    <div><strong>Scaler:</strong> <code style={{ background: '#E2E8F0', padding: '2px 6px', borderRadius: 4 }}>RobustScaler</code></div>
                    <div><strong>Decision Threshold:</strong> <code style={{ background: '#E2E8F0', padding: '2px 6px', borderRadius: 4 }}>0.84 (84.0%)</code></div>
                </div>

                <hr />

                <h3>📊 Test Set Metrics</h3>
                <div className="metric-card" style={{ marginBottom: 10 }}>
                    <div className="metric-label">PR-AUC Score</div>
                    <div className="metric-value" style={{ color: '#1E40AF' }}>0.7388</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="metric-card">
                        <div className="metric-label">Precision (Optimal)</div>
                        <div className="metric-value" style={{ fontSize: '1.25rem', color: '#1E40AF' }}>52.41%</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Recall (Optimal)</div>
                        <div className="metric-value" style={{ fontSize: '1.25rem', color: '#1E40AF' }}>88.78%</div>
                    </div>
                </div>

                <hr />

                <h3>💰 Business Cost Model</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: 8 }}>
                    Illustrative business cost assumptions:
                </p>
                <ul style={{ fontSize: '0.82rem', paddingLeft: 18, color: '#334155', marginBottom: 12 }}>
                    <li><strong>False Negative (missed fraud):</strong> $150</li>
                    <li><strong>False Positive (false alert):</strong> $5</li>
                </ul>

                <div className="st-alert st-alert-info" style={{ fontSize: '0.82rem' }}>
                    <span><strong>Cost Savings:</strong> $1,290 (38.7% vs default 0.50 threshold)</span>
                </div>

                <hr />

                <div style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#03543F', fontWeight: 600, marginBottom: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#31C48D', display: 'inline-block' }}></span>
                        Live on GitHub Pages
                    </div>
                    <span>In-Browser Scikit-Learn Inference</span>
                    <br />
                    <a
                        href="https://github.com/Adityakasara/fraud-detection"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1E40AF', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8 }}
                    >
                        GitHub Repository <ExternalLink size={12} />
                    </a>
                </div>
            </aside>

            {/* ── Main Content Container ── */}
            <main className="st-main">
                <div className="main-header">
                    <Shield size={32} color="#1E40AF" />
                    <span>Credit Card Fraud Detection</span>
                </div>
                <div className="sub-header">
                    ML-based transaction risk analysis
                </div>

                {/* Tabs */}
                <div className="st-tabs">
                    <button
                        className={`st-tab-btn${activeTab === 'sample' ? ' active' : ''}`}
                        onClick={() => setActiveTab('sample')}
                    >
                        🔍 Option A: Sample Transaction
                    </button>
                    <button
                        className={`st-tab-btn${activeTab === 'batch' ? ' active' : ''}`}
                        onClick={() => setActiveTab('batch')}
                    >
                        📂 Option B: Batch CSV Upload
                    </button>
                    <button
                        className={`st-tab-btn${activeTab === 'pipeline' ? ' active' : ''}`}
                        onClick={() => setActiveTab('pipeline')}
                    >
                        📖 How The System Works
                    </button>
                </div>

                {/* ═══════════════════════════════════════════
                    TAB 1: SAMPLE TRANSACTION DEMO
                   ═══════════════════════════════════════════ */}
                {activeTab === 'sample' && (
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>
                            Live Fraud Scoring Demo
                        </h3>
                        <p style={{ color: '#64748B', marginBottom: 16, fontSize: '0.92rem' }}>
                            Select a transaction from the test dataset to evaluate it with the trained model in real time.
                        </p>

                        <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1E293B' }}>
                            Select Demo Transaction:
                        </label>
                        <select
                            className="st-select"
                            value={selectedIdx}
                            onChange={(e) => {
                                setSelectedIdx(parseInt(e.target.value))
                                setAnalysisResult(null)
                            }}
                        >
                            {DEMO_TRANSACTIONS.map((row, idx) => {
                                const actualLabel = row.Class === 1 ? 'Fraud' : 'Legitimate'
                                return (
                                    <option key={idx} value={idx}>
                                        {`Transaction #${String(idx + 1).padStart(2, '0')} — Amount: $${parseFloat(row.Amount).toFixed(2)} (Actual: ${actualLabel})`}
                                    </option>
                                )
                            })}
                        </select>

                        {/* Feature Preview Expander */}
                        <div className="st-expander">
                            <div
                                className="st-expander-header"
                                onClick={() => setShowFeatures(!showFeatures)}
                            >
                                <span>View Transaction Feature Details</span>
                                {showFeatures ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                            {showFeatures && (
                                <div className="st-expander-body">
                                    <div className="st-table-wrapper">
                                        <table className="st-table">
                                            <thead>
                                                <tr>
                                                    {FEATURE_NAMES.slice(0, 10).map((f) => <th key={f}>{f}</th>)}
                                                    <th>...</th>
                                                    <th>Amount</th>
                                                    <th>Actual Class</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    {FEATURE_NAMES.slice(0, 10).map((f) => (
                                                        <td key={f}>{Number(selectedRow[f]).toFixed(4)}</td>
                                                    ))}
                                                    <td>...</td>
                                                    <td><strong>${Number(selectedRow.Amount).toFixed(2)}</strong></td>
                                                    <td>
                                                        <span style={{
                                                            color: selectedRow.Class === 1 ? '#9B1C1C' : '#03543F',
                                                            fontWeight: 700
                                                        }}>
                                                            {selectedRow.Class === 1 ? '1 (Fraud)' : '0 (Legit)'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Button */}
                        <div style={{ margin: '20px 0' }}>
                            <button
                                className="st-btn-primary"
                                onClick={handleAnalyze}
                            >
                                🚀 Analyze Transaction
                            </button>
                        </div>

                        {/* Analysis Results */}
                        {analysisResult && (
                            <div style={{ marginTop: 28 }}>
                                <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '24px 0' }} />
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16 }}>
                                    🎯 Analysis Results
                                </h3>

                                <div className="st-metric-group">
                                    <div className="metric-card">
                                        <div className="metric-label">Fraud Probability</div>
                                        <div className="metric-value">
                                            {(analysisResult.probability * 100).toFixed(2)}%
                                        </div>
                                    </div>
                                    <div className="metric-card">
                                        <div className="metric-label">Model Risk Score</div>
                                        <div className="metric-value">
                                            {(analysisResult.risk_score * 100).toFixed(1)} / 100
                                        </div>
                                    </div>
                                    <div className="metric-card">
                                        <div className="metric-label">Decision Threshold</div>
                                        <div className="metric-value">
                                            {(analysisResult.threshold * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="metric-card">
                                        <div className="metric-label">Actual Ground Truth</div>
                                        <div className="metric-value" style={{
                                            color: selectedRow.Class === 1 ? '#9B1C1C' : '#03543F'
                                        }}>
                                            {selectedRow.Class === 1 ? 'FRAUD' : 'LEGITIMATE'}
                                        </div>
                                    </div>
                                </div>

                                {/* Big Decision Banner */}
                                <div style={{ margin: '24px 0' }}>
                                    {analysisResult.fraud_label === 1 ? (
                                        <div className="decision-badge-fraud">
                                            🔴 FINAL DECISION: FRAUD (Risk Score: {(analysisResult.risk_score * 100).toFixed(1)}/100 exceeds threshold {(DEFAULT_OPTIMAL_THRESHOLD * 100).toFixed(1)}%)
                                        </div>
                                    ) : (
                                        <div className="decision-badge-legit">
                                            🟢 FINAL DECISION: LEGITIMATE (Risk Score: {(analysisResult.risk_score * 100).toFixed(1)}/100 is below threshold {(DEFAULT_OPTIMAL_THRESHOLD * 100).toFixed(1)}%)
                                        </div>
                                    )}
                                </div>

                                {/* Decision Explanation & Business Context Expander */}
                                <div className="st-expander">
                                    <div
                                        className="st-expander-header"
                                        onClick={() => setShowExplanation(!showExplanation)}
                                    >
                                        <span>💡 Decision Explanation &amp; Business Context</span>
                                        {showExplanation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                    {showExplanation && (
                                        <div className="st-expander-body">
                                            <ul style={{ paddingLeft: 18, lineHeight: 1.8 }}>
                                                <li>
                                                    <strong>Calculated Fraud Probability:</strong> <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>{analysisResult.probability.toFixed(4)}</code>
                                                </li>
                                                <li>
                                                    <strong>Cost-Optimized Cutoff:</strong> <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>{DEFAULT_OPTIMAL_THRESHOLD.toFixed(2)}</code> (selected to minimize False Negatives and False Positives based on business costs)
                                                </li>
                                                {analysisResult.fraud_label === 1 ? (
                                                    <li>
                                                        <strong>Action Recommended:</strong> Flag transaction for immediate 2FA verification or secondary authorization review.
                                                    </li>
                                                ) : (
                                                    <li>
                                                        <strong>Action Recommended:</strong> Approve transaction seamlessly with frictionless customer checkout.
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════
                    TAB 2: BATCH CSV UPLOAD DEMO
                   ═══════════════════════════════════════════ */}
                {activeTab === 'batch' && (
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>
                            Batch Transaction Analysis
                        </h3>
                        <p style={{ color: '#64748B', marginBottom: 20, fontSize: '0.92rem' }}>
                            Upload a CSV file containing transactions (<code style={{ background: '#F1F5F9', padding: '2px 4px', borderRadius: 4 }}>Time</code>, <code style={{ background: '#F1F5F9', padding: '2px 4px', borderRadius: 4 }}>V1</code>–<code style={{ background: '#F1F5F9', padding: '2px 4px', borderRadius: 4 }}>V28</code>, <code style={{ background: '#F1F5F9', padding: '2px 4px', borderRadius: 4 }}>Amount</code>) to score all rows simultaneously.
                        </p>

                        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                            <button
                                className="st-btn-secondary"
                                onClick={handleLoadDemoCSV}
                            >
                                <Zap size={16} color="#1E40AF" />
                                ⚡ Load Pre-packaged 30 Benchmark Transactions
                            </button>
                        </div>

                        {/* File dropzone */}
                        <div
                            className="st-file-dropzone"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <UploadCloud size={36} color="#64748B" style={{ margin: '0 auto 8px', display: 'block' }} />
                            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1E293B' }}>
                                {fileName ? `Selected: ${fileName}` : 'Drag and drop transaction CSV here, or click to browse'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: 4 }}>
                                Limit 200MB per file · CSV format with Time, V1-V28, Amount
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                style={{ display: 'none' }}
                                onChange={handleFileUpload}
                            />
                        </div>

                        {batchData && batchData.length > 0 && (
                            <div style={{ margin: '20px 0' }}>
                                <div className="st-alert st-alert-success">
                                    <CheckCircle2 size={16} />
                                    <span>✓ Loaded {batchData.length.toLocaleString()} transactions successfully.</span>
                                </div>

                                <button
                                    className="st-btn-primary"
                                    onClick={handleScoreBatch}
                                    disabled={batchLoading}
                                >
                                    {batchLoading ? 'Scoring...' : '⚡ Score Uploaded Transactions'}
                                </button>
                            </div>
                        )}

                        {/* Batch Results */}
                        {batchResult && (
                            <div style={{ marginTop: 28 }}>
                                <div className="st-metric-group">
                                    <div className="metric-card">
                                        <div className="metric-label">Total Transactions</div>
                                        <div className="metric-value">{batchResult.total_scanned.toLocaleString()}</div>
                                    </div>
                                    <div className="metric-card">
                                        <div className="metric-label">🟢 Approved Legitimate</div>
                                        <div className="metric-value" style={{ color: '#03543F' }}>
                                            {batchResult.legitimate_count.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="metric-card">
                                        <div className="metric-label">🔴 Flagged as Fraud</div>
                                        <div className="metric-value" style={{ color: '#9B1C1C' }}>
                                            {batchResult.fraud_count.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '20px 0 10px' }}>
                                    Scored Results Preview:
                                </h4>

                                <div className="st-table-wrapper">
                                    <table className="st-table">
                                        <thead>
                                            <tr>
                                                <th>Time</th>
                                                <th>Amount</th>
                                                <th>fraud_probability</th>
                                                <th>risk_score</th>
                                                <th>decision</th>
                                                <th>Class</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {batchResult.predictions.slice(0, 30).map((row, idx) => {
                                                const orig = batchData[idx] || {}
                                                return (
                                                    <tr key={idx}>
                                                        <td>{orig.Time !== undefined ? Number(orig.Time).toFixed(1) : '—'}</td>
                                                        <td>${Number(orig.Amount || row.amount).toFixed(2)}</td>
                                                        <td>{(row.risk_score / 100).toFixed(4)}</td>
                                                        <td>{row.risk_score}</td>
                                                        <td>
                                                            <span style={{
                                                                color: row.fraud_label === 1 ? '#9B1C1C' : '#03543F',
                                                                fontWeight: 700
                                                            }}>
                                                                {row.decision}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {orig.Class !== undefined ? (
                                                                <span style={{ fontWeight: 600 }}>{orig.Class}</span>
                                                            ) : '—'}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ marginTop: 20 }}>
                                    <button
                                        className="st-btn-secondary"
                                        onClick={handleDownloadCSV}
                                    >
                                        <Download size={16} />
                                        📥 Download Scored Transactions as CSV
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════
                    TAB 3: HOW THE SYSTEM WORKS
                   ═══════════════════════════════════════════ */}
                {activeTab === 'pipeline' && (
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>
                            How the Pipeline Works
                        </h3>

                        <pre className="st-code">
{`Transaction Data (Time, V1–V28, Amount)
   ↓
Train/Test Split (Stratified 80/20, preserving 0.17% fraud ratio)
   ↓
RobustScaler (Fitted strictly on training data to avoid data leakage)
   ↓
SMOTE (Applied strictly on training data to 20% minority ratio)
   ↓
Logistic Regression (Calibrated, interpretable linear classification)
   ↓
Fraud Probability Score (P(y = 1 | X))
   ↓
Business Threshold Optimization (Minimizing FN*$150 + FP*$5)
   ↓
Final Decision: 🟢 Legitimate vs 🔴 Fraud`}
                        </pre>

                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
                            Why These Techniques?
                        </h3>

                        <div style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.8 }}>
                            <p style={{ marginBottom: 10 }}>
                                <strong>1. Stratified Split:</strong> Preserves the ultra-rare 0.17% fraud prevalence in both train and test partitions.
                            </p>
                            <p style={{ marginBottom: 10 }}>
                                <strong>2. RobustScaler on Training Only:</strong> Real credit card transaction amounts have extreme outliers; RobustScaler uses medians and interquartile ranges (IQR). Fitting strictly on <code style={{ background: '#F1F5F9', padding: '2px 4px', borderRadius: 4 }}>X_train</code> prevents test distribution leakage.
                            </p>
                            <p style={{ marginBottom: 10 }}>
                                <strong>3. SMOTE on Training Only:</strong> Balances the decision boundary during training. Testing data must stay un-oversampled to measure real-world performance.
                            </p>
                            <p style={{ marginBottom: 10 }}>
                                <strong>4. Logistic Regression:</strong> High interpretability, linear decision boundary, and direct probability calibration needed for threshold testing.
                            </p>
                            <p style={{ marginBottom: 10 }}>
                                <strong>5. Business-Based Threshold Optimization:</strong> In retail cards (like Synchrony), missing fraud ($150) and customer insults ($5) have asymmetric costs. Shifting threshold from 0.50 to 0.84 cuts false alarms by 76.6% while catching the exact same 87 frauds, saving $1,290 in test cost.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

/**
 * CSV parser helper
 */
function parseCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/)
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''))
    const records = []

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        const vals = line.split(',')
        const obj = {}
        headers.forEach((h, idx) => {
            const v = vals[idx]?.trim()
            obj[h] = isNaN(Number(v)) ? v : Number(v)
        })
        records.push(obj)
    }

    return records
}
