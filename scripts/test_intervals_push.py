import urllib.request
import json
import base64
import datetime
import sys

def test_push_workout(api_key, athlete_id='0'):
    print(f"Testing connection to Intervals.icu for athlete {athlete_id}...")
    
    # 1. Construct a simple test workout
    workout_name = f"Test Workout {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}"
    description = "Warmup\n- 10m 50%\n\nMain\n- 20m 70%\n\nCooldown\n- 5m 40%"
    
    payload = [{
        "category": "WORKOUT",
        "start_date_local": datetime.datetime.now().strftime('%Y-%m-%dT09:00:00'),
        "name": workout_name,
        "description": description,
        "type": "Run",
        "moving_time": 35 * 60
    }]
    
    # 2. Prepare Request
    url = f"https://intervals.icu/api/v1/athlete/{athlete_id}/events/bulk"
    auth_str = f"API_KEY:{api_key}"
    auth_bytes = auth_str.encode('ascii')
    base64_auth = base64.b64encode(auth_bytes).decode('ascii')
    
    headers = {
        'Authorization': f'Basic {base64_auth}',
        'Content-Type': 'application/json'
    }
    
    # 3. Send Request
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                print("✅ SUCCESS: Workout pushed successfully!")
                print(f"Check your calendar for '{workout_name}'")
                response_body = response.read().decode('utf-8')
                print("Response:", response_body)
            else:
                print(f"❌ FAILED: Status Code {response.status}")
                
    except urllib.error.HTTPError as e:
        print(f"❌ FAILED: Status Code {e.code}")
        print("Response:", e.read().decode('utf-8'))
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

if __name__ == "__main__":
    print("--- Intervals.icu Push Tester ---")
    if len(sys.argv) > 1:
        key = sys.argv[1]
    else:
        key = input("Enter your Intervals.icu API Key: ").strip()
        
    if key:
        test_push_workout(key)
    else:
        print("API Key is required.")
