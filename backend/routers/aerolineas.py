from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
supabase: Client = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_KEY"))

router = APIRouter(prefix="/aerolineas", tags=["aerolineas"])

class AerolineaNueva(BaseModel):
    nombre: str
    codigo_iata: str
    pais: str

@router.get("/")
def obtener_aerolineas():
    try:
        data = supabase.table("aerolineas").select("id, nombre").execute()
        return data.data 
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def registrar_aerolinea(aerolinea: AerolineaNueva):
    try:
        nueva_aerolinea = {
            "nombre": aerolinea.nombre,
            "codigo_iata": aerolinea.codigo_iata,
            "pais": aerolinea.pais
        }
        respuesta = supabase.table("aerolineas").insert(nueva_aerolinea).execute()
        return {"mensaje": "Aerolínea registrada con éxito", "datos": respuesta.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))