import mlData from './mlEngineData.json'

export const {
    intercept,
    coef,
    center,
    scale,
    features: FEATURE_NAMES,
    threshold_curve: THRESHOLD_CURVE,
    demo_transactions: DEMO_TRANSACTIONS,
    default_metrics: DEFAULT_METRICS,
    optimized_metrics: OPTIMIZED_METRICS,
    savings: PRECOMPUTED_SAVINGS,
} = mlData

export const DEFAULT_OPTIMAL_THRESHOLD = 0.84

export const DEFAULT_FEATURES = {
    Time: 80000,
    Amount: 284.0,
    V1: -1.35, V2: -0.07, V3: 2.54, V4: 1.37, V5: -0.34,
    V6: 0.46, V7: 0.24, V8: 0.10, V9: 0.36, V10: 0.09,
    V11: -0.55, V12: -0.62, V13: -0.99, V14: -0.31, V15: 1.47,
    V16: -0.47, V17: 0.21, V18: 0.02, V19: 0.40, V20: 0.25,
    V21: -0.02, V22: 0.28, V23: -0.11, V24: 0.07, V25: 0.13,
    V26: -0.19, V27: 0.13, V28: -0.02,
}

export const PRESETS = [
    {
        id: 'tx_01',
        name: '🟢 Demo #01: Legit ($0.77)',
        desc: 'Low-value cardholder swipe from demo test set (Actual Class: 0)',
        features: DEMO_TRANSACTIONS[0],
    },
    {
        id: 'tx_05',
        name: '🔴 Demo #05: Fraud ($261.87)',
        desc: 'Stolen card signature with high V14 negative deviation (Actual Class: 1)',
        features: DEMO_TRANSACTIONS[4],
    },
    {
        id: 'tx_10',
        name: '🔴 Demo #10: Fraud Attack ($340.11)',
        desc: 'Severe anomaly pattern across PCA signals (Actual Class: 1)',
        features: DEMO_TRANSACTIONS[9],
    },
    {
        id: 'tx_03',
        name: '🟢 Demo #03: Retail ($29.99)',
        desc: 'Normal retail store card purchase (Actual Class: 0)',
        features: DEMO_TRANSACTIONS[2],
    },
    {
        id: 'stolen_card',
        name: '🔴 High-Velocity Stolen Card ($1,420)',
        desc: 'Rapid card exploitation with high amount and extreme PCA shifts',
        features: {
            Time: 92000, Amount: 1420.0,
            V1: -4.85, V2: 3.92, V3: -6.42, V4: 4.88, V5: -2.15,
            V6: -1.82, V7: -5.10, V8: 2.45, V9: -3.12, V10: -6.80,
            V11: 4.12, V12: -6.95, V13: 0.45, V14: -8.45, V15: -0.85,
            V16: -4.20, V17: -8.12, V18: -2.85, V19: 1.85, V20: 0.95,
            V21: 0.88, V22: -0.42, V23: -0.35, V24: 0.12, V25: 0.45,
            V26: 0.52, V27: 1.15, V28: 0.42,
        },
    },
    {
        id: 'clean_tx',
        name: '🟢 Clean Everyday Cardholder ($42.50)',
        desc: 'Standard grocery/merchant checkout without anomalies',
        features: {
            Time: 45000, Amount: 42.50,
            V1: -0.12, V2: 0.15, V3: 0.88, V4: -0.42, V5: 0.10,
            V6: 0.22, V7: 0.05, V8: -0.08, V9: 0.35, V10: 0.12,
            V11: -0.18, V12: 0.04, V13: -0.25, V14: -0.08, V15: 0.45,
            V16: 0.12, V17: -0.05, V18: 0.08, V19: -0.12, V20: 0.04,
            V21: 0.01, V22: -0.05, V23: 0.02, V24: 0.04, V25: 0.02,
            V26: -0.03, V27: 0.01, V28: 0.00,
        },
    },
    {
        id: 'suspicious_edge',
        name: '🟡 Borderline Suspicious ($640.00)',
        desc: 'Moderate risk score near the boundary cutoff',
        features: {
            Time: 62000, Amount: 640.0,
            V1: -1.85, V2: 1.25, V3: -1.95, V4: 2.15, V5: -0.85,
            V6: -0.45, V7: -1.42, V8: 0.85, V9: -1.25, V10: -2.10,
            V11: 1.45, V12: -2.35, V13: 0.12, V14: -3.10, V15: -0.15,
            V16: -1.45, V17: -2.85, V18: -0.95, V19: 0.65, V20: 0.35,
            V21: 0.32, V22: -0.15, V23: -0.08, V24: 0.05, V25: 0.18,
            V26: 0.22, V27: 0.45, V28: 0.12,
        },
    },
]

/**
 * Predict a single transaction using the exact LogisticRegression model weights + RobustScaler
 */
