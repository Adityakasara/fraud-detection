import { useState, useEffect } from 'react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { RefreshCw, Download, TrendingUp, Shield, AlertTriangle, Activity } from 'lucide-react'
import { getDashboardStats, getTopRisky, exportFlagged } from '../api'

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                {payload.map((p) => <div key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>)}
            </div>
        )
    }
    return null
}

export default function DashboardPage() {
    const [stats, setStats] = useState(null)
    const [topRisky, setTopRisky] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchAll = async () => {
        setLoading(true)
        setError(null)
        try {
            const [s, r] = await Promise.all([getDashboardStats(), getTopRisky(20)])
            setStats(s.data)
            setTopRisky(r.data)
        } catch (e) {
            setError(e.response?.data?.detail || e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchAll() }, [])

    const handleExport = async () => {
        try {
            const { data } = await exportFlagged()
            const url = URL.createObjectURL(new Blob([data]))
            const a = document.createElement('a')
            a.href = url; a.download = 'flagged_transactions.csv'; a.click()
        } catch { }
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4, margin: '0 auto 16px' }}></div>
                <p style={{ color: 'var(--text-muted)' }}>Loading dashboard…</p>
            </div>
        </div>
    )

    if (error) return (
        <div className="fade-in">
            <div className="page-header"><h2>Dashboard</h2></div>
            <div className="alert alert-warn">
                <AlertTriangle size={16} />
                <span>{error} — Run some predictions first to see analytics.</span>
            </div>
        </div>
    )

    const fraudRate = stats?.fraud_rate ?? 0

    return (
        <div className="fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2>Analytics Dashboard</h2>
                    <p>Real-time overview of fraud detection activity across all predictions.</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost" onClick={fetchAll}><RefreshCw size={14} /> Refresh</button>
                    <button className="btn btn-primary" onClick={handleExport}><Download size={14} /> Export Flagged</button>
                </div>
            </div>

            {/* Stats grid */}
            <div className="stat-grid" style={{ marginBottom: 28 }}>
                {[
                    { label: 'Total Predictions', val: (stats?.total_predictions ?? 0).toLocaleString(), color: 'blue', Icon: Activity },
                    { label: 'Fraud Detected', val: (stats?.total_fraud ?? 0).toLocaleString(), color: 'red', Icon: AlertTriangle },
                    { label: 'Legitimate', val: (stats?.total_legitimate ?? 0).toLocaleString(), color: 'green', Icon: Shield },
                    { label: 'Fraud Rate', val: `${fraudRate}%`, color: 'orange', Icon: TrendingUp },
                ].map(({ label, val, color, Icon }) => (
                    <div key={label} className={`stat-card ${color}`}>
                        <div className={`stat-icon ${color}`}><Icon size={18} /></div>
                        <div className="stat-val">{val}</div>
                        <div className="stat-label">{label}</div>
                    </div>
                ))}
            </div>

            {/* Fraud trend chart */}
            <div className="glass-card" style={{ marginBottom: 20 }}>
                <p className="section-title" style={{ marginBottom: 16 }}>Fraud Trends Over Time</p>
                {stats?.daily_trends?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={stats.daily_trends} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <defs>
                                <linearGradient id="gradFraud" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#fc8181" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#fc8181" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradLegit" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#48bb78" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#48bb78" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }} />
                            <Area type="monotone" dataKey="legitimate" stroke="#48bb78" fill="url(#gradLegit)" name="Legitimate" strokeWidth={2} />
                            <Area type="monotone" dataKey="fraud" stroke="#fc8181" fill="url(#gradFraud)" name="Fraud" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="empty-state">
                        <Activity style={{ display: 'block' }} />
                        <p>No trend data yet. Run predictions to populate this chart.</p>
                    </div>
                )}
            </div>

            {/* Top risky transactions */}
            <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <p className="section-title" style={{ margin: 0 }}>Top Risky Transactions</p>
                    <span className="badge badge-fraud">{topRisky.length} records</span>
                </div>

                {topRisky.length === 0 ? (
                    <div className="empty-state">
                        <Shield style={{ display: 'block' }} />
                        <p>No flagged transactions yet. Run predictions to see results here.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Transaction ID</th>
                                    <th>Amount</th>
                                    <th>Risk Score</th>
                                    <th>Model Version</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topRisky.map((row, i) => (
                                    <tr key={row.id}>
                                        <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                            {row.transaction_id?.slice(0, 12)}…
                                        </td>
                                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                                            ${Number(row.amount || 0).toFixed(2)}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div className="risk-bar-track" style={{ width: 70, height: 5 }}>
                                                    <div className="risk-bar-fill" style={{
                                                        width: `${Math.round((row.risk_score || 0) * 100)}%`,
                                                        background: (row.risk_score || 0) > 0.7 ? '#fc8181' : '#f6ad55'
                                                    }} />
                                                </div>
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-red)', fontWeight: 700 }}>
                                                    {((row.risk_score || 0) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            {row.model_version?.split('_')[1] ?? '—'}
                                        </td>
                                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            {row.predicted_at ? new Date(row.predicted_at).toLocaleString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
