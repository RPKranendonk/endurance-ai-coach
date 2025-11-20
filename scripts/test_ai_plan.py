import urllib.request
import json
import sys
import os

def generate_plan(api_key, goal, fitness):
    # Using gemini-2.0-flash as confirmed
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    headers = {'Content-Type': 'application/json'}
    
    # Replicating the Macro Plan Prompt from src/lib/ai/service.ts
    system_prompt = """
    Create a macro training plan for an athlete.
    
    **Phase Selection Logic**:
    - Analyze last 8-12 weeks of volume and intensity.
    - If load is low/inconsistent -> Start with Base.
    - If load is stable/moderate -> Start with Build or short Re-Base.
    - If advanced and stable -> Can skip Base, but include assessment weeks.
    
    **Methodology**:
    - Polarized or Pyramidal distribution.
    - Progressive overload (max 10% vol increase/week).
    - Recovery week every 3-4 weeks.
    - Taper 40-60% volume before race.
    
    Output strictly JSON matching this schema:
    {
      "macro_plan": [
        {
          "week": Number,
          "focus": "base" | "build" | "peak" | "taper" | "recovery",
          "target_volume_hours": Number,
          "key_sessions": ["String", "String"],
          "strength_sessions": Number
        }
      ]
    }
    """
    
    user_context = f"""
    Goal: {goal}
    Current Fitness/History: {fitness}
    """
    
    payload = {
        "contents": [{
            "parts": [
                {"text": system_prompt},
                {"text": user_context}
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
            content_text = result['candidates'][0]['content']['parts'][0]['text']
            return json.loads(content_text)
            
    except Exception as e:
        print(f"Error: {e}")
        return None

def print_plan(plan):
    if not plan: return
    
    print(f"\n📅 MACRO PLAN GENERATED")
    print("-" * 60)
    print(f"{'Week':<5} | {'Focus':<10} | {'Vol (hrs)':<10} | {'Key Sessions'}")
    print("-" * 60)
    
    for week in plan.get('macro_plan', []):
        sessions = ", ".join(week.get('key_sessions', [])[:2]) # Show first 2
        print(f"{week['week']:<5} | {week['focus']:<10} | {week['target_volume_hours']:<10} | {sessions}")
        
    print("-" * 60)

if __name__ == "__main__":
    print("--- Gemini AI Plan Generator ---")
    if len(sys.argv) > 1:
        key = sys.argv[1]
    else:
        key = input("Enter your Gemini API Key: ").strip()
        
    if key:
        print("\n--- Tell me about your athlete ---")
        goal = input("Goal (e.g. 'Sub-3 Marathon'): ") or "Run a sub-4 hour marathon in 12 weeks"
        fitness = input("Current Fitness (e.g. '30km/week, easy'): ") or "Run 30km/week, Longest run 15km"
        
        print(f"\n🤖 Generating Plan for: {goal}...")
        plan = generate_plan(key, goal, fitness)
        print_plan(plan)
    else:
        print("Missing API Key.")
