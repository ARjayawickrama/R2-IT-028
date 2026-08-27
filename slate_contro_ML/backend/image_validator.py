import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

try:
    if GEMINI_KEY:
        client = genai.Client(api_key=GEMINI_KEY)
        print("[SECURITY MODULE] Gemini Verification Engine initialized with ultra-strict validation.")
    else:
        print("[SECURITY ERROR] API Key missing!")
        client = None
except Exception as e:
    print(f"[SECURITY MODULE ERROR] Initialization failed: {e}")
    client = None

def get_base_prompt():
    return (
        "You are an expert Quality Assurance Agent for 'FishGo', an industrial fish processing system.\n"
        "Your absolute, life-or-death priority is to distinguish raw (unboiled, fresh) fish from cooked/boiled fish.\n\n"
        "--- VISUAL CRITERIA ---\n"
        "1. NOTBOILED (RAW / FRESH FISH):\n"
        "   - Look at the fish skin and flesh. Fresh, unboiled tuna has shiny silver/blue metallic skin.\n"
        "   - The flesh (if cut open) is dark red, deep pink, translucent, or bloody.\n"
        "   - The overall appearance is wet, glossy, fresh, and raw.\n"
        "   - If the fish looks like it just came out of the sea or fridge, it is NOTBOILED.\n\n"
        "2. BOILED (COOKED):\n"
        "   - The fish has completely lost its red/pink/glossy look.\n"
        "   - It looks dry and opaque. The skin is dull grey, white, or light yellowish-brown.\n"
        "   - A clear, deep V-shaped or linear split is visible along the backbone, exposing cooked brown/grey fish meat fibers.\n\n"
        "3. OVERBOILED:\n"
        "   - The fish is breaking apart, mushy, or completely disintegrated in boiling water.\n"
        "   - The skin is peeled off and looks overcooked or grey/black.\n\n"
        "4. NO_OBJECT: The image does not contain any fish.\n\n"
        "--- OUTPUT REQUIREMENT ---\n"
        "Analyze carefully. If the fish is RAW/FRESH, you MUST reply with 'NOTBOILED'.\n"
        "Reply with ONLY ONE of these exact words: [NOTBOILED, BOILED, OVERBOILED, NO_OBJECT]. Do not write any other text."
    )

def deep_analyze_image_validity(image_bytes) -> str:
    if not client:
        return "NO_OBJECT"
    try:
        input_image = types.Part.from_bytes(
            data=image_bytes,
            mime_type='image/jpeg'
        )
        prompt = get_base_prompt()
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=[input_image, prompt]
        )
        verdict = response.text.strip().upper()
        print(f"[GEMINI VERDICT] AI analyzed image and returned: {verdict}")
        
        if verdict not in ["NOTBOILED", "BOILED", "OVERBOILED", "NO_OBJECT"]:
            return "NOTBOILED" # සැක සහිත නම් Safe Side එකට NOTBOILED දමයි
        return verdict
    except Exception as e:
        print(f"[SECURITY MODULE ERROR] Image analysis failed: {e}")
        return "NOTBOILED"