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
    aerolinea_id: str  
    plazas_totales: int
    plazas_disponibles: int
    fecha_salida: str

@router.get("/")
def obtener_vuelos(origen: str = None, destino: str = None):
    try:
        # Se inica la consulta base con el join a aerolíneas
        query = supabase.table("vuelos").select("*, aerolineas(nombre)")

        # Aplicamos filtros dinámicos si existen 
        # Usamos .ilike para que no importe mayúsculas/minúsculas
        if origen:
            query = query.ilike("origen", f"%{origen}%")
        
        if destino:
            query = query.ilike("destino", f"%{destino}%")

        data = query.order("fecha_salida").execute()
        
        return data.data
    except Exception as e:
        print(f"Error en el buscador: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def crear_vuelo(vuelo: VueloCreate):
    try:
        # Insertamos los datos usando model_dump()
        response = supabase.table("vuelos").insert(vuelo.model_dump()).execute()
        return {"mensaje": "Vuelo creado con éxito", "dato": response.data}
    except Exception as e:
        print(f"Error Supabase: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/{vuelo_id}")
def borrar_vuelo(vuelo_id: str):
    try:
        response = supabase.table("vuelos").delete().eq("id", vuelo_id).execute()
        return {"mensaje": "Vuelo borrado con éxito", "dato": response.data}
    except Exception as e:
        print(f"Error al borrar: {e}")
        raise HTTPException(status_code=500, detail=str(e))