import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, Award, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react'
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { getMetrics } from '../api'
import { THRESHOLD_CURVE, DEFAULT_OPTIMAL_THRESHOLD } from '../mlEngine'

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
                        {p.name}: <strong>{typeof p.value === 'number' ? (p.value > 1 ? p.value.toLocaleString() : p.value.toFixed(4)) : p.value}</strong>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

export default function MetricsPage() {
    const [threshold, setThreshold] = useState(DEFAULT_OPTIMAL_THRESHOLD)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchMetrics = async (th = threshold) => {
        setLoading(true)
        setError(null)
        try {
            const res = await getMetrics(th)
            setData(res.data)
        } catch (e) {
            setError(e.response?.data?.detail || e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMetrics(threshold)
    }, [threshold])

    if (loading && !data) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4, margin: '0 auto 16px' }}></div>
                <p style={{ color: 'var(--text-muted)' }}>Loading evaluation metrics…</p>
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
        ? data.pr_curve.recall.map((r, i) => ({
            recall: parseFloat(r.toFixed(3)),
            precision: parseFloat(data.pr_curve.precision[i]?.toFixed(3) ?? 0)
        }))
        : []

    const scoreDistData = data?.score_distribution
        ? data.score_distribution.bins.map((b, i) => ({
            bin: `${(b * 100).toFixed(0)}%`,
            fraud: data.score_distribution.fraud[i],
            legitimate: data.score_distribution.legitimate[i],
        }))
        : []

    const cm = data?.confusion_matrix || [[56785, 79], [11, 87]]
    const tn = cm[0][0]
    const fp = cm[0][1]
    const fn = cm[1][0]
    const tp = cm[1][1]

    return (
        <div className="fade-in">
            <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2>Model Evaluation & PR-AUC</h2>
                    <p>
                        Rigorous evaluation on 56,962 holdout test transactions (0.17% fraud rate).
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Evaluate at Cutoff:</span>
                    <select
                        value={threshold}
                        onChange={(e) => setThreshold(parseFloat(e.target.value))}
                        style={{
                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                            color: 'var(--text-primary)', padding: '6px 10px', borderRadius: 8, fontSize: '0.8rem', fontFamily: 'var(--font-mono)'
                        }}
                    >
                        <option value={0.50}>0.50 (Default Baseline)</option>
                        <option value={0.84}>0.84 (Optimal Cost Cutoff)</option>
                        <option value={0.30}>0.30 (Aggressive Fraud Catch)</option>
                        <option value={0.70}>0.70 (Conservative)</option>
                    </select>
                </div>
            </div>

            {/* Metric chips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
                {[
                    { label: 'PR-AUC (Primary Metric)', val: data?.pr_auc, color: '#63b3ed', sub: 'Area Under Precision-Recall' },
                    { label: 'Recall (Fraud Catch)', val: data?.recall, color: '#48bb78', sub: `${tp} / ${tp + fn} frauds caught` },
                    { label: 'Precision', val: data?.precision, color: '#9f7aea', sub: `${(data?.precision * 100).toFixed(1)}% true fraud rate` },
                    { label: 'F1 Score', val: data?.f1, color: '#f6ad55', sub: 'Harmonic mean' },
                ].map(({ label, val, color, sub }) => (
                    <div key={label} className="glass-card" style={{ padding: '16px 20px', borderLeft: `3px solid ${color}` }}>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color }}>
                            {typeof val === 'number' ? (val < 1 ? (val * 100).toFixed(1) + '%' : val) : '—'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</div>
                    </div>
                ))}
            </div>

            {/* Confusion Matrix & Model Pipeline info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                {/* Confusion Matrix */}
                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <p className="section-title" style={{ margin: 0 }}>Confusion Matrix (Cutoff: {threshold.toFixed(2)})</p>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>56,962 Total Test Cases</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                        <div style={{
                            padding: '16px', borderRadius: 10, textAlign: 'center',
                            background: 'rgba(72,187,120,0.08)', border: '1px solid rgba(72,187,120,0.2)'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>True Negative (Legit Approved)</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#48bb78', fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
                                {tn.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#48bb78' }}>Smooth cardholder checkout</div>
                        </div>

                        <div style={{
                            padding: '16px', borderRadius: 10, textAlign: 'center',
                            background: 'rgba(246,173,85,0.08)', border: '1px solid rgba(246,173,85,0.2)'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>False Positive (Customer Insult)</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f6ad55', fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
                                {fp.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#f6ad55' }}>Legit cardholder challenged</div>
                        </div>

                        <div style={{
                            padding: '16px', borderRadius: 10, textAlign: 'center',
                            background: 'rgba(252,129,129,0.08)', border: '1px solid rgba(252,129,129,0.2)'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>False Negative (Missed Fraud)</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fc8181', fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
                                {fn.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#fc8181' }}>Chargeback financial loss ($150)</div>
                        </div>

                        <div style={{
                            padding: '16px', borderRadius: 10, textAlign: 'center',
                            background: 'rgba(99,179,237,0.08)', border: '1px solid rgba(99,179,237,0.2)'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>True Positive (Fraud Blocked)</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#63b3ed', fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
                                {tp.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#63b3ed' }}>Successful attack interception</div>
                        </div>
                    </div>
                </div>

                {/* Architecture & Leakage-Free Design */}
                <div className="glass-card">
                    <p className="section-title" style={{ marginBottom: 12 }}>Pipeline Methodology & Governance</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.78rem' }}>
                        <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 2 }}>
                                1. RobustScaler on X_train strictly
                            </div>
                            <span style={{ color: 'var(--text-secondary)' }}>
                                Median and IQR scaling prevents outlier skew while avoiding information leakage from the test split.
                            </span>
                        </div>
                        <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 700, color: 'var(--accent-green)', marginBottom: 2 }}>
                                2. SMOTE Applied on Scaled Training Only
                            </div>
                            <span style={{ color: 'var(--text-secondary)' }}>
                                Oversamples minority fraud ratio to 20% on training features without synthesizing test samples.
                            </span>
                        </div>
                        <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 700, color: 'var(--accent-purple)', marginBottom: 2 }}>
                                3. PR-AUC Prioritized Over ROC-AUC
                            </div>
                            <span style={{ color: 'var(--text-secondary)' }}>
                                ROC-AUC provides an inflated sense of security in extreme imbalance; PR-AUC directly penalizes false alarms.
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Precision-Recall Curve Chart */}
            <div className="glass-card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <p className="section-title" style={{ margin: 0 }}>Precision-Recall Curve (PR-AUC: 0.7388)</p>
                        <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                            Tradeoff between fraud capture (recall) and customer precision across all threshold levels.
                        </p>
                    </div>
                </div>

                <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={prCurveData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="recall"
                            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                            label={{ value: 'Recall (Fraud Detection Rate)', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 11 }}
                        />
                        <YAxis
                            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                            label={{ value: 'Precision', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="precision" stroke="#9f7aea" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
