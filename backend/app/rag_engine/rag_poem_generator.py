import os
from app.config import settings

# Optional imports (only required if using RAG generation)
try:
    from langchain_community.embeddings import HuggingFaceEmbeddings
    from langchain_chroma import Chroma
    from langchain_core.prompts import ChatPromptTemplate
    from langchain.chains.combine_documents import create_stuff_documents_chain
    from langchain.chains.retrieval import create_retrieval_chain
    from langchain_community.chat_models import ChatOpenAI
    RAG_AVAILABLE = True
except Exception as e:
    RAG_AVAILABLE = False
    print(f"⚠️ RAG dependencies not available: {e}")

def _setup_rag():
    if not RAG_AVAILABLE:
        raise RuntimeError('RAG dependencies are not installed. Please install requirements including langchain and chromadb.')
    
    # Check API key
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "":
        raise RuntimeError("⚠️ OPENAI_API_KEY is not configured. Please set it in .env file.")
    
    # Use sentence-transformers model (smaller, faster)
    print("📦 Loading embedding model...")
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"}, 
        encode_kwargs={"normalize_embeddings": True},
    )
    
    persist_dir = settings.RAG_PERSIST_DIR
    if not os.path.exists(persist_dir):
        raise RuntimeError(f"⚠️ Chroma persist directory not found at: {persist_dir}\n"
                          f"Please unzip 'poem_chroma_bge_db.zip' to: {persist_dir}")
    
    print(f"📂 Loading Chroma vectorstore from {persist_dir}...")
    vectorstore = Chroma(
        embedding_function=embeddings,
        collection_name="poem_gen_db",
        persist_directory=persist_dir
    )
    
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
    
    # Use OpenRouter with DeepSeek model (free)
    print("🤖 Initializing LLM...")
    llm = ChatOpenAI(
        model="tngtech/deepseek-r1t2-chimera:free",
        openai_api_base="https://openrouter.ai/api/v1",
        openai_api_key=settings.OPENAI_API_KEY,
        temperature=0.7,
        max_tokens=1024
    )
    
    system_prompt = (
        "You are a creative poetry generator. "
        "You will be given a poem title or theme as input. "
        "Use the following poems as inspiration to craft a new, original poem based on that title or theme. "
        "Maintain poetic tone, vivid imagery, and emotional depth. "
        "Do not copy directly from the context — use it only for inspiration. "
        "Return only the poem as output, without any explanations or meta-commentary.\n\n"
        "{context}"
    )
    
    chat_prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "Write a poem about {input}.")
    ])
    
    poem_gen_chain = create_stuff_documents_chain(llm, chat_prompt)
    rag_poem_chain = create_retrieval_chain(retriever, poem_gen_chain)
    
    print("✅ RAG chain initialized successfully!")
    return rag_poem_chain

# Cache RAG chain in module
_rag_chain = None

def generate_poem(theme: str) -> dict:
    """Generate a poem based on the given theme using RAG.
    
    Returns:
        dict: {
            'title': str,  # Extracted title from the poem
            'content': str  # The poem body without the title
        }
    """
    global _rag_chain
    
    if _rag_chain is None:
        print("🔧 Setting up RAG chain for the first time...")
        _rag_chain = _setup_rag()
    
    print(f"🎨 Generating poem for theme: '{theme}'")
    response = _rag_chain.invoke({"input": theme})
    
    # Extract the poem from response
    raw_poem = response.get("answer") or response.get("output") or str(response)
    
    # Extract title (text between ** markers on first line)
    lines = raw_poem.strip().split('\n')
    title = theme  # Default to theme if no title found
    content = raw_poem
    
    # Check if first line contains **Title**
    if lines and '**' in lines[0]:
        # Extract text between ** markers
        import re
        title_match = re.search(r'\*\*(.+?)\*\*', lines[0])
        if title_match:
            title = title_match.group(1).strip()
            # Remove the title line from content
            content = '\n'.join(lines[1:]).strip()
    
    print(f"✨ Poem generated: '{title}' ({len(content)} characters)")
    return {
        'title': title,
        'content': content
    }