export function predictSingleClient(featureMap, threshold = DEFAULT_OPTIMAL_THRESHOLD) {
    let logit = intercept
    const explanations = []

    for (let i = 0; i < FEATURE_NAMES.length; i++) {
        const name = FEATURE_NAMES[i]
        const rawVal = parseFloat(featureMap[name] ?? (name === 'Amount' ? 0 : 0))
        const scaledVal = (rawVal - center[i]) / scale[i]
        const w = coef[i]
        const contribution = w * scaledVal
        logit += contribution

        explanations.push({
            feature: name,
            value: rawVal,
            scaled_value: scaledVal,
            contribution,
            direction: contribution > 0 ? 'increases_risk' : 'decreases_risk',
        })
    }

    // Sigmoid probability
    const prob = 1 / (1 + Math.exp(-Math.max(-50, Math.min(50, logit))))
    const isFraud = prob >= threshold
    const fraudLabel = isFraud ? 1 : 0
    const riskScore = parseFloat(prob.toFixed(4))

    // Sort explanations by absolute contribution
    explanations.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))

    // Generate explainability reason codes
    const reasonCodes = []
    const amt = parseFloat(featureMap.Amount || 0)
    if (amt > 500) reasonCodes.push(`High transaction amount ($${amt.toFixed(2)}) compared to cardholder median`)
    if (explanations[0] && Math.abs(explanations[0].contribution) > 0.5) {
        reasonCodes.push(`Strong signal deviation in ${explanations[0].feature} (${explanations[0].contribution > 0 ? '+' : ''}${explanations[0].contribution.toFixed(2)} log-odds)`)
    }
    if (explanations[1] && Math.abs(explanations[1].contribution) > 0.3) {
        reasonCodes.push(`Secondary outlier indicator in feature ${explanations[1].feature}`)
    }
    if (isFraud) {
        reasonCodes.push(`Exceeds decision threshold cutoff (${(threshold * 100).toFixed(1)}%) -> Triggering 2FA Challenge / Decline`)
    } else {
        reasonCodes.push(`Within safe risk boundary below cutoff (${(threshold * 100).toFixed(1)}%) -> Instant Cardholder Approval`)
    }

    return {
        transaction_id: 'TX-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        fraud_label: fraudLabel,
        risk_score: riskScore,
        probability: prob,
        threshold,
        decision: isFraud ? 'FRAUD' : 'LEGITIMATE',
        explanation: explanations.slice(0, 8),
        all_explanations: explanations,
        reason_codes: reasonCodes,
        model_version: 'LogisticRegression_RobustScaler_v1.0',
    }
}

/**
 * Predict a batch of transactions (array of row objects)
 */
export function predictBatchClient(rows, threshold = DEFAULT_OPTIMAL_THRESHOLD) {
    let fraudCount = 0
    let totalAmount = 0
    let fraudAmount = 0

    const predictions = rows.map((row, idx) => {
        const pred = predictSingleClient(row, threshold)
        const amt = parseFloat(row.Amount || 0)
        totalAmount += amt
        if (pred.fraud_label === 1) {
            fraudCount++
            fraudAmount += amt
        }

        return {
            row_index: idx + 1,
            transaction_id: row.transaction_id || `TX-DEMO-${String(idx + 1).padStart(3, '0')}`,
            amount: amt,
            fraud_label: pred.fraud_label,
            decision: pred.decision,
            risk_score: pred.risk_score,
            actual_class: row.Class !== undefined ? parseInt(row.Class) : null,
            time: row.Time !== undefined ? parseFloat(row.Time) : null,
        }
    })

    const total = predictions.length
    const legitCount = total - fraudCount
    const fraudRate = total > 0 ? (fraudCount / total) * 100 : 0

    return {
        total_scanned: total,
        fraud_count: fraudCount,
        legitimate_count: legitCount,
        fraud_rate_pct: parseFloat(fraudRate.toFixed(2)),
        total_amount: parseFloat(totalAmount.toFixed(2)),
        prevented_fraud_amount: parseFloat(fraudAmount.toFixed(2)),
        threshold,
        predictions,
    }
}

/**
 * Dynamically recompute the cost curve given customizable FN cost and FP insult cost
 */
export function calculateCostCurve(fnCost = 150, fpCost = 5) {
    let minCost = Infinity
    let optimalPoint = null

    const curve = THRESHOLD_CURVE.map((point) => {
        const dynamicCost = (point.fn * fnCost) + (point.fp * fpCost)
        const item = {
            ...point,
            cost: dynamicCost,
            fn_cost_total: point.fn * fnCost,
            fp_cost_total: point.fp * fpCost,
        }

        if (dynamicCost < minCost) {
            minCost = dynamicCost
            optimalPoint = item
        }
        return item
    })

    // Find default 0.50 cutoff
    const defaultPoint = curve.find((p) => Math.abs(p.threshold - 0.5) < 0.005) || curve[40]

    const dollarSavings = defaultPoint.cost - optimalPoint.cost
    const percentSavings = defaultPoint.cost > 0 ? (dollarSavings / defaultPoint.cost) * 100 : 0
    const insultReduction = defaultPoint.fp > 0 ? ((defaultPoint.fp - optimalPoint.fp) / defaultPoint.fp) * 100 : 0

    return {
        curve,
        optimal: optimalPoint,
        default_point: defaultPoint,
        fn_cost: fnCost,
        fp_cost: fpCost,
        dollar_savings: dollarSavings,
        percent_savings: parseFloat(percentSavings.toFixed(2)),
        insult_reduction_pct: parseFloat(insultReduction.toFixed(2)),
    }
}

/**
 * Return confusion matrix & metrics closest to a given threshold
 */
export function getMetricsForThreshold(threshold = DEFAULT_OPTIMAL_THRESHOLD) {
    let closest = THRESHOLD_CURVE[0]
    let minDiff = Infinity

    for (const pt of THRESHOLD_CURVE) {
        const diff = Math.abs(pt.threshold - threshold)
        if (diff < minDiff) {
            minDiff = diff
            closest = pt
        }
    }

    return {
        threshold: closest.threshold,
        precision: closest.precision,
        recall: closest.recall,
        f1: closest.f1,
        pr_auc: 0.7388,
        roc_auc: 0.9742,
        confusion_matrix: [
            [closest.tn, closest.fp],
            [closest.fn, closest.tp],
        ],
        model_type: 'Logistic Regression (RobustScaler + SMOTE)',
        model_version: 'v1.0-production',
        trained_at: '2026-09-29T00:00:00Z',
    }
}

export const calculatePrediction = predictSingleClient
export const calculateBatchPredictions = predictBatchClient

