# Database Usage Guide

## Fixed Issues

### 1. Data Fetching from Database Folder
**Problem**: The backend was trying to load data from `backend/data/customer_behaviour.csv` instead of the actual data in the `Database/` folder.

**Solution**: Updated `backend/main.py` to use the correct path:
```python
csv_path = os.path.join(os.path.dirname(__file__), "..", "Database", "Customer_Behaviour_Online_vs_Offline.csv")
```

### 2. Format Error on Upload
**Problem**: The file `Database/Customer Behaviour (Online vs Offline).csv` was actually a Safari webarchive file (bplist format), not a proper CSV file.

**Solution**:
1. Extracted the actual CSV data from the webarchive and saved it as `Database/Customer_Behaviour_Online_vs_Offline.csv`
2. Added format validation in the upload endpoint to detect and reject:
   - Safari webarchive files (starting with `bplist`)
   - HTML files (starting with `<!DOCTYPE` or `<html>`)

## Dataset Information

The application now uses the proper customer behaviour dataset:

- **File**: `Database/Customer_Behaviour_Online_vs_Offline.csv`
- **Rows**: 11,789 customer records
- **Columns**: 25 features including:
  - Demographics: age, gender, city_tier, monthly_income
  - Digital behavior: daily_internet_hours, social_media_hours, smartphone_usage_years
  - Shopping behavior: monthly_online_orders, monthly_store_visits, avg_online_spend, avg_store_spend
  - Preferences: shopping_preference (Online/Store/Hybrid), discount_sensitivity, brand_loyalty_score
  - And more...

## Uploading CSV Files

### Correct Format
To upload a CSV file successfully:
1. Ensure the file is a **plain CSV file** (not a webarchive or HTML preview)
2. The file should have a `.csv` extension
3. The file must contain valid CSV data with headers

### Common Upload Errors

**Error**: "The uploaded file appears to be a Safari webarchive"
- **Cause**: You saved a CSV preview from Safari instead of downloading the actual file
- **Solution**: Download the actual CSV file instead of saving the browser preview

**Error**: "The uploaded file appears to be an HTML file"
- **Cause**: Browser saved an HTML preview instead of the CSV
- **Solution**: Use "Download" instead of "Save As" to get the actual CSV file

**Error**: "Could not parse CSV"
- **Cause**: File is corrupted or not in valid CSV format
- **Solution**: Open the file in a text editor to verify it contains comma-separated values

## Testing the Fix

To verify the application is working correctly:

```bash
# Test backend initialization
cd backend
python3 -c "from main import default_data_service; print(f'Loaded {len(default_data_service.df)} rows')"

# Should output: Loaded 11789 rows
```

## File Structure

```
Database/
├── Customer Behaviour (Online vs Offline).csv      # Original webarchive (not used)
├── Customer Behaviour (Online vs Offline) - Data Dictionary.pdf
└── Customer_Behaviour_Online_vs_Offline.csv        # Extracted CSV (used by app)

backend/
├── main.py                                         # Updated to use Database folder
├── data_service.py
└── data/
    └── customer_behaviour.csv                      # Old mock data (not used)
```
