from app.database import SessionLocal, engine, Base
from app.models import User, Poem
from app.utils.security import get_password_hash

Base.metadata.create_all(bind=engine)

db = SessionLocal()
# create demo user
if not db.query(User).filter(User.username=='demo').first():
    u = User(username='demo', email='demo@example.com', password_hash=get_password_hash('demo123'), profile_tag='@demo')
    db.add(u); db.commit(); db.refresh(u)
    p = Poem(user_id=u.id, title='Demo Poem', content='This is a demo poem. Welcome to Rhyme Box!', is_public=True)
    db.add(p); db.commit()
    print('Created demo user and poem')
else:
    print('Demo already exists')
