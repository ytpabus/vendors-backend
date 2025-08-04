from supabase import create_client
import os

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://qwtcqnaqhfsjwdnlqyds.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3dGNxbmFxaGZzandkbmxxeWRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzE5MDM1MiwiZXhwIjoyMDY4NzY2MzUyfQ.KW6YXyjOaz1KuYSfh24kMmbNWQRRi75h_UISbyQYeRQ")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
