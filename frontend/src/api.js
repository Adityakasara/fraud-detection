import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8000',
    timeout: 120000, // 2 min for training
})

export default api

export const uploadDataset = (formData) => api.post('/upload', formData)
export const trainModel = (params) => api.post('/train', params)
export const getMetrics = () => api.get('/metrics')
export const getMetricsHistory = () => api.get('/metrics/history')
export const predictSingle = (features) => api.post('/predict', { features })
export const predictBatch = (formData) => api.post('/predict/batch', formData)
export const getDashboardStats = () => api.get('/dashboard/stats')
export const getTopRisky = (limit = 20) => api.get(`/dashboard/top-risky?limit=${limit}`)
export const exportFlagged = () => api.get('/dashboard/export', { responseType: 'blob' })
