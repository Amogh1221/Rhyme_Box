# 🎭 Rhyme Box - AI-Powered Poetry Platform

<div align="center">

![Rhyme Box Banner](frontend/src/assets/bg-index.jpg)

**A modern poetry platform where creativity meets artificial intelligence**

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-NeonDB-blue.svg)](https://neon.tech/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [API Docs](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 About

**Rhyme Box** is a full-stack poetry platform that combines the timeless art of poetry with modern AI capabilities. Write, share, and discover poems from a vibrant community, or let our RAG-powered AI assistant help craft your masterpiece.

### 🎯 Key Highlights

- ✍️ **Write Poetry** - Intuitive editor with tag-based categorization
- 🤖 **AI Poetry Generator** - RAG-powered poem generation using DeepSeek via OpenRouter
- 📅 **Daily Poem** - Fresh, theme-based poems generated every day
- 👥 **Social Features** - Follow poets, discover new works, build your profile
- 🎨 **Beautiful UI** - "Whispers of Ink" theme - soft, minimal, emotionally immersive
- 🔒 **Secure Authentication** - JWT-based auth with password hashing
- ☁️ **Cloud Storage** - Cloudinary integration for profile pictures and banners

---

## ✨ Features

### For Poets

- 📝 **Personal Poetry Dashboard** - Manage all your poems in one place
- 🏷️ **Smart Tagging System** - 12 categories: Themes, Emotions, Forms, AI & Tech, and more
- 🎭 **Public & Private Poems** - Control visibility and profile display
- 🖼️ **Custom Profiles** - Upload profile pictures and banners
- ✏️ **Edit & Organize** - Full CRUD operations on your poems

### For Readers

- 🌊 **Poetry Feed** - Discover poems from the community
- 🔍 **Filter by Tags** - Find poems by theme, emotion, style, and more
- 👤 **User Profiles** - Explore poets and their collections
- 📆 **Daily Inspiration** - 365 unique themed poems throughout the year

### AI-Powered Features

- 🧠 **RAG Technology** - Retrieval-Augmented Generation for contextual poems
- 🎨 **Theme-Based Generation** - Generate poems based on any theme
- 📚 **Poetry Database** - Trained on a curated corpus of poems
- ⚡ **Fast & Free** - Using DeepSeek model via OpenRouter

---

## 🚀 Demo

### Screenshots

#### Home Page
![Home Page](docs/screenshots/home.png)

#### AI Poetry Generator
![AI Generator](docs/screenshots/ai-generator.png)

#### User Profile
![Profile](docs/screenshots/profile.png)

### Live Demo

🔗 **[Try Rhyme Box Live](https://your-demo-url.com)** *(Coming Soon)*

---

## 🛠️ Tech Stack

### Frontend
- **HTML5, CSS3, JavaScript** - Pure vanilla JS, no frameworks
- **Custom CSS** - Hand-crafted "Whispers of Ink" theme
- **Responsive Design** - Mobile-first approach

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL (NeonDB)** - Serverless Postgres database
- **Pydantic** - Data validation and settings management

### AI & ML
- **LangChain** - RAG pipeline orchestration
- **ChromaDB** - Vector database for poem embeddings
- **Sentence Transformers** - Text embeddings (all-MiniLM-L6-v2)
- **DeepSeek via OpenRouter** - LLM for poem generation

### Infrastructure
- **Cloudinary** - Image storage and CDN
- **JWT** - Secure authentication
- **bcrypt** - Password hashing
- **Uvicorn** - ASGI server

---

## 📦 Installation

### Prerequisites

- Python 3.9+
- PostgreSQL (or NeonDB account)
- OpenRouter API key ([Get one here](https://openrouter.ai/))
- Cloudinary account ([Sign up](https://cloudinary.com/))

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/rhyme-box.git
cd rhyme-box
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
# Database (NeonDB or local PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Security
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI & RAG
RAG_PERSIST_DIR=./poem_chroma_bge_db
OPENAI_API_KEY=sk-or-v1-your-openrouter-api-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Database Setup

**Option A: Using NeonDB (Recommended)**

1. Create account at [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string to `DATABASE_URL` in `.env`

**Option B: Local PostgreSQL**

```bash
# Install PostgreSQL, then:
createdb rhymebox
```

### 5. Initialize Database

```bash
# Create tables
python -m scripts.init_db init

# Seed predefined tags
python -m scripts.init_db seed-tags

# (Optional) Create demo data
python -m scripts.init_db seed-demo
```

### 6. Setup RAG Database

```bash
# Unzip the pre-built vector database
unzip poem_chroma_bge_db.zip -d backend/

# Verify structure:
# backend/
# ├── poem_chroma_bge_db/
# │   ├── chroma.sqlite3
# │   └── ...
```

### 7. Run the Application

```bash
# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Backend will be available at http://localhost:8000
# Frontend will be served at http://localhost:8000/
```

---

## 📚 Usage

### Creating Your First Poem

1. **Sign Up** - Create an account or login
2. **Navigate to Write** - Click "Write a Poem" in the sidebar
3. **Compose** - Write your poem with title and content
4. **Add Tags** - Select relevant tags from 12 categories
5. **Publish** - Choose public or private visibility
6. **Share** - Your poem appears in your profile and the feed (if public)

### Using AI Poetry Generator

1. **Go to AI Page** - Click "AI Poetry" in the sidebar
2. **Enter Theme** - Type any theme (e.g., "autumn leaves", "lost love")
3. **Generate** - AI creates a unique poem using RAG
4. **Edit & Save** - Modify the title/content and save to your collection

### Customizing Your Profile

1. **Edit Profile** - Click "Edit Profile" button on your profile page
2. **Update Images** - Click banner or profile picture to change
3. **Add Bio & Tags** - Describe yourself and add interest tags
4. **Save Changes** - Your profile is instantly updated

---

## 🔧 API Documentation

### Authentication Endpoints

#### POST `/api/auth/signup`
Create a new user account.

**Request:**
```json
{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

#### POST `/api/auth/token`
Login and get JWT token.

**Request:**
```json
{
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

### Poem Endpoints

#### GET `/api/poems/`
Get public poems (paginated feed).

**Query Parameters:**
- `skip` (int): Offset for pagination (default: 0)
- `limit` (int): Number of poems to return (default: 50)
- `user` (string): Filter by username (optional)

#### POST `/api/poems/create`
Create a new poem (requires authentication).

**Request:**
```json
{
  "title": "Autumn Leaves",
  "content": "Golden leaves fall softly...",
  "is_public": true,
  "category": "manual"
}
```

#### POST `/api/poems/generate_ai`
Generate a poem using AI.

**Request:**
```json
{
  "theme": "sunset over mountains"
}
```

**Response:**
```json
{
  "success": true,
  "theme": "sunset over mountains",
  "title": "Crimson Horizon",
  "poem": "Rays of gold pierce clouds of gray..."
}
```

### Profile Endpoints

#### GET `/api/profile/me`
Get current user's profile (requires authentication).

#### POST `/api/profile/upload-profile-picture`
Upload profile picture to Cloudinary.

**Form Data:**
- `file`: Image file (max 5MB)

#### POST `/api/profile/upload-banner`
Upload banner image to Cloudinary.

**Form Data:**
- `file`: Image file (max 10MB)

### Daily Poem Endpoint

#### GET `/api/daily/{date}`
Get poem of the day for specific date.

**Example:** `/api/daily/2024-12-25`

---

## 🗂️ Project Structure

```
rhyme-box/
├── backend/                  # Backend application
│   ├── app/                  # FastAPI app
│   ├── scripts/               # Database initialization scripts
│   ├── poem_chroma_bge_db/   # RAG database
│   ├── tests/                # Unit and integration tests
│   └── venv/                 # Python virtual environment
└── frontend/                 # Frontend application
    ├── public/               # Public assets
    ├── src/                  # Source code
    └── index.html            # Main HTML file
```

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on how to get involved.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Inspired by the beauty of poetry and the power of AI.
- Built with passion by the Rhyme Box team.
