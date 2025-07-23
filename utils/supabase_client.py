from supabase import create_client
import os

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://qwtcqnaqhfsjwdnlqyds.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3dGNxbmFxaGZzandkbmxxeWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxOTAzNTIsImV4cCI6MjA2ODc2NjM1Mn0.yXF1vpaZmUcZWToOw-GccrNYCWuHh2Wa-zieeuk6kUY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
