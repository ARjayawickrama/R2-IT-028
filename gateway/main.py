"""
API Gateway for Fish Processing System
Routes all microservices through a single entry point
"""

import sys
import logging
import httpx
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Configure UTF-8 encoding for Windows stdout/stderr
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Microservice URLs
AI_BACKEND_API = "http://127.0.0.1:8000"
BOILER_API = "http://127.0.0.1:5000"

# Create FastAPI app
app = FastAPI(
    title="Fish Processing System - API Gateway",
    description="Central gateway for all fish processing microservices",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Health Checks ====================
@app.get("/health")
async def health_check():
    """Check health of all microservices"""
    services = {}
    
    async with httpx.AsyncClient() as client:
        # Check Unified AI Backend (Fish Freshness & Quality)
        try:
            response = await client.get(f"{AI_BACKEND_API}/health", timeout=5)
            services["ai_backend"] = "✅ Running" if response.status_code == 200 else "⚠️ Error"
        except Exception as e:
            services["ai_backend"] = f"❌ Offline: {str(e)}"
        
        # Check Boiler API
        try:
            response = await client.get(f"{BOILER_API}/", timeout=5)
            services["boiler_api"] = "✅ Running" if response.status_code == 200 else "⚠️ Error"
        except Exception as e:
            services["boiler_api"] = f"❌ Offline: {str(e)}"
    
    return {
        "gateway": "✅ Running",
        "services": services
    }

# ==================== Fish Freshness API Routes ====================
@app.get("/fish-freshness/")
async def fish_freshness_home():
    """Get Fish Freshness API info"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{AI_BACKEND_API}/")
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"AI Backend error: {str(e)}")

@app.post("/fish-freshness/predict")
async def fish_freshness_predict(file: UploadFile = File(...)):
    """Predict fish freshness (YOLO-based)"""
    async with httpx.AsyncClient() as client:
        try:
            files = {"file": (file.filename, await file.read(), file.content_type)}
            response = await client.post(f"{AI_BACKEND_API}/freshness/predict", files=files)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"AI Backend unavailable: {str(e)}")

# ==================== Quality Classification API Routes ====================
@app.get("/quality/health")
async def quality_health():
    """Check quality API health"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{AI_BACKEND_API}/quality/health")
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Quality API error: {str(e)}")

@app.post("/quality/predict")
async def quality_predict(file: UploadFile = File(...)):
    """Predict fish quality (EfficientNet-based with MQTT)"""
    async with httpx.AsyncClient() as client:
        try:
            files = {"file": (file.filename, await file.read(), file.content_type)}
            response = await client.post(f"{AI_BACKEND_API}/quality/predict", files=files)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"AI Backend unavailable: {str(e)}")

# ==================== Boiler Control API Routes ====================
@app.post("/boiler/predict")
async def boiler_predict(fish_weight: float, thickness: float, temperature: float):
    """Predict cooking time for boiler"""
    async with httpx.AsyncClient() as client:
        try:
            payload = {
                "fish_weight": fish_weight,
                "thickness": thickness,
                "temperature": temperature
            }
            response = await client.post(f"{BOILER_API}/predict", json=payload)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Boiler API unavailable: {str(e)}")

# ==================== Info Routes ====================
@app.get("/info")
async def gateway_info():
    """Get information about all APIs"""
    return {
        "gateway": {
            "url": "http://127.0.0.1:9000",
            "status": "Running"
        },
        "microservices": {
            "ai_backend": {
                "url": AI_BACKEND_API,
                "type": "Unified AI Backend (EfficientNet Quality Classification & YOLO Freshness Detection)",
                "endpoints": [
                    f"GET {AI_BACKEND_API}/health",
                    f"POST {AI_BACKEND_API}/freshness/predict",
                    f"POST {AI_BACKEND_API}/quality/predict"
                ]
            },
            "boiler_api": {
                "url": BOILER_API,
                "type": "Flask - Boiler cooking time prediction",
                "endpoints": [
                    f"POST {BOILER_API}/predict"
                ]
            }
        },
        "gateway_endpoints": {
            "health": "GET /health",
            "info": "GET /info",
            "fish_freshness": {
                "home": "GET /fish-freshness/",
                "predict": "POST /fish-freshness/predict"
            },
            "quality": {
                "health": "GET /quality/health",
                "predict": "POST /quality/predict"
            },
            "boiler": {
                "predict": "POST /boiler/predict"
            }
        }
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Starting API Gateway on http://127.0.0.1:9000")
    logger.info("📚 API Docs: http://127.0.0.1:9000/docs")
    uvicorn.run(app, host="0.0.0.0", port=9000)
