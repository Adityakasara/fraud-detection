import { useState, useMemo } from 'react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot
} from 'recharts'
import { DollarSign, ShieldAlert, Award, TrendingDown, HelpCircle, ArrowRight } from 'lucide-react'
import { calculateCostCurve } from '../mlEngine'

const CostTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
        const d = payload[0].payload
        return (
            <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '12px 16px', fontSize: '0.8rem', minWidth: 200
            }}>
                <div style={{ fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 6 }}>
                    Threshold: {d.threshold.toFixed(2)}
                </div>
                <div style={{ color: '#fc8181', marginBottom: 2 }}>
                    Total Estimated Cost: <strong>${d.cost.toLocaleString()}</strong>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
                    False Positives (Insults): <strong>{d.fp}</strong> (${d.fp_cost_total?.toLocaleString()})
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
                    False Negatives (Missed): <strong>{d.fn}</strong> (${d.fn_cost_total?.toLocaleString()})
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 4 }}>
                    Precision: {(d.precision * 100).toFixed(1)}% | Recall: {(d.recall * 100).toFixed(1)}%
                </div>
            </div>
        )
    }
    return null
}

export default function CostOptimizerPage() {
    const [fnCost, setFnCost] = useState(150)
    const [fpCost, setFpCost] = useState(5)

    const analysis = useMemo(() => {
        return calculateCostCurve(fnCost, fpCost)
    }, [fnCost, fpCost])

    const { curve, optimal, default_point, dollar_savings, percent_savings, insult_reduction_pct } = analysis

    return (
        <div className="fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-primary" style={{ textTransform: 'uppercase' }}>Synchrony Financial Case Study</span>
                </div>
                <h2>Cost-Based Threshold Optimization</h2>
                <p>
                    Balancing direct chargeback losses against legitimate cardholder insult friction to minimize total business loss.
                </p>
            </div>

            {/* Top Savings Banner */}
            <div className="glass-card" style={{
                marginBottom: 24,
                background: 'linear-gradient(135deg, rgba(72,187,120,0.1) 0%, rgba(99,179,237,0.08) 100%)',
                border: '1px solid rgba(72,187,120,0.3)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <Award color="#48bb78" size={22} />
                            <h3 style={{ fontSize: '1.2rem', color: '#e2e8f0', margin: 0 }}>
                                Optimal Cutoff: <span style={{ color: '#48bb78', fontWeight: 800 }}>{optimal.threshold.toFixed(2)}</span>
                            </h3>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: 0, maxWidth: 620 }}>
                            By shifting decision threshold from the standard <strong>0.50</strong> default to <strong>{optimal.threshold.toFixed(2)}</strong>, false alarms drop by <strong>{insult_reduction_pct}%</strong> without sacrificing critical fraud recall.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Net Savings</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#48bb78', fontFamily: 'var(--font-mono)' }}>
                                ${dollar_savings.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#48bb78', fontWeight: 600 }}>
                                {percent_savings}% Cost Reduction
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inputs & Comparison Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, marginBottom: 24, alignItems: 'start' }}>
                {/* Cost Parameters Card */}
                <div className="glass-card">
                    <p className="section-title" style={{ marginBottom: 12 }}>Business Cost Assumptions</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                        Tune the financial impact values to see how optimal thresholds adjust dynamically:
                    </p>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <label className="form-label" style={{ margin: 0 }}>False Negative (FN) Cost</label>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-red)', fontWeight: 700 }}>
                                ${fnCost}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="50"
                            max="500"
                            step="10"
                            value={fnCost}
                            onChange={(e) => setFnCost(Number(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--accent-red)' }}
                        />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Chargeback loss + operational claim handling
                        </span>
                    </div>

                    <div className="form-group" style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <label className="form-label" style={{ margin: 0 }}>False Positive (FP) Cost</label>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)', fontWeight: 700 }}>
                                ${fpCost}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            step="1"
                            value={fpCost}
                            onChange={(e) => setFpCost(Number(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--accent-orange)' }}
                        />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Customer friction at partner register + 2FA SMS cost
                        </span>
                    </div>

                    <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Formula:</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--accent-blue)' }}>
                            Total Cost = (FN × ${fnCost}) + (FP × ${fpCost})
                        </div>
                    </div>
                </div>

                {/* Side-by-Side Comparison */}
                <div className="glass-card">
                    <p className="section-title" style={{ marginBottom: 16 }}>Cutoff Impact Comparison (Test Set: 56,962 Transactions)</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center' }}>
                        {/* Default Card */}
                        <div style={{
                            padding: '16px 20px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 12,
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                                Baseline (Default)
                            </div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                                Cutoff 0.50
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Customer Insults (FP):</span>
                                    <strong style={{ color: '#f6ad55' }}>{default_point.fp}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Missed Fraud (FN):</span>
                                    <strong style={{ color: '#fc8181' }}>{default_point.fn}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Precision:</span>
                                    <strong>{(default_point.precision * 100).toFixed(1)}%</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Total Cost:</span>
                                    <strong style={{ color: '#fc8181', fontFamily: 'var(--font-mono)' }}>${default_point.cost.toLocaleString()}</strong>
                                </div>
                            </div>
                        </div>

                        <div style={{ color: 'var(--text-muted)', display: 'flex', justifyContent: 'center' }}>
                            <ArrowRight size={24} />
                        </div>

                        {/* Optimal Card */}
                        <div style={{
                            padding: '16px 20px',
                            background: 'rgba(72,187,120,0.08)',
                            borderRadius: 12,
                            border: '1px solid rgba(72,187,120,0.3)'
                        }}>
                            <div style={{ fontSize: '0.74rem', color: '#48bb78', textTransform: 'uppercase', marginBottom: 4, fontWeight: 700 }}>
                                Cost-Optimized
                            </div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#48bb78', marginBottom: 12 }}>
                                Cutoff {optimal.threshold.toFixed(2)}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Customer Insults (FP):</span>
                                    <strong style={{ color: '#48bb78' }}>{optimal.fp} (-{insult_reduction_pct}%)</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Missed Fraud (FN):</span>
                                    <strong style={{ color: 'var(--text-primary)' }}>{optimal.fn}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Precision:</span>
                                    <strong style={{ color: '#48bb78' }}>{(optimal.precision * 100).toFixed(1)}%</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Total Cost:</span>
                                    <strong style={{ color: '#48bb78', fontFamily: 'var(--font-mono)' }}>${optimal.cost.toLocaleString()}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cost Curve Chart */}
            <div className="glass-card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <p className="section-title" style={{ margin: 0 }}>Total Financial Loss vs Decision Threshold</p>
                        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                            U-shaped cost curve testing cutoffs from 0.10 to 0.90. The valley represents minimal financial impact.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: '0.76rem' }}>
                        <span style={{ color: '#63b3ed' }}>● Total Cost</span>
                        <span style={{ color: '#fc8181' }}>| Default Cutoff (0.50)</span>
                        <span style={{ color: '#48bb78' }}>| Optimal Cutoff ({optimal.threshold.toFixed(2)})</span>
                    </div>
                </div>

                <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={curve} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="threshold"
                            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                            tickFormatter={(v) => Number(v).toFixed(2)}
                            label={{ value: 'Decision Threshold (Probability Cutoff)', position: 'insideBottom', offset: -5, fill: 'var(--text-muted)', fontSize: 11 }}
                        />
                        <YAxis
                            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                            tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
                        />
                        <Tooltip content={<CostTooltip />} />
                        <ReferenceLine x={0.50} stroke="#fc8181" strokeDasharray="4 4" label={{ value: '0.50 Cutoff', fill: '#fc8181', fontSize: 11, position: 'top' }} />
                        <ReferenceLine x={optimal.threshold} stroke="#48bb78" strokeWidth={2} label={{ value: `Optimal (${optimal.threshold.toFixed(2)})`, fill: '#48bb78', fontSize: 11, position: 'top' }} />
                        <ReferenceDot x={optimal.threshold} y={optimal.cost} r={6} fill="#48bb78" stroke="#ffffff" />
                        <Line
                            type="monotone"
                            dataKey="cost"
                            stroke="#63b3ed"
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Synchrony Interview Talking Points */}
            <div className="glass-card">
                <p className="section-title" style={{ marginBottom: 12 }}>3-Minute Executive Summary for Retail Credit Issuers</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                    <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 4, fontSize: '0.85rem' }}>
                            1. The Problem with 0.50 Default
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Under extreme class imbalance (0.17% fraud), standard models flag 337 legitimate customers as false positives, creating painful checkout friction for retail store cardholders.
                        </p>
                    </div>
                    <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 700, color: '#48bb78', marginBottom: 4, fontSize: '0.85rem' }}>
                            2. 76.6% Insult Reduction
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Optimizing the cutoff to 0.84 slashes false declines from 337 to just 79, protecting retail partner GMV and cardholder brand loyalty while still capturing 88.8% of fraudulent attempts.
                        </p>
                    </div>
                    <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 700, color: '#9f7aea', marginBottom: 4, fontSize: '0.85rem' }}>
                            3. Transparent & Audit-Ready
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Built on Logistic Regression with RobustScaler and SMOTE — no unexplainable black boxes. Every risk score can be traced to exact log-odds feature contributions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
