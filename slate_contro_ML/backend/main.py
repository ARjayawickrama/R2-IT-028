import io
import base64
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import numpy as np
import cv2
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("best1.pt")


def get_refined_status(class_name):
    mapping = {
        "Status_Boiled": "Boiled ✅",
        "Status_PerfectlyBoiled_Splitting": "Boiled ✅",
        "Status_OverBoiled": "Over Boiled ⚠️",
        "Status_Boiling": "Currently Boiling...",
        "No_Object": "No Fish Detected",
        "fish_class_1": "Fish Detected"
    }
    return mapping.get(class_name, class_name)


def image_to_base64(img_array):
    _, buffer = cv2.imencode(".jpg", img_array)
    return base64.b64encode(buffer).decode("utf-8")


@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    confidence_threshold: float = Form(0.6),
    overlap_threshold: float = Form(0.5),
    opacity_threshold: float = Form(0.8)
):
    try:
        content = await file.read()
        img = Image.open(io.BytesIO(content)).convert("RGB")

        # YOLO inference (NO logic change, just using params optionally)
        results = model(img, conf=confidence_threshold, iou=overlap_threshold)

        detections = []

        annotated_frame = None

        for r in results:
            annotated_frame = r.plot()  # <-- annotated image (numpy array)

            for box in r.boxes:
                cls_id = int(box.cls[0])
                raw_label = model.names[cls_id]
                conf = float(box.conf[0])

                final_label = get_refined_status(raw_label)

                xyxy = box.xyxy[0].tolist()

                detections.append({
                    "label": final_label,
                    "confidence": round(conf, 2),
                    "bbox": [int(x) for x in xyxy]
                })

        if annotated_frame is None:
            return {
                "annotated_image_base64": None,
                "detections": []
            }

        img_b64 = image_to_base64(annotated_frame)

        return {
            "annotated_image_base64": img_b64,
            "detections": detections
        }

    except Exception as e:
        return {
            "error": str(e),
            "annotated_image_base64": None,
            "detections": []
        }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)