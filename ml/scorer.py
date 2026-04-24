import numpy as np
import hashlib


def score_invoice(invoice: dict, model, scaler) -> float:
    """
    Score a GST invoice for anomaly.
    Returns a normalized score between 0 and 1.
    Higher score = more anomalous = higher risk.

    Maps GST invoice fields to model features:
    - Amount = invoice value difference (abs(value_books - value_portal))
    - V1-V28 = generated from available invoice features using deterministic hashing
    """
    # Primary feature: value difference amount
    amount = abs(invoice.get('value_books', 0) - invoice.get('value_portal', 0))

    # Generate pseudo V-features from invoice metadata
    gstin = invoice.get('gstin', '') or ''
    invoice_number = invoice.get('invoice_number', '') or ''
    vendor_name = invoice.get('vendor_name', '') or ''
    status = invoice.get('status', 'matched')

    # Status risk encoding
    status_encoding = {
        'matched': 0.0,
        'value_mismatch': 0.6,
        'missing_2b': 0.8,
        'missing_books': 0.9
    }
    status_score = status_encoding.get(status, 0.5)

    # Hash-based pseudo features for V1-V28
    seed_string = f"{gstin}{invoice_number}{vendor_name}"
    hash_val = int(hashlib.md5(seed_string.encode()).hexdigest(), 16)
    np.random.seed(hash_val % (2**32))
    pseudo_features = np.random.normal(0, 1, 28)

    # Override first few with meaningful values
    pseudo_features[0] = status_score * 3
    pseudo_features[1] = np.log1p(amount) / 10 if amount > 0 else 0
    pseudo_features[2] = status_score * 2

    features = np.array([[amount] + pseudo_features.tolist()])
    features_scaled = scaler.transform(features)

    # decision_function: more negative = more anomalous
    raw_score = model.decision_function(features_scaled)[0]

    # Guard against nan/inf from degenerate inputs
    if not np.isfinite(raw_score):
        return 0.5

    # Normalize to 0-1 (1 = most anomalous)
    normalized = 1 - (raw_score - (-0.5)) / (0.5 - (-0.5))
    normalized = float(np.clip(normalized, 0, 1))

    return round(normalized, 4)
