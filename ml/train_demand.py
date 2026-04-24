"""
Aether Supply — XGBoost Demand Forecasting Model Training

Dataset: aethersupply-dataset/Historical Product Demand.csv
Columns: Product_Code, Warehouse, Product_Category, Date, Order_Demand
"""
import os
import json
import glob
import pandas as pd
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error
import joblib

# Optional: suppress XGBoost warnings
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)


def load_dataset() -> pd.DataFrame:
    """Load all CSVs from aethersupply-dataset/ and concatenate."""
    csv_files = glob.glob("aethersupply-dataset/*.csv")
    if not csv_files:
        raise FileNotFoundError("No CSV files found in aethersupply-dataset/")

    frames = []
    for f in csv_files:
        df = pd.read_csv(f)
        print(f"  Loaded {f}: {df.shape[0]} rows, {df.shape[1]} cols")
        print(f"  Columns: {list(df.columns)}")
        frames.append(df)

    combined = pd.concat(frames, ignore_index=True)
    print(f"\nCombined dataset: {combined.shape}")
    print(f"Sample rows:\n{combined.head()}\n")
    return combined


def prepare_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and prepare the dataset for time-series feature engineering."""
    # Normalize column names
    df.columns = df.columns.str.strip()

    # Map columns
    col_map = {}
    for col in df.columns:
        cl = col.lower().replace(" ", "_")
        if "product" in cl and "code" in cl:
            col_map[col] = "product_id"
        elif "product" in cl and "category" in cl:
            col_map[col] = "category"
        elif "warehouse" in cl or "store" in cl:
            col_map[col] = "warehouse"
        elif "date" in cl:
            col_map[col] = "date"
        elif "demand" in cl or "quantity" in cl or "sales" in cl or "order" in cl:
            col_map[col] = "demand"

    df = df.rename(columns=col_map)

    # Parse date
    df["date"] = pd.to_datetime(df["date"], format="mixed", dayfirst=False)

    # Clean demand: remove non-numeric characters and convert
    df["demand"] = pd.to_numeric(
        df["demand"].astype(str).str.replace(r"[^\d.\-]", "", regex=True),
        errors="coerce"
    )
    df = df.dropna(subset=["date", "demand"])
    df["demand"] = df["demand"].astype(float).clip(lower=0)

    # Sort by date
    df = df.sort_values("date").reset_index(drop=True)

    print(f"After cleaning: {df.shape[0]} rows")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create time-series features from the date column."""
    df = df.copy()

    # Time-based features
    df["day_of_week"] = df["date"].dt.dayofweek
    df["month"] = df["date"].dt.month
    df["quarter"] = df["date"].dt.quarter
    df["week_of_year"] = df["date"].dt.isocalendar().week.astype(int)

    # Encode product_id and warehouse as numeric
    if "product_id" in df.columns:
        df["product_id_enc"] = df["product_id"].astype("category").cat.codes
    if "warehouse" in df.columns:
        df["warehouse_enc"] = df["warehouse"].astype("category").cat.codes
    if "category" in df.columns:
        df["category_enc"] = df["category"].astype("category").cat.codes

    # Aggregate daily demand per product (in case of duplicates)
    group_cols = ["date"]
    if "product_id" in df.columns:
        group_cols.append("product_id")

    # Sort by product + date for proper lag computation
    sort_cols = group_cols.copy()
    df = df.sort_values(sort_cols).reset_index(drop=True)

    # Lag features (computed per product if product_id exists)
    if "product_id" in df.columns:
        df["lag_7"] = df.groupby("product_id")["demand"].shift(7)
        df["lag_30"] = df.groupby("product_id")["demand"].shift(30)
        df["rolling_mean_7"] = df.groupby("product_id")["demand"].transform(
            lambda x: x.shift(1).rolling(7, min_periods=1).mean()
        )
        df["rolling_mean_30"] = df.groupby("product_id")["demand"].transform(
            lambda x: x.shift(1).rolling(30, min_periods=1).mean()
        )
        df["rolling_std_7"] = df.groupby("product_id")["demand"].transform(
            lambda x: x.shift(1).rolling(7, min_periods=1).std()
        )
    else:
        df["lag_7"] = df["demand"].shift(7)
        df["lag_30"] = df["demand"].shift(30)
        df["rolling_mean_7"] = df["demand"].shift(1).rolling(7, min_periods=1).mean()
        df["rolling_mean_30"] = df["demand"].shift(1).rolling(30, min_periods=1).mean()
        df["rolling_std_7"] = df["demand"].shift(1).rolling(7, min_periods=1).std()

    # Fill rolling_std NaN with 0
    df["rolling_std_7"] = df["rolling_std_7"].fillna(0)

    # Drop rows with NaN from lag features
    df = df.dropna(subset=["lag_7", "lag_30"]).reset_index(drop=True)

    print(f"After feature engineering: {df.shape[0]} rows, {df.shape[1]} cols")
    return df


