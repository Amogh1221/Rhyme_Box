from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas import PoemCreate, PoemOut
from app.models import Poem, User, PoemLike, Comment
from app.deps import get_current_user
from app.rag_engine.rag_poem_generator import generate_poem
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class PoemModel(BaseModel):
    id: int
    title: str
    content: str
    author: str
    is_public: bool
    created_at: str
    tags: List[dict] = []

@router.get("/", response_model=List[PoemOut])
def list_public_poems(
    skip: int = 0, 
    limit: int = 50,
    user: str = None,
    db: Session = Depends(get_db)
):
    """Get all public poems for the feed - PUBLIC endpoint, no auth required"""
    
    print(f"\n{'='*60}")
    print(f"📥 PUBLIC Feed request - skip: {skip}, limit: {limit}, user: {user}")
    print(f"{'='*60}")
    
    # ✅ Build query with optional user filter
    query = db.query(Poem).filter(Poem.is_public == True)
    
    if user:
        # Find user by username
        user_obj = db.query(User).filter(User.username == user.lstrip('@')).first()
        if user_obj:
            query = query.filter(Poem.user_id == user_obj.id)
    
    poems = query.order_by(Poem.created_at.desc()).offset(skip).limit(limit).all()
    
    print(f"✅ Found {len(poems)} public poems")
    
    # ✅ CRITICAL FIX: Build proper dict response with author username
    result = []
    for poem in poems:
        # ✅ Get author username from user_id by querying User table
        author_username = "@unknown"
        
        if poem.user_id:
            # ✅ Query User table to get the username
            author_user = db.query(User).filter(User.id == poem.user_id).first()
            
            if author_user:
                author_username = f"@{author_user.username}"
                print(f"  ✅ Poem '{poem.title}' by {author_username}")
            else:
                print(f"  ⚠️ Poem '{poem.title}' has user_id={poem.user_id} but USER NOT FOUND in database")
        else:
            print(f"  ⚠️ Poem '{poem.title}' has NO user_id (orphaned poem)")
        
        # ✅ Manually construct response dict (bypass Pydantic to ensure author field)
        poem_dict = {
            "id": poem.id,
            "user_id": poem.user_id,
            "title": poem.title or "Untitled",
            "content": poem.content,
            "is_public": poem.is_public,
            "category": poem.category or "manual",
            "created_at": poem.created_at,
            "updated_at": poem.updated_at,
            "author": author_username  # ✅ CRITICAL: Add author field
        }
        
        result.append(poem_dict)
    
    print(f"📤 Returning {len(result)} poems with author info")
    print(f"{'='*60}\n")
    
    return result

