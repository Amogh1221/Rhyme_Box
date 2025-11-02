from fastapi import APIRouter
from .poems import router as poems_router
from .auth import router as auth_router
from .profile import router as profile_router
from .friends import router as friends_router
from .daily_poem import router as daily_router
from .users import router as users_router  # ✅ ADD THIS

router = APIRouter()

# Include sub-routers - poems router includes /generate_ai
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(poems_router, prefix="/poems", tags=["poems"])  # Add prefix here
router.include_router(profile_router, prefix="/profile", tags=["profile"])
router.include_router(friends_router, prefix="/friends", tags=["friends"])
router.include_router(daily_router, prefix="/daily", tags=["daily"])  # ✅ Added
router.include_router(users_router, prefix="/users", tags=["users"])  # ✅ ADD THIS
