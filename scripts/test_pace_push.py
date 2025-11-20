import urllib.request
import json
import base64
import datetime
import sys
import math

# --- Zone Logic (Percentage Based) ---

def get_pace_zone_as_percent(zone):
    # Z1: 69-77%
    # Z2: 77-87%
    # Z3: 87-95%
    # Z4: 95-100%
    # Z5: 100-111%
    mapping = {
        'Z1': (69, 77),
        'Z2': (77, 87),
        'Z3': (87, 95),
        'Z4': (95, 100),
        'Z5': (100, 111)
    }
    return mapping.get(zone, (0, 0))

# --- Main Test Logic ---

def test_push_pace_workout(api_key, threshold_pace_str, athlete_id='0'):
    print(f"Testing Percentage-based Push for athlete {athlete_id}...")
    
    # 1. Define a Zone-Based Workout Structure
    structure = [
        {"type": "warmup", "duration_min": 10, "zone": "Z1"},
        {"type": "interval", "duration_min": 5, "zone": "Z4"},
        {"type": "recovery", "duration_min": 2, "zone": "Z1"},
        {"type": "interval", "duration_min": 5, "zone": "Z4"},
        {"type": "cooldown", "duration_min": 10, "zone": "Z1"}
    ]

    # 2. Convert to Intervals.icu Builder Text
    description_lines = []
    current_group = ""
    
    for block in structure:
        group_name = block['type'].capitalize()
        if group_name != current_group:
            description_lines.append(f"\n{group_name}")
            current_group = group_name
            
        # Resolve Target to % Range
        min_p, max_p = get_pace_zone_as_percent(block['zone'])
        
        # Format: - {duration}m {min}%-{max}% pace
        line = f"- {block['duration_min']}m {min_p}%-{max_p}% pace"
        description_lines.append(line)
        
    final_description = "\n".join(description_lines).strip()
    
    print("\n--- Generated Builder Text ---")
    print(final_description)
    print("------------------------------\n")

    # 3. Construct Payload
    workout_name = f"Test Range Workout {datetime.datetime.now().strftime('%H:%M')}"
    payload = [{
        "category": "WORKOUT",
        "start_date_local": datetime.datetime.now().strftime('%Y-%m-%dT09:00:00'),
        "name": workout_name,
        "description": final_description,
        "type": "Run",
        "moving_time": sum(b['duration_min'] for b in structure) * 60
    }]
    
    # 4. Send Request
    url = f"https://intervals.icu/api/v1/athlete/{athlete_id}/events/bulk"
    auth_str = f"API_KEY:{api_key}"
    base64_auth = base64.b64encode(auth_str.encode('ascii')).decode('ascii')
    
    headers = {
        'Authorization': f'Basic {base64_auth}',
        'Content-Type': 'application/json'
    }
    
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                print("✅ SUCCESS: Workout pushed successfully!")
                print(f"Check your calendar for '{workout_name}'")
            else:
                print(f"❌ FAILED: Status Code {response.status}")
                
    except urllib.error.HTTPError as e:
        print(f"❌ FAILED: Status Code {e.code}")
        print("Response:", e.read().decode('utf-8'))
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

if __name__ == "__main__":
    print("--- Intervals.icu Range Push Tester ---")
    if len(sys.argv) > 1:
        key = sys.argv[1]
        # Pace input not needed for % based push, but keeping arg structure simple
        test_push_pace_workout(key, "00:00") 
    else:
        key = input("Enter your Intervals.icu API Key: ").strip()
        if key:
            test_push_pace_workout(key, "00:00")
        else:
            print("Missing inputs.")
