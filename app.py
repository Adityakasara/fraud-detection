import os
import json
import joblib
import pandas as pd
import numpy as np
import streamlit as st

# Configure page
st.set_page_config(
    page_title="Credit Card Fraud Detection",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for clean, professional look
st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        color: #1E293B;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.1rem;
        color: #64748B;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        padding: 16px;
        text-align: center;
    }
    .decision-badge-legit {
        background-color: #DEF7EC;
        color: #03543F;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 1.4rem;
        font-weight: 700;
        text-align: center;
        border: 1px solid #31C48D;
        display: inline-block;
    }
    .decision-badge-fraud {
        background-color: #FDE8E8;
        color: #9B1C1C;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 1.4rem;
        font-weight: 700;
        text-align: center;
        border: 1px solid #F98080;
        display: inline-block;
    }
    .stButton>button {
        background-color: #1E40AF;
        color: white;
        font-weight: 600;
        border-radius: 6px;
        padding: 0.5rem 1.5rem;
        border: none;
    }
    .stButton>button:hover {
        background-color: #1D4ED8;
    }
</style>
""", unsafe_allow_html=True)

# Cache model loading
@st.cache_resource
def load_artifacts():
    model_path = "model/model.pkl"
    scaler_path = "model/scaler.pkl"
    config_path = "model/config.json"

    if not (os.path.exists(model_path) and os.path.exists(scaler_path) and os.path.exists(config_path)):
        return None, None, None

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    with open(config_path, "r") as f:
        config = json.load(f)

    return model, scaler, config

@st.cache_data
def load_demo_data():
    demo_path = "data/demo_transactions.csv"
    if os.path.exists(demo_path):
        return pd.read_csv(demo_path)
    return None

model, scaler, config = load_artifacts()
demo_df = load_demo_data()

# Header
st.markdown('<div class="main-header">Credit Card Fraud Detection</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">ML-based transaction risk analysis</div>', unsafe_allow_html=True)

# Check model availability
if model is None or scaler is None or config is None:
    st.error("⚠️ Model artifacts not found in `model/`. Please run `python train.py` first to generate trained artifacts.")
    st.stop()

# Sidebar: Model Architecture & Information
with st.sidebar:
    st.markdown("### ⚙️ System Status")
    st.success("Model Status: Loaded ✓")

    st.markdown("---")
    st.markdown("### 🧠 Model Information")
    st.markdown(f"**Algorithm:** `{config.get('algorithm', 'Logistic Regression')}`")
    st.markdown(f"**Imbalance Handling:** `{config.get('imbalance_handling', 'SMOTE')}`")
    st.markdown(f"**Scaler:** `{config.get('scaler', 'RobustScaler')}`")
    opt_t = config.get("optimized_threshold", 0.84)
    st.markdown(f"**Decision Threshold:** `{opt_t:.2f}` ({opt_t * 100:.1f}%)")

    st.markdown("---")
    st.markdown("### 📊 Test Set Metrics")
    def_metrics = config.get("default_metrics", {})
    opt_metrics = config.get("optimized_metrics", {})
    st.metric("PR-AUC Score", f"{def_metrics.get('pr_auc', 0.7388):.4f}")
    st.metric("Precision (Optimal)", f"{opt_metrics.get('precision', 0.5241):.2%}")
    st.metric("Recall (Optimal)", f"{opt_metrics.get('recall', 0.8878):.2%}")

    st.markdown("---")
    st.markdown("### 💰 Business Cost Model")
    costs = config.get("cost_assumptions", {})
    st.caption("Illustrative business cost assumptions:")
    st.markdown(f"- **False Negative (missed fraud):** ${costs.get('false_negative_cost', 150)}")
    st.markdown(f"- **False Positive (false alert):** ${costs.get('false_positive_cost', 5)}")
    savings = config.get("savings", {})
    st.info(f"**Cost Savings:** ${savings.get('dollar_savings', 1290):,} ({savings.get('percent_savings', 38.7)}% vs default 0.50 threshold)")

# Main interface tabs
tab1, tab2, tab3 = st.tabs(["🔍 Option A: Sample Transaction", "📂 Option B: Batch CSV Upload", "📖 How The System Works"])

# ==========================================
# TAB 1: SAMPLE TRANSACTION DEMO
# ==========================================
with tab1:
    st.markdown("### Live Fraud Scoring Demo")
    st.write("Select a transaction from the test dataset to evaluate it with the trained model in real time.")

    if demo_df is not None and not demo_df.empty:
        # Build friendly display options
        options = []
        for idx, row in demo_df.iterrows():
            actual_label = "Fraud" if row.get("Class", 0) == 1 else "Legitimate"
            options.append(f"Transaction #{idx + 1:02d} — Amount: ${row['Amount']:.2f} (Actual: {actual_label})")

        selected_option = st.selectbox(
            "Select Demo Transaction:",
            options=options,
            index=0
        )
        selected_idx = int(selected_option.split(" — ")[0].replace("Transaction #", "")) - 1
        selected_row = demo_df.iloc[selected_idx]

        # Feature preview
        with st.expander("View Transaction Feature Details", expanded=False):
            feature_cols = config.get("features", [c for c in demo_df.columns if c != "Class"])
            preview_df = pd.DataFrame([selected_row[feature_cols]])
            st.dataframe(preview_df)

        if st.button("🚀 Analyze Transaction", type="primary"):
            # Extract features in correct order as DataFrame
            feature_cols = config.get("features", [c for c in demo_df.columns if c != "Class"])
            feature_input = pd.DataFrame([selected_row[feature_cols]])

            # RobustScaler -> Logistic Regression inference
            feature_scaled = scaler.transform(feature_input)
            fraud_prob = float(model.predict_proba(feature_scaled)[0, 1])
            risk_score = round(fraud_prob * 100, 1)
            threshold = float(config.get("optimized_threshold", 0.84))
            threshold_pct = round(threshold * 100, 1)

            is_fraud = fraud_prob >= threshold
            decision_text = "FRAUD" if is_fraud else "LEGITIMATE"

            st.markdown("---")
            st.markdown("### 🎯 Analysis Results")

            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Fraud Probability", f"{fraud_prob * 100:.2f}%")
            with col2:
                st.metric("Model Risk Score", f"{risk_score} / 100")
            with col3:
                st.metric("Decision Threshold", f"{threshold_pct}%")
            with col4:
                actual_class = int(selected_row.get("Class", -1))
                if actual_class != -1:
                    actual_text = "FRAUD" if actual_class == 1 else "LEGITIMATE"
                    st.metric("Actual Ground Truth", actual_text)
                else:
                    st.metric("Transaction Amount", f"${selected_row['Amount']:.2f}")

            # Big Decision Banner
            st.markdown("<br>", unsafe_allow_html=True)
            if is_fraud:
                st.markdown(
                    f'<div class="decision-badge-fraud">🔴 FINAL DECISION: FRAUD (Risk Score: {risk_score}/100 exceeds threshold {threshold_pct}%)</div>',
                    unsafe_allow_html=True
                )
            else:
                st.markdown(
                    f'<div class="decision-badge-legit">🟢 FINAL DECISION: LEGITIMATE (Risk Score: {risk_score}/100 is below threshold {threshold_pct}%)</div>',
                    unsafe_allow_html=True
                )

            # Contextual reasoning
            st.markdown("<br>", unsafe_allow_html=True)
            with st.expander("💡 Decision Explanation & Business Context"):
                st.write(f"- **Calculated Fraud Probability:** `{fraud_prob:.4f}`")
                st.write(f"- **Cost-Optimized Cutoff:** `{threshold:.2f}` (selected to minimize False Negatives and False Positives based on business costs)")
                if is_fraud:
                    st.write("- **Action Recommended:** Flag transaction for immediate 2FA verification or secondary authorization review.")
                else:
                    st.write("- **Action Recommended:** Approve transaction seamlessly with frictionless customer checkout.")
    else:
        st.warning("No demo transactions found. Run `python train.py` to create `data/demo_transactions.csv`.")

# ==========================================
# TAB 2: BATCH CSV UPLOAD DEMO
# ==========================================
with tab2:
    st.markdown("### Batch Transaction Analysis")
    st.write("Upload a CSV file containing transactions (`Time`, `V1`–`V28`, `Amount`) to score all rows simultaneously.")

    uploaded_file = st.file_uploader("Upload Transaction CSV", type=["csv"])

    if uploaded_file is not None:
        try:
            input_df = pd.read_csv(uploaded_file)
            required_cols = config.get("features", [f"V{i}" for i in range(1, 29)] + ["Time", "Amount"])
            missing = [c for c in required_cols if c not in input_df.columns]

            if missing:
                st.error(f"❌ Missing required columns: {', '.join(missing[:5])}... (Ensure Time, V1–V28, and Amount are present)")
            else:
                st.success(f"✓ Loaded {len(input_df):,} transactions successfully.")

                if st.button("⚡ Score Uploaded Transactions", type="primary"):
                    with st.spinner("Scaling features and generating fraud probabilities..."):
                        X_input = input_df[required_cols]
                        X_scaled = scaler.transform(X_input)
                        probs = model.predict_proba(X_scaled)[:, 1]

                        threshold = float(config.get("optimized_threshold", 0.84))
                        preds = (probs >= threshold).astype(int)

                        results_df = input_df.copy()
                        results_df["fraud_probability"] = np.round(probs, 4)
                        results_df["risk_score"] = np.round(probs * 100, 1)
                        results_df["prediction"] = preds
                        results_df["decision"] = np.where(preds == 1, "Fraud", "Legitimate")

                    # Summary cards
                    n_flagged = int((preds == 1).sum())
                    n_clean = len(preds) - n_flagged

                    col_a, col_b, col_c = st.columns(3)
                    with col_a:
                        st.metric("Total Transactions", f"{len(results_df):,}")
                    with col_b:
                        st.metric("🟢 Approved Legitimate", f"{n_clean:,}")
                    with col_c:
                        st.metric("🔴 Flagged as Fraud", f"{n_flagged:,}")

                    # Results table preview
                    st.markdown("#### Scored Results Preview:")
                    display_cols = ["Time", "Amount", "fraud_probability", "risk_score", "decision"]
                    if "Class" in results_df.columns:
                        display_cols.append("Class")
                    st.dataframe(results_df[display_cols].head(50))

                    # Export button
                    csv_export = results_df.to_csv(index=False).encode("utf-8")
                    st.download_button(
                        label="📥 Download Scored Transactions as CSV",
                        data=csv_export,
                        file_name="scored_fraud_predictions.csv",
                        mime="text/csv"
                    )

        except Exception as e:
            st.error(f"❌ Error processing file: {str(e)}")

# ==========================================
# TAB 3: HOW THE SYSTEM WORKS
# ==========================================
with tab3:
    st.markdown("### How the Pipeline Works")
    st.markdown("""
