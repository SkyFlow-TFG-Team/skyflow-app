from routers import vuelos
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import aerolineas

app = FastAPI(title="SkyFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Aquí iremos añadiendo más routers según crezcan las funciones
app.include_router(vuelos.router)
app.include_router(aerolineas.router)

@app.get("/")
def root():
    return {"mensaje": "SkyFlow API Modular funcionando"}