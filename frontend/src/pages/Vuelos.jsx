import { useEffect, useState } from 'react';
import api from '../api/api';
import FormularioVuelo from '../components/FormularioVuelo'; 
import FormularioAerolinea from '../components/FormularioAerolinea';
import { supabase } from "../supabaseClient";

const Vuelos = () => {
  const [vuelos, setVuelos] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  // Estados para el buscador
  const [filtroOrigen, setFiltroOrigen] = useState('');
  const [filtroDestino, setFiltroDestino] = useState('');

  // 1. Función para cargar vuelos (con filtros)
  const cargarVuelos = async (origenOverride, destinoOverride) => {
    try {
      const origenFinal = origenOverride !== undefined ? origenOverride : filtroOrigen;
      const destinoFinal = destinoOverride !== undefined ? destinoOverride : filtroDestino;

      const res = await api.get('/vuelos/', {
        params: {
          origen: origenFinal || undefined,
          destino: destinoFinal || undefined
        }
      });
      
      setVuelos(res.data);
      setCargando(false);
    } catch (err) {
      console.error("Error al cargar vuelos:", err);
      setCargando(false);
    }
  };

  // 2. Función para eliminar (Solo Admin)
  const eliminarVuelos = async (id) => {
    if (perfil?.rol !== "admin") {
      alert("No tienes permisos para realizar esta acción");
      return;
    }

    if (window.confirm("¿Seguro que quieres eliminar este vuelo?")) {
      try {
        await api.delete(`/vuelos/${id}`);
        cargarVuelos(); 
      } catch (err) {
        console.error("Error al borrar:", err);
        alert("No se pudo eliminar el vuelo");
      }
    }
  };

  // 3. Función para reservar (Misión "Reserva de Vuelos")
  const reservarVuelo = async (vueloId) => {
    try {
      const response = await api.post('/reservas/', { 
        vuelo_id: vueloId 
      });
      
      if (response.data) {
        alert("✈️ ¡Reserva realizada! El sistema ha actualizado las plazas.");
        await cargarVuelos(); 
      }
    } catch (err) {
      console.error("Error en la reserva:", err);
      const msg = err.response?.data?.detail || "Error al conectar con el servidor de reservas";
      alert(`❌${msg}`);
    }
  };

  // 4. Inicialización de datos y perfil
  useEffect(() => {
    let montado = true;

    const inicializar = async () => {
      await cargarVuelos();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user && montado) {
        const { data } = await supabase
          .from("perfiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setPerfil(data);
      }
    };

    inicializar();
    return () => { montado = false; };
  }, []);

  if (cargando) {
    return (
      <div className="flex justify-center items-center min-h-screen text-xl font-semibold text-slate-600">
        🛰️ Sincronizando con el radar de SkyFlow...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
          Panel de Control <span className="text-blue-600">SkyFlow</span>
        </h1>
        <p className="text-slate-500 mt-2">Gestión y monitorización de flota en tiempo real</p>
      </header>

      {perfil?.rol === "admin" && (
        <div className="space-y-12 mb-12">
          <section className="border-b-2 border-slate-200 pb-8">
            <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
              <span>🏢</span> Registrar Nueva Aerolínea
            </h2>
            <FormularioAerolinea />
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
              <span>➕</span> Registrar Nuevo Vuelo
            </h2>
            <FormularioVuelo onVueloCreado={() => cargarVuelos()} />
          </section>
        </div>
      )}

      <section>
        <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
          <span>🛫</span> Vuelos Activos
        </h2>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-500 uppercase">Origen</label>
            <input 
              type="text" 
              placeholder="Ej. Madrid" 
              value={filtroOrigen}
              onChange={(e) => setFiltroOrigen(e.target.value)}
              className="w-full border rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-500 uppercase">Destino</label>
            <input 
              type="text" 
              placeholder="Ej. Paris" 
              value={filtroDestino}
              onChange={(e) => setFiltroDestino(e.target.value)}
              className="w-full border rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => cargarVuelos()}
              className="flex-1 bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700 transition-all h-[42px]"
            >
              🔍 Buscar
            </button>
            <button 
              onClick={() => {
                setFiltroOrigen('');
                setFiltroDestino('');
                cargarVuelos('', ''); 
              }}
              className="bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-md hover:bg-slate-300 transition-all h-[42px]"
            >
              Limpiar
            </button>
          </div>
        </div>
        
        {vuelos.length === 0 ? (
          <div className="bg-white p-10 rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
            No hay vuelos que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vuelos.map((vuelo) => (
              <div key={vuelo.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100 hover:shadow-xl transition-all">
                <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
                  <span className="font-mono font-bold text-xs uppercase text-slate-400">ID: {vuelo.id.slice(0, 8)}</span>
                  {perfil?.rol === "admin" && (
                    <button
                      onClick={() => eliminarVuelos(vuelo.id)}
                      className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/50 px-2 py-1 rounded-full hover:bg-red-500 hover:text-white transition-colors font-bold uppercase"
                    >
                      Borrar
                    </button>
                  )}
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-black text-slate-800">{vuelo.origen}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Origen</p>
                    </div>
                    <span className="text-2xl">✈️</span>
                    <div className="text-center">
                      <p className="text-2xl font-black text-slate-800">{vuelo.destino}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Destino</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 space-y-3">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Aerolínea</p>
                        <p className="text-slate-700 font-semibold italic">{vuelo.aerolineas?.nombre || "Desconocida"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-blue-600">{vuelo.precio}€</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Disponibilidad</p>
                      <p className={`font-mono font-bold ${vuelo.plazas_disponibles > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {vuelo.plazas_disponibles} de {vuelo.plazas_totales}
                      </p>
                    </div>
                  </div>

                  {perfil?.rol === "cliente" && (
                    <button
                      onClick={() => reservarVuelo(vuelo.id)}
                      disabled={vuelo.plazas_disponibles <= 0}
                      className={`mt-4 w-full py-3 rounded-xl font-bold transition-all duration-300 shadow-sm ${
                        vuelo.plazas_disponibles > 0 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {vuelo.plazas_disponibles > 0 ? 'Reservar vuelo' : 'Vuelo Completo'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Vuelos;