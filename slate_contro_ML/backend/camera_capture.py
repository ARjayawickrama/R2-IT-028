import cv2
import time
import requests
import os

# ⚙️ configurations
API_URL = "http://127.0.0.1:8000/api/compare-sliding"
CAPTURE_DELAY = 100  # තත්පර 100ක ප්‍රමාදය (Time between frames)
CAMERA_INDEX = 0      # Default Web Camera / IP Cam / ESP32-Cam RTSP Link

def capture_image(camera, filename="temp_capture.jpg"):
    """කැමරාවෙන් පින්තූරයක් ගෙන තාවකාලිකව සේව් කරයි."""
    # කැමරා බෆර් එක ක්ලියර් කර අලුත්ම ෆ්‍රේම් එකක් ගැනීමට කිහිප වරක් කියවයි
    for _ in range(5):
        ret, frame = camera.read()
        
    if not ret:
        print("[CAMERA ERROR] කැමරාවෙන් පින්තූරය ලබාගත නොහැක!")
        return None
        
    cv2.imwrite(filename, frame)
    return filename

def send_to_api(file1_path, file2_path):
    """පින්තූර දෙක FastAPI Backend එකට API හරහා යවයි."""
    try:
        print(f"[API] පින්තූර සසඳමින් පවතී: {file1_path} ↔ {file2_path}")
        
        with open(file1_path, 'rb') as f1, open(file2_path, 'rb') as f2:
            files = [
                ('files', (os.path.basename(file1_path), f1, 'image/jpeg')),
                ('files', (os.path.basename(file2_path), f2, 'image/jpeg'))
            ]
            response = requests.post(API_URL, files=files)
            
        if response.status_code == 200:
            return response.json()
        else:
            print(f"[API ERROR] Response Error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"[API ERROR] Backend එක සම්බන්ධ කරගත නොහැක: {e}")
        return None

def main():
    print("[SYSTEM] FishGo Auto-Capture System එක ආරම්භ විය...")
    
    # කැමරාව සම්බන්ධ කිරීම
    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        print("[SYSTEM ERROR] කැමරාව ක්‍රියාත්මක කළ නොහැක!")
        return

    # තාවකාලික පින්තූර සේව් වන ස්ථාන
    img1_path = "frame_initial.jpg"
    img2_path = "frame_secondary.jpg"

    try:
        # 1. පළමු පින්තූරය (Initial Image) ලබා ගැනීම
        print("\n📸 [STEP 1] පළමු පින්තූරය (Initial Image) ලබා ගනී...")
        if not capture_image(cap, img1_path):
            return

        while True:
            # 2. තත්පර 100ක් බලා සිටීම
            print(f"⏳ [WAIT] මීළඟ පින්තූරය ගැනීමට තත්පර {CAPTURE_DELAY}ක් බලා සිටී...")
            time.sleep(CAPTURE_DELAY)

            # 3. දෙවන පින්තූරය (Secondary Image) ලබා ගැනීම
            print("📸 [STEP 2] දෙවන පින්තූරය (Secondary Image) ලබා ගනී...")
            if not capture_image(cap, img2_path):
                continue

            # 4. API එකට යවා සංසන්දනය කිරීම
            result = send_to_api(img1_path, img2_path)
            
            if result and result.get("success"):
                verdict = result["verdict"]
                status = verdict["status"]
                message = verdict["message"]
                
                print(f"\n📢 [RESULT] Status: {status}")
                print(f"📝 [MESSAGE] {message}")

                # 🚨 තීරණය අනුව ක්‍රියාත්මක වීම
                if status == "DANGER_OVERBOILED":
                    print("🛑 [ALERT] මාළු OVERBOIL වී ඇත! පද්ධතිය නතර කෙරේ!")
                    break
                elif status == "COMPLETED":
                    print("🎉 [SUCCESS] මාළු නිසි පරිදි තැම්බී අවසන්! පද්ධතිය නතර කෙරේ!")
                    break
                elif status == "STILL_COOKING":
                    print("🔄 [SHIFT] තවමත් තැම්බෙමින් පවතී. Sliding Window එක Shift වේ.")
                    
                    # 5. [AUTO SHIFT] දෙවැනි පින්තූරය පළමු පින්තූරය බවට පත් කරයි (පැරණි එක මැකී යයි)
                    if os.path.exists(img1_path):
                        os.remove(img1_path)
                    os.rename(img2_path, img1_path)
                    print("➡️  දෙවන පින්තූරය දැන් 'Initial Image' ලෙස සකස් විය.")
            else:
                print("❌ [ERROR] API එකෙන් නිසි ප්‍රතිචාරයක් නොලැබුණි. නැවත උත්සාහ කරයි...")

    except KeyboardInterrupt:
        print("\n👋 [SYSTEM] පරිශීලකයා විසින් පද්ධතිය නතර කරන ලදී.")
    finally:
        cap.release()
        cv2.destroyAllWindows()
        # තාවකාලික ෆයිල් ඉවත් කිරීම
        for f in [img1_path, img2_path]:
            if os.path.exists(f):
                os.remove(f)

if __name__ == "__main__":
    main()