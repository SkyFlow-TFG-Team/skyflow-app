import { useEffect, useState } from 'react';
import api from '../api/api';
import { supabase } from "../supabaseClient";
import toast from 'react-hot-toast';

const Home = () => {
  const [vuelos, setVuelos] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  const [filtroOrigen, setFiltroOrigen] = useState('');
  const [filtroDestino, setFiltroDestino] = useState('');

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
      console.error("Error al cargar los vuelos:", err);
      setCargando(false);
    }
  };

  const reservarVuelo = async (vueloId) => {
    if (!perfil) {
      toast.error("Debes iniciar sesión para reservar");
    return;
  }

  // Creamos la promesa de la reserva
  const promesaReserva = api.post('/reservas/', { vuelo_id: vueloId });

  // Mostramos el toast que reacciona a la promesa
  toast.promise(promesaReserva, {
    loading: 'Confirmando tu asiento con SkyFlow...',
    success: () => {
      cargarVuelos(); // Actualizamos las plazas en la UI
      return '✈️ ¡Billete reservado con éxito!';
    },
    error: (err) => {
      const msg = err.response?.data?.detail || "No se pudo realizar la reserva";
      return `❌ ${msg}`;
    }
  });
};

  useEffect(() => {
    let montado = true;
    const inicializar = async () => {
      await cargarVuelos();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && montado) {
        const { data } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
        setPerfil(data);
      }
    };
    inicializar();
    return () => { montado = false; };
  }, []);

  if (cargando) {
    return (
      <div className="flex justify-center items-center min-h-screen text-xl font-semibold text-slate-600">
        🛫 Buscando los mejores destinos en SkyFlow...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold text-slate-800 tracking-tight mb-4">
          Encuentra tu próximo destino con <span className="text-blue-600">SkyFlow</span>
        </h1>
        <p className="text-slate-500 text-lg">Reserva vuelos directos al mejor precio del mercado</p>
      </header>

      {/* BARRA DE BÚSQUEDA PÚBLICA */}
      <div className="max-w-4xl mx-auto bg-white p-4 rounded-xl shadow-md border border-slate-200 mb-10 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-gray-500 uppercase">Origen</label>
          <input type="text" placeholder="¿Desde dónde viajas?" value={filtroOrigen} onChange={(e) => setFiltroOrigen(e.target.value)} className="w-full border rounded-md p-3 mt-1 bg-slate-50 focus:bg-white transition-colors" />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-gray-500 uppercase">Destino</label>
          <input type="text" placeholder="¿A dónde quieres ir?" value={filtroDestino} onChange={(e) => setFiltroDestino(e.target.value)} className="w-full border rounded-md p-3 mt-1 bg-slate-50 focus:bg-white transition-colors" />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => cargarVuelos()} className="flex-1 bg-blue-600 text-white font-bold py-3 px-8 rounded-md hover:bg-blue-700 shadow-md">🔍 Buscar</button>
          <button onClick={() => { setFiltroOrigen(''); setFiltroDestino(''); cargarVuelos('', ''); }} className="bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-md hover:bg-slate-300">Limpiar</button>
        </div>
      </div>
      
      {/* RESULTADOS Y RESERVAS */}
      <section className="max-w-6xl mx-auto">
        {vuelos.length === 0 ? (
          <div className="bg-white p-10 rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
            No hay vuelos programados para esta ruta actualmente.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vuelos.map((vuelo) => (
              <div key={vuelo.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden flex flex-col">
                <div className="bg-blue-600 p-3 text-white flex justify-between items-center">
                  <span className="font-mono text-xs tracking-widest font-bold">VUELO #{vuelo.id.slice(0, 6)}</span>
                  <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full uppercase font-bold backdrop-blur-sm">
                    {vuelo.plazas_disponibles > 0 ? 'Disponible' : 'Agotado'}
                  </span>
                </div>
                
                <div className="p-6 flex-grow">
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-center">
                      <p className="text-3xl font-black text-slate-800">{vuelo.origen}</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center px-4">
                      <span className="text-slate-400 text-xs mb-1">✈️</span>
                      <div className="w-full border-t-2 border-dashed border-slate-200"></div>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-black text-slate-800">{vuelo.destino}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center mb-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Fecha de salida</p>
                      <p className="text-sm text-slate-700 font-semibold">{new Date(vuelo.fecha_salida).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Aerolínea</p>
                      <p className="text-sm text-slate-700 font-semibold">{vuelo.aerolineas?.nombre || "N/A"}</p>
                    </div>
                  </div>

                  {/* 📊 CONTADOR DE DISPONIBILIDAD PARA EL CLIENTE */}
                  <div className="flex justify-between items-center px-1 mb-2">
                    <p className="text-[11px] text-slate-500 font-bold uppercase">Plazas libres</p>
                    <p className={`text-sm font-mono font-bold ${vuelo.plazas_disponibles > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {vuelo.plazas_disponibles} <span className="text-slate-300 font-normal">/ {vuelo.plazas_totales}</span>
                    </p>
                  </div>
                  {/* Barra visual de progreso (Opcional, mejora mucho la UI) */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div 
                      className={`h-full transition-all duration-500 ${vuelo.plazas_disponibles > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${(vuelo.plazas_disponibles / vuelo.plazas_totales) * 100}%` }}
                    />
                  </div>
                </div>

                {/* SECCIÓN DE PRECIO Y BOTÓN */}
                <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white flex-col gap-3 sm:flex-row sm:gap-0">
                  <div className="w-full sm:w-auto text-center sm:text-left">
                    <p className="text-xs text-slate-500">Precio por pasajero</p>
                    <p className="text-2xl font-black text-blue-600">{vuelo.precio}€</p>
                  </div>
                  
                  {(!perfil || perfil.rol === "cliente") && (
                    <button 
                      onClick={() => reservarVuelo(vuelo.id)}
                      disabled={vuelo.plazas_disponibles <= 0}
                      className={`w-full sm:w-auto font-bold py-2 px-6 rounded-md shadow-sm transition-all ${
                        vuelo.plazas_disponibles > 0 
                        ? 'bg-slate-800 text-white hover:bg-slate-900' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {vuelo.plazas_disponibles > 0 ? 'Reservar Vuelo' : 'Completo'}
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

export default Home;