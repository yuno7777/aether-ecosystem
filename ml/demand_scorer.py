"""
Aether Supply — Demand Forecast Scorer

Loads the trained XGBoost model and runs predictions for products.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

MODEL_PATH = "ml/artifacts/aethersupply_forecast.pkl"
FEATURES_PATH = "ml/artifacts/aethersupply_features.json"

_model = None
_feature_cols = None


def load_or_train_demand():
    """Load the demand forecast model and feature list; train if not found."""
    global _model, _feature_cols

    if os.path.exists(MODEL_PATH) and os.path.exists(FEATURES_PATH):
        print("Loading existing Aether Supply demand forecast model...")
        _model = joblib.load(MODEL_PATH)
        with open(FEATURES_PATH, "r") as f:
            _feature_cols = json.load(f)
    else:
        print("Demand forecast model not found — training now...")
        from ml.train_demand import train_model
        _model, _feature_cols = train_model()

    return _model, _feature_cols


def _build_features_for_date(
    target_date: datetime,
    historical: list[dict],
    product_id_enc: int = 0,
    warehouse_enc: int = 0,
    category_enc: int = 0,
) -> dict:
    """Build a feature dict for a single target date using historical demand data."""
    # Convert historical data to a pandas Series indexed by date
    hist_df = pd.DataFrame(historical)
    if hist_df.empty:
        return None

    hist_df["date"] = pd.to_datetime(hist_df["date"])
    hist_df["quantity"] = pd.to_numeric(hist_df["quantity"], errors="coerce").fillna(0)
    hist_df = hist_df.groupby("date", as_index=False)["quantity"].sum()
    hist_df = hist_df.sort_values("date")

    # Create a complete date range and fill missing dates with 0
    all_dates = pd.date_range(
        start=hist_df["date"].min(),
        end=target_date,
        freq="D",
    )
    demand_series = (
        hist_df.set_index("date")["quantity"]
        .reindex(all_dates, fill_value=0)
    )

    # Time features
    features = {
        "day_of_week": target_date.weekday(),
        "month": target_date.month,
        "quarter": (target_date.month - 1) // 3 + 1,
        "week_of_year": target_date.isocalendar()[1],
    }

    # Lag features
    if len(demand_series) >= 8:
        features["lag_7"] = float(demand_series.iloc[-8])  # 7 days before target
    else:
        features["lag_7"] = float(demand_series.mean())

    if len(demand_series) >= 31:
        features["lag_30"] = float(demand_series.iloc[-31])
    else:
        features["lag_30"] = float(demand_series.mean())

    # Rolling features (exclude target date itself)
    recent = demand_series.iloc[:-1] if len(demand_series) > 1 else demand_series
    features["rolling_mean_7"] = float(recent.tail(7).mean()) if len(recent) >= 1 else 0.0
    features["rolling_mean_30"] = float(recent.tail(30).mean()) if len(recent) >= 1 else 0.0
    features["rolling_std_7"] = float(recent.tail(7).std()) if len(recent) >= 2 else 0.0

    # Replace NaN with 0
    for k, v in features.items():
        if pd.isna(v):
            features[k] = 0.0

    # Categorical encodings
    features["product_id_enc"] = product_id_enc
    features["warehouse_enc"] = warehouse_enc
    features["category_enc"] = category_enc

    return features


def forecast_demand(
    product_id: str,
    historical_data: list[dict],
    days_ahead: int = 30,
) -> dict:
    """
    Forecast demand for a product.

    Args:
        product_id: Product identifier
        historical_data: List of dicts with 'date' and 'quantity' keys
        days_ahead: Number of days to forecast (7, 30, or 90)

    Returns:
        dict with daily_predictions, total_predicted, confidence
    """
    global _model, _feature_cols

    if _model is None or _feature_cols is None:
        load_or_train_demand()

    if not historical_data:
        return {
            "daily_predictions": [],
            "total_predicted": 0,
            "confidence": "low",
        }

    # Determine data quality for confidence
    data_points = len(historical_data)
    if data_points >= 90:
        confidence = "high"
    elif data_points >= 30:
        confidence = "medium"
    else:
        confidence = "low"

    # Use simple encoding for product (hash to int)
    product_enc = hash(product_id) % 10000

    # Build predictions for each future day
    last_date = max(pd.to_datetime(h["date"]) for h in historical_data)
    daily_predictions = []

    # Extend historical data as we predict forward
    extended_history = list(historical_data)

    for day_offset in range(1, days_ahead + 1):
        target_date = last_date + timedelta(days=day_offset)

        features = _build_features_for_date(
            target_date=target_date,
            historical=extended_history,
            product_id_enc=product_enc,
        )

        if features is None:
            daily_predictions.append({
                "date": target_date.strftime("%Y-%m-%d"),
                "predicted_demand": 0,
            })
            continue

        # Build feature vector in the correct order
        feature_vector = []
        for col in _feature_cols:
            feature_vector.append(features.get(col, 0))

        X = np.array([feature_vector])
        pred = float(_model.predict(X)[0])
        pred = max(0, round(pred, 2))

        daily_predictions.append({
            "date": target_date.strftime("%Y-%m-%d"),
            "predicted_demand": pred,
        })

        # Add prediction to extended history for next iteration
        extended_history.append({
            "date": target_date.strftime("%Y-%m-%d"),
            "quantity": pred,
        })

    total_predicted = round(sum(p["predicted_demand"] for p in daily_predictions), 2)

    return {
        "daily_predictions": daily_predictions,
        "total_predicted": total_predicted,
        "confidence": confidence,
    }
