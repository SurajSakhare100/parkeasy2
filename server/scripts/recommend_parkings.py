#!/usr/bin/env python3
import json
import sys


def score_parking(parking):
    price = float(parking.get("pricePerHour") or 0)
    available = float(parking.get("availableSlots") or 0)
    rating = float(parking.get("rating") or 4)

    price_score = max(0.0, min(1.0, 1 - price / 500))
    availability_score = max(0.0, min(1.0, available / 10))
    rating_score = max(0.0, min(1.0, rating / 5))

    return round(price_score * 0.35 + availability_score * 0.45 + rating_score * 0.2, 4)


def main():
    raw = sys.stdin.read()
    if not raw:
        print(json.dumps({"recommendedParking": None, "parkings": []}))
        return

    payload = json.loads(raw)
    parkings = payload.get("parkings", []) or []

    for parking in parkings:
        parking["recommendationScore"] = score_parking(parking)

    sorted_parkings = sorted(parkings, key=lambda item: item["recommendationScore"], reverse=True)
    recommended_parking = sorted_parkings[0] if sorted_parkings else None

    print(json.dumps({
        "recommendedParking": recommended_parking,
        "parkings": sorted_parkings,
    }))


if __name__ == "__main__":
    main()
