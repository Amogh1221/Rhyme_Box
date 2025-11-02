"""
Simplified AI poem generator without RAG.
Uses only LLM with system prompt - no embeddings or database lookup.
"""
from app.config import settings

# Optional imports (only required if using AI generation)
try:
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_community.chat_models import ChatOpenAI
    LLM_AVAILABLE = True
except Exception as e:
    LLM_AVAILABLE = False
    print(f"⚠️ LLM dependencies not available: {e}")

# Cache LLM in module
_llm = None

def _setup_llm():
    """Initialize LLM for poem generation (no RAG, no embeddings)."""
    if not LLM_AVAILABLE:
        raise RuntimeError('LLM dependencies are not installed. Please install requirements including langchain.')
    
    # Check API key
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "":
        raise RuntimeError("⚠️ OPENAI_API_KEY is not configured. Please set it in .env file.")
    
    # Use OpenRouter with DeepSeek model (free)
    print("🤖 Initializing LLM...")
    llm = ChatOpenAI(
        model="tngtech/deepseek-r1t2-chimera:free",
        openai_api_base="https://openrouter.ai/api/v1",
        openai_api_key=settings.OPENAI_API_KEY,
        temperature=0.7,
        max_tokens=1024
    )
    
    print("✅ LLM initialized successfully!")
    return llm

def generate_poem(theme: str) -> dict:
    """Generate a poem based on the given theme using LLM (no RAG).
    
    Args:
        theme: The theme or topic for the poem
        
    Returns:
        dict: {
            'title': str,  # Extracted title from the poem
            'content': str  # The poem body without the title
        }
    """
    global _llm
    
    if _llm is None:
        print("🔧 Setting up LLM for the first time...")
        _llm = _setup_llm()
    
    # System prompt for poetry generation (no context, just creative instructions)
    system_prompt = (
        "You are a creative and skilled poetry generator. "
        "Write original, beautiful poems with vivid imagery, emotional depth, and poetic language. "
        "Maintain proper poetic form, rhythm, and structure. "
        "Return only the poem as output, without any explanations or meta-commentary. "
        "If the first line contains a title in **markdown**, extract it separately. "
        "Otherwise, create a poetic title based on the theme."
    )
    
    # Create chat prompt with theme variable
    chat_prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "Write a poem about: {theme}")
    ])
    
    # Generate poem
    print(f"🎨 Generating poem for theme: '{theme}'")
    chain = chat_prompt | _llm
    response = chain.invoke({"theme": theme})
    
    # Extract the poem content
    raw_poem = response.content if hasattr(response, 'content') else str(response)
    
    # Extract title (text between ** markers on first line, or first line as title)
    lines = raw_poem.strip().split('\n')
    title = theme  # Default to theme if no title found
    content = raw_poem
    
    # Check if first line contains **Title**
    if lines and '**' in lines[0]:
        import re
        title_match = re.search(r'\*\*(.+?)\*\*', lines[0])
        if title_match:
            title = title_match.group(1).strip()
            # Remove the title line from content
            content = '\n'.join(lines[1:]).strip()
    elif lines and len(lines) > 1:
        # Use first line as title if it's short
        first_line = lines[0].strip()
        if len(first_line) < 60 and not first_line.endswith(('.', ',', ';', ':', '!', '?')):
            title = first_line
            content = '\n'.join(lines[1:]).strip()
    
    print(f"✨ Poem generated: '{title}' ({len(content)} characters)")
    return {
        'title': title,
        'content': content
    }
