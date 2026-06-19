#!/usr/bin/env python3
import json
import math
import random
import sys


def clamp(value, min_value=0.0, max_value=1.0):
    return max(min_value, min(max_value, value))


def normalize_parking(parking, max_price, max_available, max_distance):
    price = float(parking.get("pricePerHour") or 0)
    available = float(parking.get("availableSlots") or 0)
    rating = float(parking.get("rating") or 4)
    distance = parking.get("distanceKm")

    try:
        distance = float(distance) if distance is not None else None
    except (TypeError, ValueError):
        distance = None

    price_ratio = clamp(1.0 - (price / max_price))
    availability_ratio = clamp(available / max_available)
    rating_ratio = clamp(rating / 5.0)
    distance_ratio = clamp(1.0 - (distance / max_distance)) if distance is not None else 0.0

    return [price_ratio, availability_ratio, rating_ratio, distance_ratio]


def baseline_score(parking, max_price, max_available, max_distance):
    price_ratio, availability_ratio, rating_ratio, distance_ratio = normalize_parking(
        parking,
        max_price,
        max_available,
        max_distance,
    )

    if parking.get("distanceKm") is not None:
        return (
            price_ratio * 0.30 +
            availability_ratio * 0.25 +
            rating_ratio * 0.20 +
            distance_ratio * 0.25
        )

    return (
        price_ratio * 0.40 +
        availability_ratio * 0.35 +
        rating_ratio * 0.25
    )


def mean(values):
    return sum(values) / len(values) if values else 0.0


def variance(values):
    if not values:
        return 0.0
    avg = mean(values)
    return sum((value - avg) ** 2 for value in values) / len(values)


def best_split(X, y, feature_indices):
    best = None
    best_mse = float("inf")
    n = len(y)

    if n <= 1:
        return None

    for feature_index in feature_indices:
        values = sorted({row[feature_index] for row in X})
        if len(values) < 2:
            continue

        thresholds = [(values[i] + values[i + 1]) / 2.0 for i in range(len(values) - 1)]
        for threshold in thresholds:
            left_y = [y[i] for i, row in enumerate(X) if row[feature_index] <= threshold]
            right_y = [y[i] for i, row in enumerate(X) if row[feature_index] > threshold]

            if not left_y or not right_y:
                continue

            mse = (len(left_y) * variance(left_y) + len(right_y) * variance(right_y)) / n
            if mse < best_mse:
                best_mse = mse
                best = {
                    "feature_index": feature_index,
                    "threshold": threshold,
                    "left_indices": [i for i, row in enumerate(X) if row[feature_index] <= threshold],
                    "right_indices": [i for i, row in enumerate(X) if row[feature_index] > threshold],
                }

    return best


def build_tree(X, y, depth=0, max_depth=6, min_samples_split=2, feature_count=2):
    if len(y) <= min_samples_split or depth >= max_depth or variance(y) == 0.0:
        return {"type": "leaf", "value": mean(y)}

    feature_indices = random.sample(range(len(X[0])), feature_count)
    split = best_split(X, y, feature_indices)
    if not split:
        return {"type": "leaf", "value": mean(y)}

    left_X = [X[i] for i in split["left_indices"]]
    left_y = [y[i] for i in split["left_indices"]]
    right_X = [X[i] for i in split["right_indices"]]
    right_y = [y[i] for i in split["right_indices"]]

    if not left_y or not right_y:
        return {"type": "leaf", "value": mean(y)}

    return {
        "type": "node",
        "feature_index": split["feature_index"],
        "threshold": split["threshold"],
        "left": build_tree(left_X, left_y, depth + 1, max_depth, min_samples_split, feature_count),
        "right": build_tree(right_X, right_y, depth + 1, max_depth, min_samples_split, feature_count),
    }


def predict_tree(tree, row):
    if tree["type"] == "leaf":
        return tree["value"]

    if row[tree["feature_index"]] <= tree["threshold"]:
        return predict_tree(tree["left"], row)
    return predict_tree(tree["right"], row)


def train_random_forest(X, y, n_estimators=10, max_depth=6, min_samples_split=2):
    forest = []
    feature_count = max(1, int(math.sqrt(len(X[0]))))
    n = len(X)

    for _ in range(n_estimators):
        indices = [random.randrange(n) for _ in range(n)]
        sample_X = [X[i] for i in indices]
        sample_y = [y[i] for i in indices]
        tree = build_tree(sample_X, sample_y, depth=0, max_depth=max_depth, min_samples_split=min_samples_split, feature_count=feature_count)
        forest.append(tree)

    return forest


def predict_forest(forest, row):
    if not forest:
        return 0.0
    return mean([predict_tree(tree, row) for tree in forest])


def main():
    raw = sys.stdin.read()
    if not raw:
        print(json.dumps({"recommendedParking": None, "parkings": []}))
        return

    payload = json.loads(raw)
    parkings = payload.get("parkings", []) or []

    prices = [float(p.get("pricePerHour") or 0) for p in parkings]
    specials = [float(p.get("availableSlots") or 0) for p in parkings]
    distances = []
    for p in parkings:
        d = p.get("distanceKm")
        try:
            if d is not None:
                distances.append(float(d))
        except (TypeError, ValueError):
            continue

    max_price = max(prices) if prices else 100.0
    max_available = max(specials) if specials else 10.0
    max_distance = max(distances) if distances else 5.0

    random.seed(42)

    X = [normalize_parking(p, max_price, max_available, max_distance) for p in parkings]
    y = [baseline_score(p, max_price, max_available, max_distance) for p in parkings]

    forest = train_random_forest(X, y, n_estimators=max(5, min(25, len(parkings))), max_depth=6, min_samples_split=2)

    for parking, features in zip(parkings, X):
        parking["recommendationScore"] = round(clamp(predict_forest(forest, features)), 4)

    sorted_parkings = sorted(parkings, key=lambda item: item["recommendationScore"], reverse=True)
    recommended_parking = sorted_parkings[0] if sorted_parkings else None

    print(json.dumps({
        "recommendedParking": recommended_parking,
        "parkings": sorted_parkings,
    }))


if __name__ == "__main__":
    main()