```
Transaction Data (Time, V1–V28, Amount)
   ↓
Train/Test Split (Stratified 80/20, preserving 0.17% fraud ratio)
   ↓
RobustScaler (Fitted strictly on training data to avoid data leakage)
   ↓
SMOTE (Applied strictly on training data to 20% minority ratio)
   ↓
Logistic Regression (Calibrated, interpretable linear classification)
   ↓
Fraud Probability Score (P(y = 1 | X))
   ↓
Business Threshold Optimization (Minimizing FN*$150 + FP*$5)
   ↓
Final Decision: 🟢 Legitimate vs 🔴 Fraud
```
    """)

    st.markdown("### Why These Techniques?")
    st.markdown("""
1. **Stratified Split**: Preserves the ultra-rare 0.17% fraud prevalence in both train and test partitions.
2. **RobustScaler on Training Only**: Real credit card transaction amounts have extreme outliers; RobustScaler uses medians and interquartile ranges (IQR). Fitting strictly on `X_train` prevents test distribution leakage.
3. **SMOTE on Training Only**: Balances the decision boundary during training. Testing data must stay un-oversampled to measure real-world performance.
4. **Logistic Regression**: High interpretability, linear decision boundary, and direct probability calibration needed for threshold testing.
5. **Business-Based Threshold Optimization**: In retail cards (like Synchrony), missing fraud ($150) and customer insults ($5) have asymmetric costs. Shifting threshold from 0.50 to 0.84 cuts false alarms by 76.6% while catching the exact same 87 frauds, saving $1,290 in test cost.
    """)
