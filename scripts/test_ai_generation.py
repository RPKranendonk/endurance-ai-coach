import urllib.request
import json
import sys
import os

def generate_workout(api_key, user_request="Suggest a workout for today"):
    # Using gemini-2.0-flash as confirmed by list_models.py
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    headers = {'Content-Type': 'application/json'}
    
    # Replicating the System Prompt from src/lib/ai/service.ts
    system_prompt = """
    You are an elite endurance coach for running.
    Your goal is to generate a detailed, structured workout based on the user's request and context.
    
    CRITICAL RULES:
    1.  **Structure**: The workout MUST be broken down into specific blocks (Warmup, Main Set, Cooldown).
    2.  **Intensity**: Use ZONES (Z1-Z5) for intensity. Do NOT use specific paces (e.g. "5:00/km") or HR values.
    3.  **Zone Position**: For each block, specify a `zone_position` from 0.0 to 1.0.
        - 0.0 = Bottom of zone
        - 0.5 = Middle of zone
        - 1.0 = Top of zone
    4.  **Format**: Return ONLY valid JSON matching the schema below. No markdown, no explanation.
    
    JSON Schema:
    {
      "workout_name": "String (Short, punchy title)",
      "description": "String (Motivational description of the goal)",
      "sport": "run",
      "structure": [
        {
          "type": "warmup" | "interval" | "recovery" | "cooldown",
          "duration_min": Number,
          "zone": "Z1" | "Z2" | "Z3" | "Z4" | "Z5",
          "zone_position": Number (0.0-1.0),
          "intensity_description": "String (e.g. 'Easy jog', 'Hard effort')"
        }
      ]
    }
    """
    
    payload = {
        "contents": [{
            "parts": [
                {"text": system_prompt},
                {"text": f"User Request: {user_request}"}
            ]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            # Extract JSON from the response text
            content_text = result['candidates'][0]['content']['parts'][0]['text']
            return json.loads(content_text)
            
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.read().decode('utf-8')}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def print_workout(workout):
    if not workout: return
    
    print(f"\n🏃 WORKOUT: {workout.get('workout_name')}")
    print(f"📝 GOAL: {workout.get('description')}")
    print("-" * 40)
    
    total_time = 0
    for block in workout.get('structure', []):
        duration = block.get('duration_min')
        total_time += duration
        zone = block.get('zone')
        desc = block.get('intensity_description')
        type_lbl = block.get('type').upper()
        
        print(f"[{type_lbl}] {duration} mins @ {zone} ({desc})")
        
    print("-" * 40)
    print(f"⏱️  Total Duration: {total_time} mins\n")

if __name__ == "__main__":
    print("--- Gemini AI Workout Generator ---")
    
    # Get API Key
    if len(sys.argv) > 1:
        key = sys.argv[1]
    else:
        key = input("Enter your Gemini API Key: ").strip()
        
    if not key:
        print("Error: API Key is required.")
        sys.exit(1)

    # Interactive Loop
    while True:
        user_input = input("\nWhat kind of workout do you want? (or 'q' to quit): ").strip()
        if user_input.lower() == 'q':
            break
            
        print("\n🤖 Asking Gemini...")
        workout = generate_workout(key, user_input)
        print_workout(workout)
