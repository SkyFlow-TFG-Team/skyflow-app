from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()
supabase: Client = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_KEY"))

router = APIRouter(prefix="/reservas", tags=["reservas"])

class ReservaSchema(BaseModel):
    vuelo_id: str
    asiento: str

# --- 1. CREAR RESERVA ---
@router.post("/")
async def crear_reserva(reserva: ReservaSchema, request: Request):
    try:
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1]
        user_res = supabase.auth.get_user(token)
        if not user_res.user: raise HTTPException(status_code=401, detail="Sesión no válida")
        
        cliente_id = user_res.user.id

        # Verificar si quedan plazas
        vuelo = supabase.table("vuelos").select("plazas_disponibles").eq("id", reserva.vuelo_id).single().execute()
        if not vuelo.data or vuelo.data["plazas_disponibles"] <= 0:
            raise HTTPException(status_code=400, detail="No quedan plazas disponibles")

        # 🔹 CAMBIO AQUÍ: Incluimos el campo 'asiento' en el diccionario para la DB
        nueva_reserva = {
            "cliente_id": cliente_id, 
            "vuelo_id": reserva.vuelo_id, 
            "asiento": reserva.asiento,  # <--- IMPORTANTE: Guardamos el asiento
            "estado": "confirmada"
        }
        
        res_insert = supabase.table("reservas").insert(nueva_reserva).execute()

        # Actualizar plazas disponibles
        nueva_cantidad = vuelo.data["plazas_disponibles"] - 1
        supabase.table("vuelos").update({"plazas_disponibles": nueva_cantidad}).eq("id", reserva.vuelo_id).execute()

        return {"mensaje": f"Reserva realizada en el asiento {reserva.asiento}", "dato": res_insert.data}
    except Exception as e:
        print(f"Error al crear reserva: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- 2. OBTENER MIS RESERVAS ---
@router.get("/mis-reservas")
async def obtener_mis_reservas(request: Request):
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            raise HTTPException(status_code=401, detail="Falta token de autorización")
            
        token = auth_header.split(" ")[1]
        user_res = supabase.auth.get_user(token)
        
        # 🔹 CORRECCIÓN: Añadimos asteriscos para traer todos los campos del join
        res = supabase.table("reservas")\
            .select("id, estado, cliente_id, vuelo_id, asiento, vuelos(*, aerolineas())")\
            .eq("cliente_id", user_res.user.id)\
            .execute()
        
        return res.data
    except Exception as e:
        print(f"Error en Backend: {e}")
        # Si el error es el token expirado, devolvemos un 401 claro
        if "expired" in str(e):
            raise HTTPException(status_code=401, detail="La sesión ha expirado, por favor vuelve a loguearte")
        raise HTTPException(status_code=500, detail="Error al obtener tus reservas")
    
# --- 3. OBTENER ASIENTOS OCUPADOS DE UN VUELO ---
@router.get("/ocupados/{vuelo_id}")
def obtener_asientos_ocupados(vuelo_id: str):
    try:
        # Consultamos las reservas de ese vuelo y solo traemos la columna 'asiento'
        response = supabase.table("reservas").select("asiento").eq("vuelo_id", vuelo_id).execute()
        
        # Devolvemos una lista simple de strings: ["A1", "B2", ...]
        asientos = [r['asiento'] for r in response.data if r['asiento']]
        return asientos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# --- 4. CANCELAR RESERVA ---
@router.delete("/{reserva_id}")
async def cancelar_reserva(reserva_id: str, request: Request):
    try:
        # 1. Obtener la reserva para saber qué vuelo es y su fecha
        reserva = supabase.table("reservas").select("vuelo_id, vuelos(fecha_salida)").eq("id", reserva_id).single().execute()
        if not reserva.data: 
            raise HTTPException(status_code=404, detail="Reserva no encontrada")

        # 2. Verificar regla de 72h con fechas comparables (ambas con zona horaria UTC)
        fecha_vuelo = datetime.fromisoformat(reserva.data["vuelos"]["fecha_salida"].replace('Z', '+00:00'))
        ahora = datetime.now(timezone.utc)

        diff_segundos = (fecha_vuelo - ahora).total_seconds()
        
        if diff_segundos < 72 * 3600:
            raise HTTPException(status_code=400, detail="No se puede cancelar con menos de 72h de antelación")

        # 3. Proceder al borrado y devolución de plaza
        vuelo_id = reserva.data["vuelo_id"]
        
        # Borrar reserva
        supabase.table("reservas").delete().eq("id", reserva_id).execute()
        
        # Devolver plaza al vuelo
        vuelo_actual = supabase.table("vuelos").select("plazas_disponibles").eq("id", vuelo_id).single().execute()
        nueva_cantidad = vuelo_actual.data["plazas_disponibles"] + 1
        supabase.table("vuelos").update({"plazas_disponibles": nueva_cantidad}).eq("id", vuelo_id).execute()

        return {"mensaje": "Reserva cancelada correctamente y plaza devuelta"}

    except Exception as e:
        print(f"Error al cancelar: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Error interno al procesar la cancelación")