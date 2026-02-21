import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { getMetrics } from '../api'

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem'
            }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                {payload.map((p) => (
                    <div key={p.name} style={{ color: p.color }}>
                        {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(4) : p.value}</strong>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

export default function MetricsPage() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchMetrics = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await getMetrics()
            setData(res.data)
        } catch (e) {
            setError(e.response?.data?.detail || e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchMetrics() }, [])

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4, margin: '0 auto 16px' }}></div>
                <p style={{ color: 'var(--text-muted)' }}>Loading metrics…</p>
            </div>
        </div>
    )

    if (error) return (
        <div className="fade-in">
            <div className="page-header"><h2>Metrics</h2></div>
            <div className="alert alert-error">
                <AlertCircle size={16} />
                <span>{error}</span>
            </div>
        </div>
    )

    const prCurveData = data?.pr_curve
        ? data.pr_curve.recall.map((r, i) => ({ recall: parseFloat(r.toFixed(3)), precision: parseFloat(data.pr_curve.precision[i]?.toFixed(3) ?? 0) }))
        : []

    const scoreDistData = data?.score_distribution
        ? data.score_distribution.bins.map((b, i) => ({
            bin: b,
            fraud: data.score_distribution.fraud[i],
            legitimate: data.score_distribution.legitimate[i],
        }))
        : []

    const cm = data?.confusion_matrix || [[0, 0], [0, 0]]

    return (
        <div className="fade-in">
            <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <h2>Model Metrics</h2>
                    <p>Active model: <strong style={{ color: 'var(--accent-blue)' }}>{data?.model_type || '—'}</strong>
                        {' '}&nbsp;<span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>v{data?.model_version?.split('_')[2] || ''}</span>
                    </p>
                </div>
                <button className="btn btn-ghost" onClick={fetchMetrics}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Metric chips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
                {[
                    { label: 'Precision', val: data?.precision, color: '#63b3ed' },
                    { label: 'Recall', val: data?.recall, color: '#48bb78' },
                    { label: 'F1 Score', val: data?.f1, color: '#9f7aea' },
                    { label: 'PR-AUC', val: data?.pr_auc, color: '#f6ad55' },
                ].map((item) => (
                    <div key={item.label} className="metric-chip" style={{ borderTop: `3px solid ${item.color}` }}>
                        <span className="val" style={{ color: item.color, fontSize: '2rem' }}>
                            {item.val != null ? (item.val * 100).toFixed(2) + '%' : '—'}
                        </span>
                        <span className="label">{item.label}</span>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                {/* PR Curve */}
                <div className="glass-card">
                    <p className="section-title">Precision–Recall Curve</p>
                    <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={prCurveData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="recall" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} label={{ value: 'Recall', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} domain={[0, 1]} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="precision" stroke="#63b3ed" dot={false} strokeWidth={2} name="Precision" />
                        </LineChart>
                    </ResponsiveContainer>
                    <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        PR-AUC: {data?.pr_auc != null ? (data.pr_auc * 100).toFixed(2) + '%' : '—'}
                    </p>
                </div>

                {/* Score Distribution */}
                <div className="glass-card">
                    <p className="section-title">Risk Score Distribution</p>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={scoreDistData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="bin" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }} />
                            <Bar dataKey="legitimate" fill="#48bb78" fillOpacity={0.7} name="Legitimate" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="fraud" fill="#fc8181" fillOpacity={0.8} name="Fraud" radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Confusion Matrix */}
            <div className="glass-card">
                <p className="section-title">Confusion Matrix</p>
                <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div className="conf-matrix">
                        <div className="conf-cell conf-tn">
                            <span className="cc-val">{cm[0]?.[0] ?? 0}</span>
                            <span className="cc-label">TN</span>
                        </div>
                        <div className="conf-cell conf-fp">
                            <span className="cc-val">{cm[0]?.[1] ?? 0}</span>
                            <span className="cc-label">FP</span>
                        </div>
                        <div className="conf-cell conf-fn">
                            <span className="cc-val">{cm[1]?.[0] ?? 0}</span>
                            <span className="cc-label">FN</span>
                        </div>
                        <div className="conf-cell conf-tp">
                            <span className="cc-val">{cm[1]?.[1] ?? 0}</span>
                            <span className="cc-label">TP</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 200 }}>
                        {[
                            { label: 'True Negatives (TN)', desc: 'Correctly flagged as legitimate', val: cm[0]?.[0], color: 'var(--accent-green)' },
                            { label: 'False Positives (FP)', desc: 'Legitimate flagged as fraud', val: cm[0]?.[1], color: 'var(--accent-orange)' },
                            { label: 'False Negatives (FN)', desc: 'Fraud missed by the model', val: cm[1]?.[0], color: 'var(--accent-orange)' },
                            { label: 'True Positives (TP)', desc: 'Correctly flagged as fraud', val: cm[1]?.[1], color: 'var(--accent-red)' },
                        ].map((item) => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: item.color }}>{item.label}</div>
                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                                </div>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: item.color }}>{item.val ?? 0}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
