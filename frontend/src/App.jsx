import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { Shield, Upload, Cpu, BarChart2, Search, LayoutDashboard, TrendingDown, ExternalLink } from 'lucide-react'
import UploadPage from './pages/UploadPage'
import TrainPage from './pages/TrainPage'
import MetricsPage from './pages/MetricsPage'
import PredictPage from './pages/PredictPage'
import DashboardPage from './pages/DashboardPage'
import CostOptimizerPage from './pages/CostOptimizerPage'

const NAV_ITEMS = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/cost-optimizer', icon: TrendingDown, label: 'Cost Optimizer', badge: 'Synchrony' },
    { to: '/predict', icon: Search, label: 'Predict & Score' },
    { to: '/metrics', icon: BarChart2, label: 'Model Metrics' },
    { to: '/upload', icon: Upload, label: 'Dataset & Pipeline' },
    { to: '/train', icon: Cpu, label: 'Model Training' },
]

export default function App() {
    return (
        <HashRouter>
            <div className="app-layout">
                {/* Sidebar */}
                <aside className="sidebar">
                    <div className="sidebar-logo">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <Shield size={22} color="#63b3ed" />
                            <h1>FraudShield</h1>
                        </div>
                        <p>ML Fraud Analytics &amp; Cost Optimizer</p>
                    </div>

                    <nav className="sidebar-nav">
                        <div className="nav-section-label">Workflow &amp; Evaluation</div>
                        {NAV_ITEMS.map(({ to, icon: Icon, label, badge }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                            >
                                <Icon size={16} />
                                <span style={{ flex: 1 }}>{label}</span>
                                {badge && (
                                    <span style={{
                                        fontSize: '0.62rem',
                                        background: 'rgba(72,187,120,0.2)',
                                        color: '#48bb78',
                                        padding: '2px 6px',
                                        borderRadius: 8,
                                        fontWeight: 700
                                    }}>
                                        {badge}
                                    </span>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            fontSize: '0.72rem', color: '#48bb78', fontWeight: 600, marginBottom: 4
                        }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#48bb78', display: 'inline-block' }}></span>
                            Live on GitHub Pages
                        </div>
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            In-Browser Scikit-Learn Inference Engine · Optimal Cutoff 0.84
                        </p>
                        <a
                            href="https://github.com/Adityakasara/fraud-detection"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                fontSize: '0.7rem', color: 'var(--accent-blue)', textDecoration: 'none', marginTop: 8
                            }}
                        >
                            GitHub Repository <ExternalLink size={11} />
                        </a>
                    </div>
                </aside>

                {/* Main */}
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/cost-optimizer" element={<CostOptimizerPage />} />
                        <Route path="/predict" element={<PredictPage />} />
                        <Route path="/metrics" element={<MetricsPage />} />
                        <Route path="/upload" element={<UploadPage />} />
                        <Route path="/train" element={<TrainPage />} />
                    </Routes>
                </main>
            </div>
        </HashRouter>
    )
}
