import io
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image

app = FastAPI(
    title="Dried Fish Quality Classification API",
    description="API for classifying the quality of dried fish using an EfficientNet model.",
    version="1.0.0"
)

# Global Configuration
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_PATH = "models/dried_fish_efficientnet_v3.pth"
CLASS_NAMES = ['High_Quality', 'Low_Quality', 'Medium_Quality']
UNCERTAINTY_THR = 0.60
IMG_SIZE = 224

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# Preprocessing transforms
preprocess = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
])

# Initialize Model
model = None

@app.on_event("startup")
def load_model():
    global model
    try:
        base = models.efficientnet_b0(weights=None)
        in_f = base.classifier[1].in_features
        base.classifier = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(in_f, 3)
        )
        ckpt = torch.load(MODEL_PATH, map_location=DEVICE)
        base.load_state_dict(ckpt['model_state_dict'])
        base = base.to(DEVICE)
        base.eval()
        model = base
        print(f"✅ Model loaded successfully on {DEVICE}")
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")

@app.get("/health")
def health_check():
    """Health check endpoint to ensure API is running."""
    if model is None:
        return JSONResponse(status_code=503, content={"status": "unhealthy", "message": "Model not loaded"})
    return {"status": "healthy", "message": "API and model are up and running"}

@app.post("/predict")
async def predict_fish_quality(file: UploadFile = File(...)):
    """Upload an image of dried fish and get a quality prediction."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded.")
        
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    try:
        # Preprocessing
        tensor = preprocess(image).unsqueeze(0).to(DEVICE)

        # Inference
        with torch.no_grad():
            output = model(tensor)
            probs = torch.softmax(output, dim=1).squeeze()

        confidence, pred_idx = probs.max(dim=0)
        confidence = confidence.item()
        pred_class = CLASS_NAMES[pred_idx.item()]
        
        # Postprocessing
        all_probs = {cls: round(p.item(), 4) for cls, p in zip(CLASS_NAMES, probs)}
        status = "OK" if confidence >= UNCERTAINTY_THR else "UNCERTAIN"
        
        return {
            "class": pred_class if status == "OK" else "UNCERTAIN",
            "confidence": round(confidence, 4),
            "probabilities": all_probs,
            "status": status,
            "raw_class": pred_class,
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
