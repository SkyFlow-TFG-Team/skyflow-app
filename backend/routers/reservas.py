from fastapi import APIRouter, Depends, HTTPException, Header
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pydantic import BaseModel
from datetime import datetime, timedelta

load_dotenv()

supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_KEY")
)

router = APIRouter(prefix="/reservas", tags=["reservas"])


# -------------------------------
#   AUTENTICACIÓN
# -------------------------------
def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token requerido")

    token = authorization.replace("Bearer ", "")
    user = supabase.auth.get_user(token)

    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Token inválido")

    return user.user


# -------------------------------
#   OBTENER MIS RESERVAS
# -------------------------------
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


# -------------------------------
#   CREAR RESERVA
# -------------------------------
class ReservaCreate(BaseModel):
    vuelo_id: str


@router.post("/")
def crear_reserva(reserva: ReservaCreate, user=Depends(get_current_user)):
    try:
        nueva_reserva = {
            "cliente_id": user.id,
            "vuelo_id": reserva.vuelo_id,
            "fecha_reserva": datetime.utcnow().isoformat(),
            "estado": "confirmada"
        }

        response = supabase.table("reservas").insert(nueva_reserva).execute()

        return {"mensaje": "Reserva creada", "data": response.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------
#   CANCELAR RESERVA
# -------------------------------
@router.delete("/{reserva_id}")
def cancelar_reserva(reserva_id: str, user=Depends(get_current_user)):
    try:
        # 1. Obtener la reserva con su vuelo
        response = supabase.table("reservas") \
            .select("*, vuelos(fecha_salida)") \
            .eq("id", reserva_id) \
            .single() \
            .execute()

        reserva = response.data

        if not reserva:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")

        # 2. Verificar que pertenece al usuario
        if reserva["cliente_id"] != user.id:
            raise HTTPException(status_code=403, detail="No autorizado")

        # 3. Verificar que la reserva tiene vuelo asociado
        if reserva["vuelos"] is None:
            raise HTTPException(
                status_code=400,
                detail="La reserva no tiene un vuelo asociado"
            )

        fecha_str = reserva["vuelos"]["fecha_salida"]

        # 4. Normalizar formato de fecha
        if fecha_str.endswith("Z"):
            fecha_str = fecha_str.replace("Z", "+00:00")

        fecha_vuelo = datetime.fromisoformat(fecha_str)
        ahora = datetime.utcnow()

        # 5. Comprobar si faltan más de 72h
        if fecha_vuelo - ahora < timedelta(hours=72):
            raise HTTPException(
                status_code=400,
                detail="No puedes cancelar con menos de 72 horas"
            )

        # 6. Eliminar reserva
        supabase.table("reservas") \
            .delete() \
            .eq("id", reserva_id) \
            .execute()

        return {"mensaje": "Reserva cancelada"}

    except Exception as e:
        print("ERROR EN CANCELAR RESERVA:", e)
        raise HTTPException(status_code=500, detail=str(e))

