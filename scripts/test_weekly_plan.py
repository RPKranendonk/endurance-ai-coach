import urllib.request
import json
import base64
import datetime
import sys

# --- Helper: Get Next Monday ---
def get_next_monday():
    today = datetime.date.today()
    days_ahead = 0 - today.weekday()
    if days_ahead <= 0: # Target day already happened this week
        days_ahead += 7
    return today + datetime.timedelta(days=days_ahead)

# --- Helper: Push Workout ---
def push_workout(api_key, athlete_id, workout, date_str):
    url = f"https://intervals.icu/api/v1/athlete/{athlete_id}/events/bulk"
    auth_str = f"API_KEY:{api_key}"
    base64_auth = base64.b64encode(auth_str.encode('ascii')).decode('ascii')
    headers = {'Authorization': f'Basic {base64_auth}', 'Content-Type': 'application/json'}
    
    # Construct Description
    desc_lines = []
    for block in workout['structure']:
        # Infer label from target/type (Simple logic for test script)
        label = "Interval"
        if "Z1" in block.get('target', '') or "69%" in block.get('target', ''): label = "Recovery"
        elif "Z5" in block.get('target', '') or "95%" in block.get('target', ''): label = "VO2 Max"
        elif "Z4" in block.get('target', '') or "90%" in block.get('target', ''): label = "Threshold"
        elif "Z2" in block.get('target', '') or "70%" in block.get('target', ''): label = "Endurance"
        
        desc_lines.append(f"- {block['duration']}m {block['target']} {label}")
    final_desc = "\n\n".join(desc_lines)

    payload = [{
        "category": "WORKOUT",
        "start_date_local": f"{date_str}T09:00:00",
        "name": workout['name'],
        "description": final_desc,
        "type": "Run",
        "moving_time": sum(b['duration'] for b in workout['structure']) * 60
    }]
    
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        with urllib.request.urlopen(req) as response:
            return response.status == 200
    except Exception as e:
        print(f"Error pushing {workout['name']}: {e}")
        return False

# --- Main Test ---
def test_weekly_plan(api_key, athlete_id='0'):
    monday = get_next_monday()
    print(f"--- Simulating Weekly Plan for Week of {monday} ---")
    
    # Define a "Week" of workouts
    plan = [
        {
            "day_offset": 1, # Tuesday
            "name": "Tue: Easy Aerobic",
            "structure": [{"duration": 45, "target": "69%-77% pace"}] # Z1/Z2
        },
        {
            "day_offset": 3, # Thursday
            "name": "Thu: Threshold Intervals",
            "structure": [
                {"duration": 15, "target": "60%-70% pace"},
                {"duration": 5, "target": "95%-100% pace"},
                {"duration": 3, "target": "50%-60% pace"},
                {"duration": 5, "target": "95%-100% pace"},
                {"duration": 10, "target": "60%-70% pace"}
            ]
        },
        {
            "day_offset": 6, # Sunday
            "name": "Sun: Long Run",
            "structure": [{"duration": 90, "target": "70%-80% pace"}]
        }
    ]
    
    success_count = 0
    for item in plan:
        workout_date = monday + datetime.timedelta(days=item['day_offset'])
        print(f"Scheduling '{item['name']}' for {workout_date}...")
        
        if push_workout(api_key, athlete_id, item, str(workout_date)):
            print("✅ Pushed.")
            success_count += 1
        else:
            print("❌ Failed.")
            
    print(f"\n--- Result: {success_count}/{len(plan)} Workouts Uploaded ---")
    if success_count == len(plan):
        print("Success! Check your Intervals.icu calendar for NEXT week.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        key = sys.argv[1]
        test_weekly_plan(key)
    else:
        key = input("Enter your Intervals.icu API Key: ").strip()
        if key:
            test_weekly_plan(key)
        else:
            print("Missing API Key.")
