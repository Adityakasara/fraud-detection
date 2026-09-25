import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8000',
    timeout: 30000,
})

// Demo fallback data when backend is not running (e.g. on GitHub Pages)
const DEMO_METRICS = {
    model_type: 'random_forest',
    model_version: 'rf_prod_v2.4',
    trained_at: '2026-09-25T12:00:00Z',
    precision: 0.924,
    recall: 0.887,
    f1: 0.905,
    pr_auc: 0.912,
    confusion_matrix: [[9812, 18], [23, 147]],
    pr_curve: {
        precision: [0.99, 0.98, 0.96, 0.94, 0.92, 0.89, 0.85, 0.78, 0.70, 0.62],
        recall: [0.05, 0.15, 0.35, 0.55, 0.75, 0.88, 0.92, 0.96, 0.98, 1.0],
    },
    score_distribution: {
        bins: [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95],
        fraud: [1, 2, 4, 8, 14, 22, 38, 55, 72, 84],
        legitimate: [7800, 1400, 320, 110, 45, 20, 10, 4, 1, 0],
    },
}

const DEMO_STATS = {
    total_predictions: 140,
    total_fraud: 12,
    total_legitimate: 128,
    fraud_rate: 8.57,
    daily_trends: [
        { date: '2026-09-18', fraud: 1, legitimate: 18, total: 19 },
        { date: '2026-09-19', fraud: 2, legitimate: 21, total: 23 },
        { date: '2026-09-20', fraud: 0, legitimate: 15, total: 15 },
        { date: '2026-09-21', fraud: 3, legitimate: 24, total: 27 },
        { date: '2026-09-22', fraud: 2, legitimate: 19, total: 21 },
        { date: '2026-09-23', fraud: 1, legitimate: 14, total: 15 },
        { date: '2026-09-24', fraud: 3, legitimate: 17, total: 20 },
    ],
}

const DEMO_RISKY = [
    { id: 1, transaction_id: 'TX-9481A', amount: 1420.0, risk_score: 0.965, model_version: 'rf_prod_v2.4', predicted_at: '2026-09-25T11:42:00Z' },
    { id: 2, transaction_id: 'TX-8312B', amount: 2400.0, risk_score: 0.941, model_version: 'rf_prod_v2.4', predicted_at: '2026-09-25T10:15:00Z' },
    { id: 3, transaction_id: 'TX-7201C', amount: 890.5, risk_score: 0.912, model_version: 'rf_prod_v2.4', predicted_at: '2026-09-25T09:30:00Z' },
    { id: 4, transaction_id: 'TX-6194D', amount: 1250.0, risk_score: 0.887, model_version: 'rf_prod_v2.4', predicted_at: '2026-09-24T22:10:00Z' },
    { id: 5, transaction_id: 'TX-5021E', amount: 640.0, risk_score: 0.842, model_version: 'rf_prod_v2.4', predicted_at: '2026-09-24T18:05:00Z' },
]

