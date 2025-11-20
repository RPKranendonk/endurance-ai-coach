import urllib.request
import json
import base64
import datetime
import sys

def get_events(api_key, athlete_id, start_date, end_date):
    url = f"https://intervals.icu/api/v1/athlete/{athlete_id}/events?oldest={start_date}&newest={end_date}"
    auth_str = f"API_KEY:{api_key}"
    base64_auth = base64.b64encode(auth_str.encode('ascii')).decode('ascii')
    headers = {'Authorization': f'Basic {base64_auth}'}
    
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode('utf-8'))

def delete_event(api_key, athlete_id, event_id):
    url = f"https://intervals.icu/api/v1/athlete/{athlete_id}/events/{event_id}"
    auth_str = f"API_KEY:{api_key}"
    base64_auth = base64.b64encode(auth_str.encode('ascii')).decode('ascii')
    headers = {'Authorization': f'Basic {base64_auth}'}
    
    req = urllib.request.Request(url, headers=headers, method='DELETE')
    with urllib.request.urlopen(req) as response:
        return response.status

def push_workout(api_key, athlete_id, workout_payload):
    url = f"https://intervals.icu/api/v1/athlete/{athlete_id}/events/bulk"
    auth_str = f"API_KEY:{api_key}"
    base64_auth = base64.b64encode(auth_str.encode('ascii')).decode('ascii')
    headers = {'Authorization': f'Basic {base64_auth}', 'Content-Type': 'application/json'}
    
    data = json.dumps(workout_payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    with urllib.request.urlopen(req) as response:
        return response.status

def test_overwrite(api_key, athlete_id='0'):
    today = datetime.datetime.now().strftime('%Y-%m-%d')
    print(f"--- Checking for existing workouts on {today} ---")
    
    # 1. Get Events
    events = get_events(api_key, athlete_id, today, today)
    print(f"Found {len(events)} events.")
    
    # 2. Find and Delete "Test Range Workout" (or similar)
    target_name = "Test Range Workout"
    deleted_count = 0
    
    for event in events:
        if event.get('category') == 'WORKOUT' and target_name in event.get('name', ''):
            print(f"Found existing workout: {event['name']} (ID: {event['id']})")
            print("Deleting...")
            delete_event(api_key, athlete_id, event['id'])
            print("✅ Deleted.")
            deleted_count += 1
            
    if deleted_count == 0:
        print("No matching workouts found to delete.")
    
    # 3. Push New Workout
    print("\n--- Pushing New Workout ---")
    workout_name = f"{target_name} {datetime.datetime.now().strftime('%H:%M')}"
    description = "Warmup\n- 10m 60%-70% pace\n\nMain\n- 20m 90%-95% pace\n\nCooldown\n- 5m 60%-70% pace"
    
    payload = [{
        "category": "WORKOUT",
        "start_date_local": f"{today}T09:00:00",
        "name": workout_name,
        "description": description,
        "type": "Run",
        "moving_time": 35 * 60
    }]
    
    push_workout(api_key, athlete_id, payload)
    print(f"✅ SUCCESS: Pushed '{workout_name}'")

if __name__ == "__main__":
    print("--- Intervals.icu Overwrite Tester ---")
    if len(sys.argv) > 1:
        key = sys.argv[1]
        test_overwrite(key)
    else:
        key = input("Enter your Intervals.icu API Key: ").strip()
        if key:
            test_overwrite(key)
        else:
            print("Missing API Key.")
