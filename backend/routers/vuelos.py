from fastapi import APIRouter, HTTPException
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()
supabase: Client = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_KEY"))

router = APIRouter(prefix="/vuelos", tags=["vuelos"])

class VueloCreate(BaseModel):
    origen: str
    destino: str
    precio: float
    aerolinea_id: str  # Es un UUID en tu esquema
    plazas_totales: int
    plazas_disponibles: int
    fecha_salida: str

@router.get("/")
def obtener_vuelos():
    try:
        data = supabase.table("vuelos").select("*, aerolineas(nombre)").execute()
        return data.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def crear_vuelo(vuelo: VueloCreate):
    try:
        # Insertamos los datos tal cual vienen en tu tabla de la imagen
        response = supabase.table("vuelos").insert(vuelo.model_dump()).execute()
        return {"mensaje": "Vuelo creado con éxito", "dato": response.data}
    except Exception as e:
        # Esto nos ayudará a ver el error real si Supabase rechaza algo
        print(f"Error Supabase: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/{vuelo_id}")
def borrar_vuelo(vuelo_id: str):
    try:
        response = supabase.table("vuelos").delete().eq("id", vuelo_id).execute()
        return {"mensaje": "Vuelo borrado con éxito", "dato": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))