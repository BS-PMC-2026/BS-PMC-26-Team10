from supabase import create_client

SUPABASE_URL = 'https://urfqpdduwmonrhwmidcp.supabase.co'
SUPABASE_KEY = 'sb_secret_6ehkIG3YCq0Ssl3aQGcMaQ_DIAuN-oC'

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_chilleis():
    response = supabase.table("chilli").select("*").execute()
    return response.data