import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware # IMPORTANTE
from supabase import create_client, Client
from dotenv import load_dotenv
 
# 1. Cargamos las claves del .env
load_dotenv()
 
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
 
# 2. Conectamos con Supabase
supabase: Client = create_client(url, key)
 
app = FastAPI(title="SkyFlow API")
 
# 3. Configuración de CORS (Permitir que el Frontend hable con el Backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En desarrollo, permite cualquier origen
    allow_credentials=True,
    allow_methods=["*"],  # Permite GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],
)
 
@app.get("/")
def home():
    return {"mensaje": "¡API de SkyFlow conectada y funcionando!"}
 
@app.get("/vuelos")
def obtener_vuelos():
    try:
        data = supabase.table("vuelos").select("*").execute()
        return data.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
