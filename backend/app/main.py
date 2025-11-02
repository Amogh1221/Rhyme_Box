from fastapi import FastAPI, HTTPException, Request
from app.database import engine, Base
from .routes import router as api_router
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
# ✅ COMMENT OUT: slowapi (optional production feature)
# from slowapi import Limiter, _rate_limit_exceeded_handler
# from slowapi.util import get_remote_address
# from slowapi.errors import RateLimitExceeded
import logging
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('rhymebox.log'),
        logging.StreamHandler()
    ]
)

# create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Rhyme Box Backend")

# ✅ CRITICAL: Update CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-domain.vercel.app",  # Your Vercel domain
        "https://your-custom-domain.com",  # Your custom domain (if any)
        "http://localhost:8000"  # For local development only
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# ✅ COMMENT OUT: Rate limiter (optional)
# limiter = Limiter(key_func=get_remote_address)
# app.state.limiter = limiter
# app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Resolve paths
project_root = Path(__file__).resolve().parents[2]
frontend_src = project_root / "frontend" / "src"
index_path = project_root / "index.html"

# First mount the frontend/src directory so CSS/JS can be found
if frontend_src.exists():
    app.mount("/frontend/src", StaticFiles(directory=str(frontend_src)), name="static")
    logging.info(f"Mounted frontend static files from: {frontend_src}")
else:
    raise HTTPException(status_code=500, detail=f"Frontend source directory not found at {frontend_src}")

# API routes
app.include_router(api_router, prefix="/api")

# Serve index.html at root
@app.get("/", include_in_schema=False)
async def serve_index():
    if index_path.exists():
        return FileResponse(str(index_path))
    return {"detail": "Index not found"}

# Serve pages
@app.get("/{page_name}.html", include_in_schema=False)
async def serve_page(page_name: str):
    # Try frontend/src/pages first
    page_path = frontend_src / "pages" / f"{page_name}.html"
    if page_path.exists():
        return FileResponse(str(page_path))
    
    # Try project root
    root_path = project_root / f"{page_name}.html"
    if root_path.exists():
        return FileResponse(str(root_path))
    
    return {"detail": "Page not found"}

# Health check endpoint
@app.get('/healthz')
def healthz():
    return {'status': 'ok'}

# ✅ Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    logging.info(
        f"{request.method} {request.url.path} "
        f"completed in {process_time:.2f}s "
        f"with status {response.status_code}"
    )
    
    return response

# ✅ Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
