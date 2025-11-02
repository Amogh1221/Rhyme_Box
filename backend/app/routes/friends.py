from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_  # ✅ ADD IMPORT
from datetime import datetime, timedelta
from typing import List
from app.database import get_db
from app.models import Friend, User, ChatMessage
from app.deps import get_current_user

router = APIRouter()

# Send friend request (creates pending request)
@router.post('/follow')
def follow(payload: dict, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    friend_username = payload.get('username')
    if not friend_username:
        raise HTTPException(status_code=400, detail="username required")
    friend = db.query(User).filter(User.username==friend_username).first()
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")
    if friend.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    # Check existing directed relation
    existing = db.query(Friend).filter(Friend.user_id==current_user.id, Friend.friend_id==friend.id).first()
    if existing:
        if existing.status == "pending":
            return {"status":"pending", "detail":"Request already sent"}
        if existing.status == "accepted":
            raise HTTPException(status_code=400, detail="Already friends")
        # if declined or other, allow re-request
        existing.status = "pending"
        existing.created_at = datetime.utcnow()
        db.commit()
        return {"status":"pending", "detail":"Friend request re-sent"}

    fr = Friend(user_id=current_user.id, friend_id=friend.id, status="pending")
    db.add(fr); db.commit(); db.refresh(fr)
    return {"status":"pending", "friend_id": friend.id}

# List accepted friends for current user
@router.get('/list')
def list_friends(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """List all accepted friends (bidirectional check)."""
    
    print(f"\n{'='*60}")
    print(f"👥 FRIENDS LIST REQUEST")
    print(f"{'='*60}")
    print(f"User: {current_user.username} (ID: {current_user.id})")
    
    # ✅ Get friends where current_user sent the request
    outgoing = db.query(Friend).filter(
        Friend.user_id==current_user.id, 
        Friend.status=="accepted"
    ).all()
    
    # ✅ Get friends where current_user received the request
    incoming = db.query(Friend).filter(
        Friend.friend_id==current_user.id, 
        Friend.status=="accepted"
    ).all()
    
    print(f"Outgoing friendships: {len(outgoing)}")
    print(f"Incoming friendships: {len(incoming)}")
    
    # ✅ Combine both directions and deduplicate
    friend_ids = set()
    for r in outgoing:
        friend_ids.add(r.friend_id)
    for r in incoming:
        friend_ids.add(r.user_id)
    
    print(f"Total unique friends: {len(friend_ids)}")
    
    result = []
    for friend_id in friend_ids:
        u = db.query(User).filter(User.id==friend_id).first()
        if u:
            result.append({
                "username": u.username, 
                "profile_tag": u.profile_tag, 
                "status": "accepted",
                "name": u.name, 
                "profile_picture_url": u.profile_picture_url
            })
            print(f"  - {u.username}")
    
    print(f"{'='*60}\n")
    return result

# Incoming friend requests (requests sent TO current_user)
@router.get('/requests')
def incoming_requests(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    rows = db.query(Friend).filter(Friend.friend_id==current_user.id, Friend.status=="pending").all()
    result = []
    for r in rows:
        u = db.query(User).filter(User.id==r.user_id).first()
        if u:
            result.append({"username": u.username, "name": u.name, "profile_picture_url": u.profile_picture_url, "requested_at": r.created_at})
    return result

# Respond to a friend request: accept or decline
@router.post('/respond')
def respond(payload: dict, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    requester_username = payload.get('username')
    action = payload.get('action')  # "accept" or "decline"
    if not requester_username or action not in ("accept","decline"):
        raise HTTPException(status_code=400, detail="username and valid action required")
    requester = db.query(User).filter(User.username==requester_username).first()
    if not requester:
        raise HTTPException(status_code=404, detail="User not found")

    print(f"\n{'='*60}")
    print(f"🤝 FRIEND REQUEST RESPONSE")
    print(f"{'='*60}")
    print(f"Requester: {requester.username} (ID: {requester.id})")
    print(f"Current User: {current_user.username} (ID: {current_user.id})")
    print(f"Action: {action}")

    # Find request row (requester -> current_user)
    req = db.query(Friend).filter(
        Friend.user_id==requester.id, 
        Friend.friend_id==current_user.id, 
        Friend.status=="pending"
    ).first()
    
    if not req:
        print(f"❌ No pending request found")
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    print(f"✅ Found pending request (ID: {req.id})")

    if action == "accept":
        # ✅ CRITICAL FIX: Update the incoming request
        req.status = "accepted"
        req.updated_at = datetime.utcnow()
        
        print(f"✅ Updated incoming request to 'accepted'")
        
        # ✅ CRITICAL FIX: Create or update the reciprocal friendship (current_user -> requester)
        reciprocal = db.query(Friend).filter(
            Friend.user_id==current_user.id, 
            Friend.friend_id==requester.id
        ).first()
        
        if reciprocal:
            print(f"✅ Found existing reciprocal friendship (ID: {reciprocal.id}), updating to 'accepted'")
            reciprocal.status = "accepted"
            reciprocal.updated_at = datetime.utcnow()
        else:
            print(f"✅ Creating new reciprocal friendship")
            reciprocal = Friend(
                user_id=current_user.id, 
                friend_id=requester.id, 
                status="accepted",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(reciprocal)
        
        db.commit()
        
        # ✅ Verify both directions exist
        check1 = db.query(Friend).filter(
            Friend.user_id==requester.id, 
            Friend.friend_id==current_user.id,
            Friend.status=="accepted"
        ).first()
        
        check2 = db.query(Friend).filter(
            Friend.user_id==current_user.id, 
            Friend.friend_id==requester.id,
            Friend.status=="accepted"
        ).first()
        
        print(f"✅ Verification:")
        print(f"   {requester.username} -> {current_user.username}: {'EXISTS' if check1 else 'MISSING'}")
        print(f"   {current_user.username} -> {requester.username}: {'EXISTS' if check2 else 'MISSING'}")
        print(f"{'='*60}\n")
        
        return {"status":"accepted", "friend": requester.username}
    else:
        # decline -> mark or delete
        req.status = "declined"
        req.updated_at = datetime.utcnow()
        db.commit()
        
        print(f"✅ Request declined")
        print(f"{'='*60}\n")
        
        return {"status":"declined", "friend": requester.username}

# Check relationship status between current_user and username
@router.get('/status/{username}')
def status(username: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    target = db.query(User).filter(User.username==username).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == current_user.id:
        return {"status":"self"}

    # Check if current_user sent request or is friend
    sent = db.query(Friend).filter(Friend.user_id==current_user.id, Friend.friend_id==target.id).first()
    incoming = db.query(Friend).filter(Friend.user_id==target.id, Friend.friend_id==current_user.id).first()

    if sent and sent.status == "accepted":
        return {"status":"friends", "direction":"outgoing"}
    if incoming and incoming.status == "accepted":
        return {"status":"friends", "direction":"incoming"}
    if sent and sent.status == "pending":
        return {"status":"pending_sent"}
    if incoming and incoming.status == "pending":
        return {"status":"pending_incoming"}
    return {"status":"none"}

# Remove friend (delete accepted relation both ways)
@router.delete('/remove')
def remove_friend(payload: dict, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    target_username = payload.get('username')
    if not target_username:
        raise HTTPException(status_code=400, detail="username required")
    target = db.query(User).filter(User.username==target_username).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ FIX: Use SQLAlchemy or_() and and_() for proper query syntax
    db.query(Friend).filter(
        or_(
            and_(Friend.user_id == current_user.id, Friend.friend_id == target.id),
            and_(Friend.user_id == target.id, Friend.friend_id == current_user.id)
        )
    ).delete(synchronize_session=False)
    db.commit()
    return {"status":"removed", "friend": target_username}

# Send chat message to a friend (only if accepted friendship exists)
@router.post('/chat/{username}')
def send_message(username: str, payload: dict, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    content = (payload.get('content') or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message content required")
    target = db.query(User).filter(User.username==username).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    # verify accepted friendship (either direction)
    accepted = db.query(Friend).filter(Friend.user_id==current_user.id, Friend.friend_id==target.id, Friend.status=="accepted").first()
    if not accepted:
        raise HTTPException(status_code=403, detail="Can only chat with friends")
    msg = ChatMessage(sender_id=current_user.id, receiver_id=target.id, content=content)
    db.add(msg); db.commit(); db.refresh(msg)
    return {"id": msg.id, "content": msg.content, "created_at": msg.created_at.isoformat(), "sender": current_user.username}

# Get chat messages with user for last 24 hours (both directions)
@router.get('/chat/{username}')
def get_messages(username: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    target = db.query(User).filter(User.username==username).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    # verify accepted friendship
    accepted = db.query(Friend).filter(Friend.user_id==current_user.id, Friend.friend_id==target.id, Friend.status=="accepted").first()
    if not accepted:
        raise HTTPException(status_code=403, detail="Can only chat with friends")
    cutoff = datetime.utcnow() - timedelta(hours=24)
    rows = db.query(ChatMessage).filter(
        ((ChatMessage.sender_id==current_user.id) & (ChatMessage.receiver_id==target.id)) |
        ((ChatMessage.sender_id==target.id) & (ChatMessage.receiver_id==current_user.id))
    ).filter(ChatMessage.created_at >= cutoff).order_by(ChatMessage.created_at.asc()).all()
    return [{"id": r.id, "sender": db.query(User).filter(User.id==r.sender_id).first().username, "content": r.content, "created_at": r.created_at.isoformat()} for r in rows]

# ✅ NEW: Search users by username (autocomplete)
@router.get('/search')
def search_users(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Search users by username or name (autocomplete)."""
    
    search_term = f"%{q}%"
    
    # Search by username or name, exclude current user
    users = db.query(User).filter(
        (User.username.ilike(search_term) | User.name.ilike(search_term)),
        User.id != current_user.id
    ).limit(limit).all()
    
    return [{
        "id": u.id,
        "username": u.username,
        "name": u.name,
        "profile_tag": u.profile_tag,
        "profile_picture_url": u.profile_picture_url,
        "bio": u.bio[:100] if u.bio else None  # First 100 chars of bio
    } for u in users]
