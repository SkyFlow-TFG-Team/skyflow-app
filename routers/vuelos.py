from fastapi import APIRouter, HTTPException
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
supabase: Client = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_KEY"))

router = APIRouter(prefix="/vuelos", tags=["vuelos"])

@router.get("/")
def obtener_vuelos():
    try:
        data = supabase.table("vuelos").select("*").execute()
        return data.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))