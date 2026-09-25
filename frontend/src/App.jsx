import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { Shield, Upload, Cpu, BarChart2, Search, LayoutDashboard } from 'lucide-react'
import UploadPage from './pages/UploadPage'
import TrainPage from './pages/TrainPage'
import MetricsPage from './pages/MetricsPage'
import PredictPage from './pages/PredictPage'
import DashboardPage from './pages/DashboardPage'

const NAV_ITEMS = [
    { to: '/upload', icon: Upload, label: 'Upload Data' },
    { to: '/train', icon: Cpu, label: 'Train Model' },
    { to: '/metrics', icon: BarChart2, label: 'Metrics' },
    { to: '/predict', icon: Search, label: 'Predict' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
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
                        <p>ML Anomaly Analytics</p>
                    </div>

                    <nav className="sidebar-nav">
                        <div className="nav-section-label">Workflow</div>
                        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                            >
                                <Icon size={16} />
                                {label}
                            </NavLink>
                        ))}
                    </nav>

                    <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            Credit Card Fraud Detection System v1.0
                        </p>
                    </div>
                </aside>

                {/* Main */}
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/upload" element={<UploadPage />} />
                        <Route path="/train" element={<TrainPage />} />
                        <Route path="/metrics" element={<MetricsPage />} />
                        <Route path="/predict" element={<PredictPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                    </Routes>
                </main>
            </div>
        </HashRouter>
    )
}
