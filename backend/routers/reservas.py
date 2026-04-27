from fastapi import APIRouter, Depends, HTTPException, Header
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone # Importamos timezone

load_dotenv()

supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_KEY")
)

router = APIRouter(prefix="/reservas", tags=["reservas"])

# --- AUTENTICACIÓN ---
def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token requerido")
    token = authorization.replace("Bearer ", "")
    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Token inválido")
        return user.user
    except Exception:
        raise HTTPException(status_code=401, detail="Sesión expirada o inválida")

# --- OBTENER MIS RESERVAS ---
@router.get("/mis-reservas")
def obtener_reservas(user=Depends(get_current_user)):
    try:
        response = supabase.table("reservas") \
            .select("*, vuelos(origen, destino, fecha_salida, precio)") \
            .eq("cliente_id", user.id) \
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- CREAR RESERVA (Tu Misión Completa) ---
class ReservaCreate(BaseModel):
    vuelo_id: str

@router.post("/")
def crear_reserva(reserva: ReservaCreate, user=Depends(get_current_user)):
    try:
        # 1. Verificar disponibilidad de plazas
        vuelo_resp = supabase.table("vuelos").select("plazas_disponibles").eq("id", reserva.vuelo_id).single().execute()
        vuelo = vuelo_resp.data
        
        if not vuelo:
            raise HTTPException(status_code=404, detail="Vuelo no encontrado")
        
        if vuelo["plazas_disponibles"] <= 0:
            raise HTTPException(status_code=400, detail="No quedan plazas disponibles en este vuelo")

        # 2. Crear la reserva
        nueva_reserva = {
            "cliente_id": user.id,
            "vuelo_id": reserva.vuelo_id,
            "fecha_reserva": datetime.now(timezone.utc).isoformat(), # Usar timezone-aware
            "estado": "confirmada"
        }
        res_ins = supabase.table("reservas").insert(nueva_reserva).execute()

        # 3. Restar plaza del vuelo
        supabase.table("vuelos").update({
            "plazas_disponibles": vuelo["plazas_disponibles"] - 1
        }).eq("id", reserva.vuelo_id).execute()

        return {"mensaje": "Reserva creada con éxito", "data": res_ins.data}

    except HTTPException as he: raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- CANCELAR RESERVA (Arreglo de Fechas + Devolución de Plaza) ---
@router.delete("/{reserva_id}")
def cancelar_reserva(reserva_id: str, user=Depends(get_current_user)):
    try:
        # 1. Obtener la reserva con sus vuelos usando .single()
        # Nota: Asegúrate de que el select es exactamente así para traer los datos anidados
        query = supabase.table("reservas").select("*, vuelos(*)").eq("id", reserva_id).single().execute();
        reserva = query.data

        if not reserva:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")

        if reserva.get("cliente_id") != user.id:
            raise HTTPException(status_code=403, detail="No tienes permiso para cancelar esta reserva")

        vuelo_data = reserva.get("vuelos")
        if not vuelo_data:
            raise HTTPException(status_code=404, detail="Datos del vuelo no encontrados")

        # 2. Control de Fechas (UTC)
        fecha_str = vuelo_data.get("fecha_salida")
        if fecha_str.endswith("Z"):
            fecha_str = fecha_str.replace("Z", "+00:00")
        
        fecha_vuelo = datetime.fromisoformat(fecha_str)
        ahora = datetime.now(timezone.utc)

        if (fecha_vuelo - ahora) < timedelta(hours=72):
            raise HTTPException(status_code=400, detail="Faltan menos de 72h. No se puede cancelar.")

        # 3. Devolver plaza y eliminar (Orden seguro)
        plazas_actuales = vuelo_data.get("plazas_disponibles", 0)
        
        # Primero sumamos la plaza
        supabase.table("vuelos").update({
            "plazas_disponibles": plazas_actuales + 1
        }).eq("id", reserva.get("vuelo_id")).execute()

        # Luego borramos la reserva
        supabase.table("reservas").delete().eq("id", reserva_id).execute()

        return {"mensaje": "Reserva cancelada correctamente"}

    except HTTPException as he:
        # Re-lanzamos las excepciones controladas para que lleguen al front
        raise he
    except Exception as e:
        print(f"Error crítico: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor al procesar la cancelación")