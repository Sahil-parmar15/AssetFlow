from supabase import create_client, Client
from app.config import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)


def get_db() -> Client:
    """FastAPI dependency that yields the Supabase client."""
    yield supabase
