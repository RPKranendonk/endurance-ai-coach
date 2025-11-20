import urllib.request
import json
import sys

def list_models(api_key):
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            print(f"\n{'Model Name':<40} | {'Supported Methods'}")
            print("-" * 80)
            
            found_any = False
            for model in data.get('models', []):
                name = model.get('name')
                methods = model.get('supportedGenerationMethods', [])
                
                if 'generateContent' in methods:
                    # Strip the "models/" prefix for easier reading
                    short_name = name.replace('models/', '')
                    print(f"{short_name:<40} | {', '.join(methods)}")
                    found_any = True
            
            if not found_any:
                print("No models found that support 'generateContent'.")
                
    except Exception as e:
        print(f"Error listing models: {e}")

if __name__ == "__main__":
    print("--- Checking Available Gemini Models ---")
    if len(sys.argv) > 1:
        key = sys.argv[1]
        list_models(key)
    else:
        key = input("Enter your Gemini API Key: ").strip()
        if key:
            list_models(key)
        else:
            print("Missing API Key.")
