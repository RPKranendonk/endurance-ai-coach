import urllib.request
import json
import base64
import datetime
import sys

# --- Safeguard Logic (Mirrors src/lib/intervals/client.ts) ---

def is_future_or_today(date_str):
    # date_str format: YYYY-MM-DD or YYYY-MM-DDT...
    date_part = date_str.split('T')[0]
    today_part = datetime.datetime.now().strftime('%Y-%m-%d')
    return date_part >= today_part

# --- API Interaction ---

def push_workout_raw(api_key, athlete_id, date_str, name):
    url = f"https://intervals.icu/api/v1/athlete/{athlete_id}/events/bulk"
    auth_str = f"API_KEY:{api_key}"
    base64_auth = base64.b64encode(auth_str.encode('ascii')).decode('ascii')
    headers = {'Authorization': f'Basic {base64_auth}', 'Content-Type': 'application/json'}
    
    payload = [{
        "category": "WORKOUT",
        "start_date_local": f"{date_str}T09:00:00",
        "name": name,
        "description": "Test Description",
        "type": "Run",
        "moving_time": 600
    }]
    
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        with urllib.request.urlopen(req) as response:
            return response.status
    except Exception as e:
        return str(e)

def test_safeguards(api_key, athlete_id='0'):
    yesterday = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime('%Y-%m-%d')
    print(f"--- Testing Safeguards (Date: {yesterday}) ---")
    
    # Scenario 1: Raw API (No Safeguard)
    print("\n1. Attempting upload to YESTERDAY (Raw API)...")
    status = push_workout_raw(api_key, athlete_id, yesterday, "Past Workout (Unsafe)")
    if status == 200:
        print("⚠️  Result: SUCCESS. The API allowed it.")
        print("   (This confirms why we need app-side checks!)")
    else:
        print(f"Result: Failed ({status})")

    # Scenario 2: App Logic (With Safeguard)
    print("\n2. Attempting upload to YESTERDAY (With App Safeguard)...")
    if is_future_or_today(yesterday):
        print("Result: Allowed (Unexpected!)")
    else:
        print("✅ Result: BLOCKED by Safeguard.")
        print("   Error: Cannot upload workouts to the past.")

    # Scenario 3: Future Date
    tomorrow = (datetime.datetime.now() + datetime.timedelta(days=1)).strftime('%Y-%m-%d')
    print(f"\n3. Attempting upload to TOMORROW ({tomorrow}) (With App Safeguard)...")
    if is_future_or_today(tomorrow):
        print("✅ Result: ALLOWED. Proceeding to upload...")
        status = push_workout_raw(api_key, athlete_id, tomorrow, "Future Workout (Safe)")
        if status == 200:
            print("   Upload Successful.")
    else:
        print("Result: Blocked (Unexpected!)")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        key = sys.argv[1]
        test_safeguards(key)
    else:
        key = input("Enter your Intervals.icu API Key: ").strip()
        if key:
            test_safeguards(key)
        else:
            print("Missing API Key.")