@router.get("/feed", response_model=dict)
def get_personalized_feed(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get personalized feed: user's poems + friends' poems + public poems"""
    
    print(f"\n{'='*60}")
    print(f"📥 Personalized feed for: {current_user.username}")
    print(f"   skip: {skip}, limit: {limit}")
    print(f"{'='*60}")
    
    # Get user's own poems (including private)
    own_poems = db.query(Poem)\
        .filter(Poem.user_id == current_user.id)\
        .order_by(Poem.created_at.desc())\
        .all()
    
    # TODO: Get friends' poems when friend system is implemented
    # For now, just get all public poems from other users
    public_poems = db.query(Poem)\
        .filter(
            Poem.is_public == True,
            Poem.user_id != current_user.id
        )\
        .order_by(Poem.created_at.desc())\
        .all()
    
    # Combine and sort by date
    all_poems = own_poems + public_poems
    all_poems.sort(key=lambda p: p.created_at, reverse=True)
    
    # Apply pagination
    total_count = len(all_poems)
    paginated_poems = all_poems[skip:skip + limit]
    
    # Format poems with author info
    result = []
    for poem in paginated_poems:
        poem_dict = {
            "id": poem.id,
            "user_id": poem.user_id,
            "title": poem.title or "Untitled",
            "content": poem.content,
            "is_public": poem.is_public,
            "category": poem.category,
            "created_at": poem.created_at,
            "updated_at": poem.updated_at,
            "author": None,
            "is_own": poem.user_id == current_user.id
        }
        
        if poem.user_id:
            user = db.query(User).filter(User.id == poem.user_id).first()
            if user:
                poem_dict["author"] = f"@{user.username}"
        
        result.append(poem_dict)
    
    has_more = (skip + limit) < total_count
    
    print(f"✅ Returning {len(result)} poems (total: {total_count}, has_more: {has_more})")
    print(f"{'='*60}\n")
    
    return {
        "poems": result,
        "total": total_count,
        "skip": skip,
        "limit": limit,
        "has_more": has_more
    }

@router.post("/create", response_model=PoemOut)
def create_poem(payload: PoemCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    poem = Poem(
        user_id = current_user.id,
        title = payload.title,
        content = payload.content,
        is_public = payload.is_public,
        category = payload.category
    )
    db.add(poem); db.commit(); db.refresh(poem)
    return poem

@router.get("/public", response_model=List[PoemOut])
def list_public(db: Session = Depends(get_db)):
    poems = db.query(Poem).filter(Poem.is_public==True).order_by(Poem.created_at.desc()).all()
    return poems

@router.get("/mine", response_model=List[PoemOut])
def my_poems(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    poems = db.query(Poem).filter(Poem.user_id==current_user.id).order_by(Poem.created_at.desc()).all()
    return poems

@router.post("/generate_ai")
def generate_ai_poem(payload: dict):
    """Generate a poem using RAG model based on theme."""
    theme = payload.get("theme")
    if not theme:
        raise HTTPException(status_code=400, detail="Theme is required")
    
    try:
        from app.rag_engine.rag_poem_generator import generate_poem
        poem_data = generate_poem(theme)
        
        return {
            "success": True,
            "theme": theme,
            "title": poem_data['title'],
            "poem": poem_data['content']
        }
    except Exception as e:
        import traceback
        print(f"❌ RAG generation failed: {e}")
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate poem: {str(e)}"
        )

@router.put("/{poem_id}/update")
def update_poem(
    poem_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an existing poem (title, content, visibility)."""
    
    print(f"\n{'='*60}")
    print(f"📝 UPDATE POEM REQUEST")
    print(f"{'='*60}")
    print(f"Poem ID: {poem_id}")
    print(f"User: {current_user.username}")
    
    # Find the poem
    poem = db.query(Poem).filter(Poem.id == poem_id).first()
    
    if not poem:
        print(f"❌ Poem not found: {poem_id}")
        raise HTTPException(status_code=404, detail="Poem not found")
    
    # Verify ownership
    if poem.user_id != current_user.id:
        print(f"❌ User {current_user.username} doesn't own poem {poem_id}")
        raise HTTPException(status_code=403, detail="You can only edit your own poems")
    
    # Update fields
    if 'title' in payload:
        poem.title = payload['title']
    if 'content' in payload:
        poem.content = payload['content']
    if 'is_public' in payload:
        poem.is_public = payload['is_public']
    
    poem.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(poem)
    
    print(f"✅ Poem updated successfully")
    print(f"   New title: {poem.title}")
    print(f"   Updated at: {poem.updated_at}")
    print(f"{'='*60}\n")
    
    return poem

@router.post("/{poem_id}/like")
def like_poem(
    poem_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Like a poem."""
    
    # Check if poem exists
    poem = db.query(Poem).filter(Poem.id == poem_id).first()
    if not poem:
        raise HTTPException(status_code=404, detail="Poem not found")
    
    # Check if already liked
    existing_like = db.query(PoemLike).filter(
        PoemLike.user_id == current_user.id,
        PoemLike.poem_id == poem_id
    ).first()
    
    if existing_like:
        # Unlike
        db.delete(existing_like)
        poem.like_count = max(0, poem.like_count - 1)
        db.commit()
        return {"liked": False, "like_count": poem.like_count}
    else:
        # Like
        new_like = PoemLike(user_id=current_user.id, poem_id=poem_id)
        db.add(new_like)
        poem.like_count += 1
        db.commit()
        return {"liked": True, "like_count": poem.like_count}

@router.get("/{poem_id}/likes")
def get_poem_likes(
    poem_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user) if False else None  # Optional auth
):
    """Get like count and user's like status."""
    
    poem = db.query(Poem).filter(Poem.id == poem_id).first()
    if not poem:
        raise HTTPException(status_code=404, detail="Poem not found")
    
    # Check if current user liked this poem
    user_liked = False
    if current_user:
        existing_like = db.query(PoemLike).filter(
            PoemLike.user_id == current_user.id,
            PoemLike.poem_id == poem_id
        ).first()
        user_liked = existing_like is not None
    
    return {
        "like_count": poem.like_count,
        "user_liked": user_liked
    }

@router.post("/{poem_id}/comment")
def add_comment(
    poem_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Add a comment to a poem."""
    
    content = payload.get("content", "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Comment cannot be empty")
    
    # Check if poem exists
    poem = db.query(Poem).filter(Poem.id == poem_id).first()
    if not poem:
        raise HTTPException(status_code=404, detail="Poem not found")
    
    # Create comment
    comment = Comment(
        user_id=current_user.id,
        poem_id=poem_id,
        content=content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    # Return comment with author info
    return {
        "id": comment.id,
        "content": comment.content,
        "author": f"@{current_user.username}",
        "created_at": comment.created_at.isoformat()
    }

@router.get("/{poem_id}/comments")
def get_comments(poem_id: int, db: Session = Depends(get_db)):
    """Get all comments for a poem."""
    
    comments = db.query(Comment).filter(Comment.poem_id == poem_id).order_by(Comment.created_at.desc()).all()
    
    result = []
    for comment in comments:
        user = db.query(User).filter(User.id == comment.user_id).first()
        result.append({
            "id": comment.id,
            "content": comment.content,
            "author": f"@{user.username}" if user else "@unknown",
            "author_image": user.profile_picture_url or user.image if user else None,
            "created_at": comment.created_at.isoformat(),
            "is_own": False  # Will be set by frontend
        })
    
    return result

@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a comment (only own comments)."""
    
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own comments")
    
    db.delete(comment)
    db.commit()
    
    return {"message": "Comment deleted"}
