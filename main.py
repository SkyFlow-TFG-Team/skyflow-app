import os
from fastapi import FastAPI, HTTPException
from supabase import create_client, Client
from dotenv import load_dotenv
 
# 1. Cargamos las claves del .env
load_dotenv()
 
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
 
# 2. Conectamos con la base de datos
supabase: Client = create_client(url, key)
 
app = FastAPI(title="SkyFlow API")
 
@app.get("/")
def home():
    return {"mensaje": "¡API de SkyFlow conectada y funcionando!"}
 
@app.get("/vuelos")
def obtener_vuelos():
    # Esta función va a Supabase y pide los datos de la tabla 'vuelos'
    try:
        data = supabase.table("vuelos").select("*").execute()
        return data.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))