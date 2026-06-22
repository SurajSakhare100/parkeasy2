import sys
import json
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta

def main():
    try:
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input data provided"}))
            return
            
        data = json.loads(input_data)
        bookings = data.get("bookings", [])
        
        if not bookings or len(bookings) < 3:
            # Fallback if there's not enough data to train
            print(json.dumps({
                "predictedRevenueNextMonth": 0,
                "suggestedPriceAdjustment": "0%",
                "peakHours": "N/A",
                "predictedOccupancy": "0%",
                "demandTrend": "neutral"
            }))
            return

        df = pd.DataFrame(bookings)
        
        # Data Cleaning & Formatting
        df['createdAt'] = pd.to_datetime(df['createdAt'])
        df['totalAmount'] = pd.to_numeric(df['totalAmount'], errors='coerce').fillna(0)
        
        # 1. Predict Next Month Revenue using Linear Regression on daily revenue
        # Group by day and sum revenues
        daily_revenue = df.groupby(df['createdAt'].dt.date)['totalAmount'].sum().reset_index()
        daily_revenue['date_ordinal'] = pd.to_datetime(daily_revenue['createdAt']).apply(lambda date: date.toordinal())
        
        X = daily_revenue[['date_ordinal']]
        y = daily_revenue['totalAmount']
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Predict for next 30 days
        last_date = pd.to_datetime(daily_revenue['createdAt'].max())
        next_30_days = [last_date + timedelta(days=i) for i in range(1, 31)]
        next_30_ordinals = np.array([[d.toordinal()] for d in next_30_days])
        
        predicted_daily_revenues = model.predict(next_30_ordinals)
        predicted_revenue_next_month = max(0, sum(predicted_daily_revenues))
        
        # 2. Demand Trend (based on the slope of the linear regression)
        slope = model.coef_[0]
        if slope > 10:
            demand_trend = "upward"
        elif slope < -10:
            demand_trend = "downward"
        else:
            demand_trend = "stable"
            
        # 3. Peak Hours (find the most frequent starting hour)
        # Fallback to createdAt if startTime is not present
        if 'startTime' in df.columns:
            df['startHour'] = pd.to_datetime(df['startTime']).dt.hour
        else:
            df['startHour'] = df['createdAt'].dt.hour
            
        peak_hour_num = int(df['startHour'].mode()[0])
        am_pm1 = "AM" if peak_hour_num < 12 else "PM"
        am_pm2 = "AM" if (peak_hour_num + 2) % 24 < 12 else "PM"
        h1 = peak_hour_num if peak_hour_num <= 12 else peak_hour_num - 12
        h1 = 12 if h1 == 0 else h1
        h2 = (peak_hour_num + 2) % 24
        h2 = h2 if h2 <= 12 else h2 - 12
        h2 = 12 if h2 == 0 else h2
        
        peak_hours = f"{h1}:00 {am_pm1} - {h2}:00 {am_pm2}"
        
        # 4. Suggested Price Adjustment based on demand trajectory
        if slope > 50:
            suggested_price = "+10%"
        elif slope > 10:
            suggested_price = "+5%"
        elif slope < -20:
            suggested_price = "-10%"
        elif slope < -5:
            suggested_price = "-5%"
        else:
            suggested_price = "No Change"
            
        # 5. Predicted Occupancy
        # Heuristic: base 50% + slope modifier, bounded between 10% and 100%
        predicted_occupancy = min(100, max(10, 50 + (slope * 0.5)))
        
        result = {
            "predictedRevenueNextMonth": int(predicted_revenue_next_month),
            "suggestedPriceAdjustment": suggested_price,
            "peakHours": peak_hours,
            "predictedOccupancy": f"{int(predicted_occupancy)}%",
            "demandTrend": demand_trend
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
