import { useState } from 'react'
import { Cpu, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import { trainModel } from '../api'

const MODELS = [
    { id: 'logistic_regression', name: 'Logistic Regression', desc: 'Fast baseline · interpretable coefficients' },
    { id: 'random_forest', name: 'Random Forest', desc: 'Ensemble trees · high accuracy · supports SHAP' },
    { id: 'xgboost', name: 'XGBoost', desc: 'Gradient boosting · best performance on tabular data' },
    { id: 'isolation_forest', name: 'Isolation Forest', desc: 'Unsupervised anomaly detection · no labels required' },
]

const IMBALANCE = [
    { id: 'class_weight', label: 'Class Weights', desc: 'Weight minority class higher (recommended)' },
    { id: 'smote', label: 'SMOTE', desc: 'Synthetic oversampling of fraud samples' },
    { id: 'none', label: 'None', desc: 'No imbalance handling' },
]

export default function TrainPage() {
    const [modelType, setModelType] = useState('random_forest')
    const [imbalance, setImbalance] = useState('class_weight')
    const [testSize, setTestSize] = useState(0.2)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)

    const handleTrain = async () => {
        setLoading(true)
        setError(null)
        setResult(null)
        try {
            const { data } = await trainModel({ model_type: modelType, imbalance_method: imbalance, test_size: testSize })
            setResult(data)
        } catch (e) {
            setError(e.response?.data?.detail || e.message)
        } finally {
            setLoading(false)
        }
    }

    const m = result?.metrics

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>Train Model</h2>
                <p>Select a model and imbalance strategy, then launch training on the uploaded dataset.</p>
            </div>

            {/* Model selector */}
            <div className="glass-card" style={{ marginBottom: 20 }}>
                <p className="section-title">Model Architecture</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    {MODELS.map((m) => (
                        <button
                            key={m.id}
                            className={`model-type-btn${modelType === m.id ? ' selected' : ''}`}
                            onClick={() => setModelType(m.id)}
                        >
                            <span className="mt-name">{m.name}</span>
                            <span className="mt-desc">{m.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Imbalance handling */}
            <div className="glass-card" style={{ marginBottom: 20 }}>
                <p className="section-title">Class Imbalance Strategy</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {IMBALANCE.map((item) => (
                        <button
                            key={item.id}
                            className={`model-type-btn${imbalance === item.id ? ' selected' : ''}`}
                            onClick={() => setImbalance(item.id)}
                            style={{ flex: '1 1 180px' }}
                        >
                            <span className="mt-name">{item.label}</span>
                            <span className="mt-desc">{item.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Test size */}
            <div className="glass-card" style={{ marginBottom: 24 }}>
                <p className="section-title">Train/Test Split</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div className="form-group" style={{ maxWidth: 240 }}>
                        <label className="form-label">Test Size</label>
                        <input
                            type="range" min="0.1" max="0.4" step="0.05"
                            value={testSize}
                            onChange={(e) => setTestSize(parseFloat(e.target.value))}
                            style={{ accentColor: 'var(--accent-blue)', width: '100%' }}
                        />
                    </div>
                    <span className="badge badge-blue" style={{ fontSize: '1rem', padding: '6px 16px' }}>
                        {Math.round(testSize * 100)}% Test / {Math.round((1 - testSize) * 100)}% Train
                    </span>
                </div>
            </div>

            {/* Train button */}
            <button
                className="btn btn-primary"
                onClick={handleTrain}
                disabled={loading}
                style={{ minWidth: 180, justifyContent: 'center', fontSize: '0.93rem', padding: '13px 30px' }}
            >
                {loading
                    ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div> Training…</>
                    : <><Zap size={17} /> Launch Training</>
                }
            </button>

            {loading && (
                <div className="training-anim fade-in" style={{ marginTop: 20 }}>
                    <div className="spinner"></div>
                    <span>Fitting {MODELS.find(m => m.id === modelType)?.name}… this may take a moment.</span>
                </div>
            )}

            {error && (
                <div className="alert alert-error fade-in" style={{ marginTop: 20 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                </div>
            )}

            {result && m && (
                <div className="fade-in" style={{ marginTop: 28 }}>
                    <div className="alert alert-success" style={{ marginBottom: 20 }}>
                        <CheckCircle size={16} />
                        <div>
                            <strong>{result.message}</strong>
                            <span style={{ marginLeft: 10, fontSize: '0.8rem', opacity: 0.7 }}>
                                Version: {result.model_version}
                            </span>
                        </div>
                    </div>

                    <div className="glass-card glow-green">
                        <p className="section-title">Evaluation Results</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                            {[
                                { label: 'Precision', val: m.precision, color: '#63b3ed' },
                                { label: 'Recall', val: m.recall, color: '#48bb78' },
                                { label: 'F1 Score', val: m.f1, color: '#9f7aea' },
                                { label: 'PR-AUC', val: m.pr_auc, color: '#f6ad55' },
                            ].map((item) => (
                                <div key={item.label} className="metric-chip">
                                    <span className="val" style={{ color: item.color }}>
                                        {(item.val * 100).toFixed(1)}%
                                    </span>
                                    <span className="label">{item.label}</span>
                                </div>
                            ))}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Navigate to <strong>Metrics</strong> for charts including PR curve, score distribution, and confusion matrix.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
