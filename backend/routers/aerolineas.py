from fastapi import APIRouter, HTTPException
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
supabase: Client = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_KEY"))

router = APIRouter(prefix="/aerolineas", tags=["aerolineas"])

@router.get("/")
def obtener_aerolineas():
    try:
        data = supabase.table("aerolineas").select("id, nombre").execute()
        return data.data 
    except Exception as e:
        raise HTTPException (status_code=500, detail=str(e))