def train_model():
    """Full training pipeline: load, clean, engineer, train, evaluate, save."""
    print("=" * 60)
    print("Aether Supply — XGBoost Demand Forecast Training")
    print("=" * 60)

    # Load
    raw_df = load_dataset()

    # Prepare
    df = prepare_data(raw_df)

    # Engineer features
    df = engineer_features(df)

    # Define feature columns
    feature_cols = [
        "day_of_week", "month", "quarter", "week_of_year",
        "lag_7", "lag_30",
        "rolling_mean_7", "rolling_mean_30", "rolling_std_7",
    ]
    # Add encoded categorical features if available
    for col in ["product_id_enc", "warehouse_enc", "category_enc"]:
        if col in df.columns:
            feature_cols.append(col)

    target_col = "demand"

    X = df[feature_cols]
    y = df[target_col]

    # Time-based split: last 20% of dates as test
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    print(f"\nTrain size: {len(X_train)}, Test size: {len(X_test)}")

    # Train XGBoost
    import xgboost as xgb

    model = xgb.XGBRegressor(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
        verbosity=0,
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )

    # Evaluate
    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)

    # MAPE (avoid division by zero)
    mask = y_test > 0
    if mask.sum() > 0:
        mape = np.mean(np.abs((y_test[mask] - y_pred[mask]) / y_test[mask])) * 100
    else:
        mape = 0.0

    print(f"\n{'='*40}")
    print(f"  RMSE:  {rmse:.2f}")
    print(f"  MAE:   {mae:.2f}")
    print(f"  MAPE:  {mape:.2f}%")
    print(f"{'='*40}")

    # Save artifacts
    os.makedirs("ml/artifacts", exist_ok=True)

    # Save model
    joblib.dump(model, "ml/artifacts/aethersupply_forecast.pkl")

    # Save feature column names
    with open("ml/artifacts/aethersupply_features.json", "w") as f:
        json.dump(feature_cols, f, indent=2)

    # Plot feature importance
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        importance = model.feature_importances_
        sorted_idx = np.argsort(importance)

        fig, ax = plt.subplots(figsize=(10, 6))
        ax.barh(
            [feature_cols[i] for i in sorted_idx],
            importance[sorted_idx],
            color="#4F46E5",
        )
        ax.set_xlabel("Feature Importance")
        ax.set_title("Aether Supply — XGBoost Feature Importance")
        plt.tight_layout()
        plt.savefig("ml/artifacts/feature_importance.png", dpi=150)
        plt.close()
        print("Saved: ml/artifacts/feature_importance.png")

        # Forecast vs Actual
        fig, ax = plt.subplots(figsize=(14, 5))
        sample_size = min(500, len(y_test))
        ax.plot(range(sample_size), y_test.values[:sample_size], label="Actual", alpha=0.7)
        ax.plot(range(sample_size), y_pred[:sample_size], label="Predicted", alpha=0.7)
        ax.set_xlabel("Sample Index")
        ax.set_ylabel("Demand")
        ax.set_title("Aether Supply — Forecast vs Actual (Test Set)")
        ax.legend()
        plt.tight_layout()
        plt.savefig("ml/artifacts/forecast_vs_actual.png", dpi=150)
        plt.close()
        print("Saved: ml/artifacts/forecast_vs_actual.png")

    except ImportError:
        print("matplotlib not installed — skipping plots")

    print("\nAether Supply XGBoost demand forecast model trained and saved")
    print(f"Model: ml/artifacts/aethersupply_forecast.pkl")
    print(f"Features: ml/artifacts/aethersupply_features.json")

    return model, feature_cols


if __name__ == "__main__":
    train_model()