// Fallback interceptor when hosted without local backend
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || ''
        const method = (error.config?.method || '').toLowerCase()

        // If backend connection fails, provide seamless demo data
        if (!error.response || error.code === 'ERR_NETWORK') {
            console.info(`[Demo Fallback] Serving offline demo data for ${method} ${url}`)

            if (url.includes('/metrics/history')) {
                return Promise.resolve({ data: [DEMO_METRICS] })
            }
            if (url.includes('/metrics')) {
                return Promise.resolve({ data: DEMO_METRICS })
            }
            if (url.includes('/dashboard/stats')) {
                return Promise.resolve({ data: DEMO_STATS })
            }
            if (url.includes('/dashboard/top-risky')) {
                return Promise.resolve({ data: DEMO_RISKY })
            }
            if (url.includes('/dashboard/export')) {
                const csv = 'transaction_id,amount,risk_score,model_version,predicted_at\nTX-9481A,1420.0,0.965,rf_prod_v2.4,2026-09-25T11:42:00Z\nTX-8312B,2400.0,0.941,rf_prod_v2.4,2026-09-25T10:15:00Z'
                return Promise.resolve({ data: new Blob([csv], { type: 'text/csv' }) })
            }
            if (url.includes('/predict')) {
                let body = {}
                try {
                    body = typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data
                } catch { }
                const feats = body.features || {}
                const amt = parseFloat(feats.Amount || feats.amount || 0)
                const v14 = parseFloat(feats.V14 || feats.v14 || 0)
                const isHigh = amt > 500 || v14 < -2

                const risk = isHigh ? 0.94 : 0.03
                const label = isHigh ? 1 : 0
                const contribs = isHigh ? [
                    { feature: 'V14', contribution: 0.485, direction: 'increases_risk' },
                    { feature: 'Amount', contribution: 0.321, direction: 'increases_risk' },
                    { feature: 'V4', contribution: 0.215, direction: 'increases_risk' },
                    { feature: 'V12', contribution: -0.052, direction: 'decreases_risk' },
                ] : [
                    { feature: 'V14', contribution: -0.125, direction: 'decreases_risk' },
                    { feature: 'Amount', contribution: 0.042, direction: 'increases_risk' },
                    { feature: 'V3', contribution: -0.098, direction: 'decreases_risk' },
                    { feature: 'V10', contribution: -0.045, direction: 'decreases_risk' },
                ]
                const reasonCodes = isHigh
                    ? ['Unusually high transaction amount', 'High-risk anonymized signal V14', 'Suspicious pattern in feature V4']
                    : []

                return Promise.resolve({
                    data: {
                        transaction_id: 'DEMO-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
                        fraud_label: label,
                        risk_score: risk,
                        explanation: contribs,
                        reason_codes: reasonCodes,
                        model_version: 'rf_prod_v2.4',
                    }
                })
            }
            if (url.includes('/upload/sample') || url.includes('/upload')) {
                return Promise.resolve({
                    data: {
                        filename: 'sample_creditcard.csv',
                        num_rows: 10000,
                        num_cols: 31,
                        columns: ['Time', ...Array.from({ length: 28 }, (_, i) => `V${i + 1}`), 'Amount', 'Class'],
                        preview: [
                            { Time: 0, V1: -1.35, V2: -0.07, V3: 2.53, Amount: 149.62, Class: 0 },
                            { Time: 1, V1: 1.19, V2: 0.26, V3: 0.16, Amount: 2.69, Class: 0 },
                            { Time: 2, V1: -1.15, V2: 0.42, V3: 1.54, Amount: 378.66, Class: 0 },
                            { Time: 4, V1: -0.42, V2: -0.18, V3: 1.34, Amount: 89.0, Class: 0 },
                            { Time: 7, V1: -0.64, V2: 0.99, V3: 1.07, Amount: 15.0, Class: 0 },
                        ],
                        target_column: 'Class',
                        message: 'Loaded 10,000-row sample credit card dataset with Class target column.',
                    }
                })
            }
            if (url.includes('/train')) {
                return Promise.resolve({
                    data: {
                        message: "Model 'random_forest' trained successfully.",
                        model_version: 'rf_prod_v2.4',
                        metrics: DEMO_METRICS,
                    }
                })
            }
        }
        return Promise.reject(error)
    }
)

export default api

export const uploadDataset = (formData) => api.post('/upload', formData)
export const uploadSampleDataset = () => api.post('/upload/sample')
export const trainModel = (params) => api.post('/train', params)
export const getMetrics = () => api.get('/metrics')
export const getMetricsHistory = () => api.get('/metrics/history')
export const predictSingle = (features) => api.post('/predict', { features })
export const predictBatch = (formData) => api.post('/predict/batch', formData)
export const getDashboardStats = () => api.get('/dashboard/stats')
export const getTopRisky = (limit = 20) => api.get(`/dashboard/top-risky?limit=${limit}`)
export const exportFlagged = () => api.get('/dashboard/export', { responseType: 'blob' })
