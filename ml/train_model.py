import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os


def train_isolation_forest():
    print("Training Isolation Forest on AetherTax dataset...")

    df = pd.read_csv("aethertax-dataset/creditcard.csv")

    # Use only normal transactions for training (unsupervised — model learns normal behavior)
    df_normal = df[df['Class'] == 0]

    # Features: Amount + all V1-V28 PCA features
    feature_cols = ['Amount'] + [f'V{i}' for i in range(1, 29)]
    X = df_normal[feature_cols]

    # Scale Amount (V features are already PCA-scaled)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train Isolation Forest
    model = IsolationForest(
        n_estimators=100,
        contamination=0.01,  # expect ~1% anomalies in GST data
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_scaled)

    # Save model and scaler
    os.makedirs("ml/artifacts", exist_ok=True)
    joblib.dump(model, "ml/artifacts/aethertax_anomaly.pkl")
    joblib.dump(scaler, "ml/artifacts/aethertax_scaler.pkl")

    print("Model saved to ml/artifacts/aethertax_anomaly.pkl")
    return model, scaler


def load_or_train():
    model_path = "ml/artifacts/aethertax_anomaly.pkl"
    scaler_path = "ml/artifacts/aethertax_scaler.pkl"

    if os.path.exists(model_path) and os.path.exists(scaler_path):
        print("Loading existing AetherTax anomaly model...")
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
    else:
        model, scaler = train_isolation_forest()

    return model, scaler
