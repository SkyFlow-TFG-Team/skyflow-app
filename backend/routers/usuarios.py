from fastapi import APIRouter, Depends, HTTPException, Header
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_KEY")
)

router = APIRouter(prefix="/usuarios", tags=["usuarios"])



def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token requerido")

    token = authorization.replace("Bearer ", "")

    user = supabase.auth.get_user(token)

    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Token inválido")

    return user.user



@router.get("/perfil")
def obtener_perfil(user=Depends(get_current_user)):
    try:
        response = supabase.table("perfiles").select("*").eq("id", user.id).execute()

        if not response.data:
            return {"mensaje": "Perfil no encontrado", "id": user.id}

        return response.data[0] 
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
