import json

def convert_structure_to_text(structure):
    if not structure:
        return ''

    text = ''
    current_group = ''

    for block in structure:
        group_name = block['type'].capitalize()
        
        if group_name != current_group:
            text += f"\n{group_name}\n"
            current_group = group_name

        line = f"- {block['duration_min']}m"
        
        if 'target' in block and 'value' in block['target']:
             line += f" {block['target']['value']}"
        else:
            line += f" {block['intensity']}"
        
        text += f"{line}\n"

    return text.strip()

mock_workout = {
    "structure": [
        { "type": "warmup", "duration_min": 10, "intensity": "easy", "target": { "metric": "hr", "value": "Z1" } },
        { "type": "interval", "duration_min": 5, "intensity": "threshold", "target": { "metric": "pace", "value": "4:00/km" } },
        { "type": "recovery", "duration_min": 2, "intensity": "easy", "target": { "metric": "rpe", "value": "3" } },
        { "type": "cooldown", "duration_min": 10, "intensity": "easy", "target": { "metric": "hr", "value": "Z1" } }
    ]
}

result = convert_structure_to_text(mock_workout['structure'])
print("Generated Text:")
print(result)

expected_snippets = [
    "Warmup", "- 10m Z1",
    "Interval", "- 5m 4:00/km",
    "Recovery", "- 2m 3",
    "Cooldown", "- 10m Z1"
]

if all(snippet in result for snippet in expected_snippets):
    print("✅ Verification PASSED")
else:
    print("❌ Verification FAILED")
