from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, Table, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

# ===== ASSOCIATION TABLES =====

# Many-to-many: Poems <-> Tags
poem_tags = Table(
    "poem_tags",
    Base.metadata,
    Column("poem_id", Integer, ForeignKey("poems.id", ondelete='CASCADE'), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete='CASCADE'), primary_key=True),
    Column("created_at", DateTime, default=datetime.utcnow)
)

# ===== MAIN TABLES =====

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    # Profile fields
    profile_tag = Column(String(60), unique=True, index=True, nullable=True)
    bio = Column(Text, default="")
    
    # ✅ OLD: Deprecated (for backwards compatibility)
    profile_picture = Column(Text, default="")
    banner_image = Column(Text, default="")
    
    # ✅ NEW: Cloudinary URLs
    profile_picture_url = Column(String(500), nullable=True)
    profile_picture_public_id = Column(String(200), nullable=True)
    banner_image_url = Column(String(500), nullable=True)
    banner_image_public_id = Column(String(200), nullable=True)
    
    # Settings
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    poems = relationship("Poem", back_populates="user", cascade="all, delete-orphan")
    friendships = relationship("Friend", back_populates="user", foreign_keys="Friend.user_id", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_user_username_email', 'username', 'email'),
        Index('idx_user_created', 'created_at'),
    )

class Poem(Base):
    __tablename__ = "poems"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete='SET NULL'), nullable=True, index=True)
    
    # Content
    title = Column(String(200), nullable=True, index=True)
    content = Column(Text, nullable=False)
    
    # Metadata
    is_public = Column(Boolean, default=True, index=True)
    show_on_profile = Column(Boolean, default=True)
    category = Column(String(50), default="manual", index=True)  # "manual", "ai", "daily"
    
    # Stats
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="poems")
    tags = relationship("Tag", secondary=poem_tags, back_populates="poems")
    
    # Indexes
    __table_args__ = (
        Index('idx_poem_user_public', 'user_id', 'is_public'),
        Index('idx_poem_category_created', 'category', 'created_at'),
        Index('idx_poem_title', 'title'),
    )

class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    category = Column(String(50), default="misc", index=True)  # themes, tone, style, etc.
    color_class = Column(String(50), default="tag-misc")  # CSS class for styling
    
    # Stats
    usage_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    poems = relationship("Poem", secondary=poem_tags, back_populates="tags")
    
    __table_args__ = (
        Index('idx_tag_category', 'category'),
    )

# ✅ NEW: Predefined tag categories with new list
PREDEFINED_TAGS = {
    'Themes': {
        'color_class': 'tag-themes',
        'tags': ['Love', 'Nature', 'Life', 'Death', 'Time', 'Dreams', 'Freedom', 'Identity', 'Friendship', 'War', 'Peace', 'Hope', 'Loneliness', 'Childhood', 'Spirituality', 'Society', 'Technology', 'Change', 'Memory', 'Loss']
    },
    'Tone / Mood': {
        'color_class': 'tag-tone',
        'tags': ['Romantic', 'Melancholic', 'Inspirational', 'Tragic', 'Hopeful', 'Dark', 'Nostalgic', 'Joyful', 'Calm', 'Angry', 'Playful', 'Mysterious', 'Reflective', 'Haunting', 'Empowering']
    },
    'Style / Form': {
        'color_class': 'tag-style',
        'tags': ['Haiku', 'Sonnet', 'Free Verse', 'Limerick', 'Ballad', 'Ode', 'Elegy', 'Epic', 'Acrostic', 'Narrative', 'Blank Verse', 'Lyric', 'Dramatic Monologue']
    },
    'Language / Technique': {
        'color_class': 'tag-technique',
        'tags': ['Metaphorical', 'Symbolic', 'Descriptive', 'Abstract', 'Minimalist', 'Visual / Concrete', 'Allegorical', 'Satirical']
    },
    'Context / Origin': {
        'color_class': 'tag-context',
        'tags': ['Modern', 'Classical', 'Contemporary', 'Experimental', 'Folk', 'Cultural', 'Philosophical']
    },
    'Emotion / Intensity': {
        'color_class': 'tag-emotion',
        'tags': ['Passionate', 'Serene', 'Intense', 'Subtle', 'Meditative', 'Chaotic']
    }
}

class Friend(Base):
    __tablename__ = "friends"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete='CASCADE'), index=True)
    friend_id = Column(Integer, nullable=False, index=True)
    
    # Status: "pending", "accepted", "declined", "blocked"
    status = Column(String(20), default="pending", index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="friendships", foreign_keys=[user_id])
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'friend_id', name='_user_friend_uc'),
        Index('idx_friend_status', 'status'),
    )

class DailyPoem(Base):
    __tablename__ = "daily_poems"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(10), unique=True, index=True)  # YYYY-MM-DD format
    theme = Column(String(100), nullable=False)
    title = Column(String(200), nullable=True)
    content = Column(Text, nullable=False)
    
    # Metadata
    generated_by = Column(String(50), default="ai")  # "ai", "curator", "community"
    poem_id = Column(Integer, ForeignKey("poems.id", ondelete='SET NULL'), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_daily_date', 'date'),
    )

# ===== ADDITIONAL FEATURE TABLES =====

class PoemLike(Base):
    __tablename__ = "poem_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete='CASCADE'), index=True)
    poem_id = Column(Integer, ForeignKey("poems.id", ondelete='CASCADE'), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint('user_id', 'poem_id', name='_user_poem_like_uc'),
        Index('idx_like_poem', 'poem_id'),
    )

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete='CASCADE'), index=True)
    poem_id = Column(Integer, ForeignKey("poems.id", ondelete='CASCADE'), index=True)
    content = Column(Text, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_comment_poem_created', 'poem_id', 'created_at'),
    )

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete='CASCADE'), index=True)
    
    # Content
    type = Column(String(50), nullable=False)  # "like", "comment", "friend_request", etc.
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(500), nullable=True)
    
    # Status
    is_read = Column(Boolean, default=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    __table_args__ = (
        Index('idx_notification_user_read', 'user_id', 'is_read'),
    )

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete='CASCADE'), index=True, nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete='CASCADE'), index=True, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index('idx_chat_between', 'sender_id', 'receiver_id'),
    )

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete='CASCADE'), index=True)
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_token_expires', 'token', 'expires_at'),
    )

# ✅ Verify these indexes exist (already in your code):
# - idx_user_username_email on users(username, email)
# - idx_poem_user_public on poems(user_id, is_public)
# - idx_friend_status on friends(status)
# - idx_token_expires on password_reset_tokens(token, expires_at)
