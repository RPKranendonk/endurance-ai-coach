import math

def calculate_pace_zones(threshold_pace):
    return {
        'Z1': {'min': threshold_pace * 1.30, 'max': threshold_pace * 1.45},
        'Z2': {'min': threshold_pace * 1.15, 'max': threshold_pace * 1.30},
        'Z3': {'min': threshold_pace * 1.05, 'max': threshold_pace * 1.15},
        'Z4': {'min': threshold_pace * 1.00, 'max': threshold_pace * 1.05},
        'Z5': {'min': threshold_pace * 0.90, 'max': threshold_pace * 1.00},
    }

def calculate_hr_zones(lthr):
    return {
        'Z1': {'min': 0, 'max': round(lthr * 0.85) - 1},
        'Z2': {'min': round(lthr * 0.85), 'max': round(lthr * 0.89)},
        'Z3': {'min': round(lthr * 0.90), 'max': round(lthr * 0.94)},
        'Z4': {'min': round(lthr * 0.95), 'max': round(lthr * 0.99)},
        'Z5': {'min': round(lthr * 1.00), 'max': 220},
    }

def format_pace(seconds):
    mins = math.floor(seconds / 60)
    secs = round(seconds % 60)
    return f"{mins}:{secs:02d}"

def resolve_pace_target(threshold_pace, zone, position):
    zones = calculate_pace_zones(threshold_pace)
    rng = zones[zone]
    # Easiest (Pos 0) is MAX seconds (slower)
    return rng['max'] - (position * (rng['max'] - rng['min']))

def run_verification():
    print("Starting Zone Verification...")

    # 1. Test Profile
    threshold_pace = 240 # 4:00/km
    lthr = 170 # bpm

    print(f"\nProfile: TP={format_pace(threshold_pace)}/km, LTHR={lthr} bpm")

    # 2. Verify Pace Zones
    print("\n--- Pace Zones ---")
    pace_zones = calculate_pace_zones(threshold_pace)
    print(f"Z1 (Easy): {format_pace(pace_zones['Z1']['min'])} - {format_pace(pace_zones['Z1']['max'])}")
    print(f"Z4 (Threshold): {format_pace(pace_zones['Z4']['min'])} - {format_pace(pace_zones['Z4']['max'])}")
    
    if abs(pace_zones['Z4']['min'] - 240) < 1 and abs(pace_zones['Z4']['max'] - 252) < 1:
        print("✅ Z4 Pace Calculation Correct")
    else:
        print("❌ Z4 Pace Calculation Failed")

    # 3. Verify HR Zones
    print("\n--- HR Zones ---")
    hr_zones = calculate_hr_zones(lthr)
    print(f"Z4 (Threshold): {hr_zones['Z4']['min']} - {hr_zones['Z4']['max']}")
    
    if hr_zones['Z4']['min'] == 162 and hr_zones['Z4']['max'] == 168:
        print("✅ Z4 HR Calculation Correct")
    else:
        print("❌ Z4 HR Calculation Failed")

    # 4. Verify Target Resolution
    print("\n--- Target Resolution ---")
    z4_target = resolve_pace_target(threshold_pace, 'Z4', 0.5)
    print(f"Z4 @ 0.5 Target: {format_pace(z4_target)}")
    
    if abs(z4_target - 246) < 1:
        print("✅ Z4 Target Resolution Correct")
    else:
        print(f"❌ Z4 Target Resolution Failed. Got: {z4_target}")

    # 5. Verify Update Behavior
    print("\n--- Update Behavior (New TP) ---")
    new_tp = 300 # 5:00/km
    new_z4_target = resolve_pace_target(new_tp, 'Z4', 0.5)
    print(f"New TP: {format_pace(new_tp)}/km")
    print(f"New Z4 @ 0.5 Target: {format_pace(new_z4_target)}")
    
    if abs(new_z4_target - 307.5) < 1:
         print("✅ Dynamic Update Verified")
    else:
         print("❌ Dynamic Update Failed")

if __name__ == "__main__":
    run_verification()
