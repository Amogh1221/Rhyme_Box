# Rhyme Box - Backend

This backend is a FastAPI application with:
- **PostgreSQL** (NeonDB) for production
- **SQLite** for local development (optional)
- JWT-based authentication
- User, Poem, Tag, Friend models
- RAG generator integration (loads Chroma DB from RAG_PERSIST_DIR)

## Quickstart

1. **Create virtualenv and install requirements:**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Setup Database:**

   - **NeonDB Setup** (Recommended for production):
     - Go to [Neon Console](https://console.neon.tech/)
     - Create a new project
     - Copy the connection string
     - Update `DATABASE_URL` in `.env`
   
   - **Alternative**: Use SQLite for local testing:
     ```env
     DATABASE_URL=sqlite:///./rhyme_box.db
     ```

3. **Initialize Database:**

```bash
# Create all tables
python -m scripts.init_db init

# Seed predefined tags (themes, emotions, etc.)
python -m scripts.init_db seed-tags

# Create demo user and sample data
python -m scripts.init_db seed-demo

# Or do everything at once
python -m scripts.init_db seed-all
```

4. **Setup RAG Database:**

   - **Unzip** `poem_chroma_bge_db.zip` to `backend/poem_chroma_bge_db/`
   - The folder structure should be:
     ```
     backend/
     ├── app/
     ├── poem_chroma_bge_db/    ← Unzipped here
     │   ├── chroma.sqlite3
     │   └── [other chroma files]
     ├── scripts/
     └── requirements.txt
     ```

5. **Configure environment variables:**

   - Copy `.env.example` to `.env`
   - Get an API key from [OpenRouter](https://openrouter.ai/)
   - Update `OPENAI_API_KEY` in `.env` with your OpenRouter key
   - Ensure `DATABASE_URL` points to your NeonDB instance

6. **Run the app:**

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

7. **Test the setup:**

   ```bash
   # Test database connection
   curl http://localhost:8000/healthz
   
   # Test AI poem generation
   curl -X POST http://localhost:8000/api/poems/generate_ai \
     -H "Content-Type: application/json" \
     -d '{"theme": "autumn leaves"}'
   ```

## Database Schema

### Core Tables:
- **users**: User accounts with authentication
- **poems**: User-created and AI-generated poems
- **tags**: Categorized tags (themes, emotions, forms, etc.)
- **poem_tags**: Many-to-many relationship between poems and tags
- **friends**: Friend connections between users
- **daily_poems**: Poem of the day archive

### Feature Tables:
- **poem_likes**: User likes on poems
- **comments**: Comments on poems
- **notifications**: User notifications

### Indexes:
- Optimized for common queries (user lookup, public poems, date sorting)
- Composite indexes for filtering

## Database Commands

```bash
# Initialize database (create tables)
python -m scripts.init_db init

# Seed predefined tags
python -m scripts.init_db seed-tags

# Create demo data (user + sample poems)
python -m scripts.init_db seed-demo

# Seed everything
python -m scripts.init_db seed-all

# Reset database (WARNING: deletes all data)
python -m scripts.init_db reset
```

## NeonDB Notes

- **Serverless**: Neon automatically scales and pauses when inactive
- **Branching**: You can create database branches for testing
- **Connection Pooling**: Configured with `pool_pre_ping` to handle serverless nature
- **SSL**: Always enabled for secure connections

## Development vs Production

**Development** (SQLite):
```env
DATABASE_URL=sqlite:///./rhyme_box.db
```

**Production** (NeonDB):
```env
DATABASE_URL=postgresql://username:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
```

## Notes

- The RAG module uses `sentence-transformers/all-MiniLM-L6-v2`
- DeepSeek model via OpenRouter is free but rate-limited
- For production, consider upgrading to a paid model for faster generation
- NeonDB free tier includes 3GB storage and compute auto-suspend
