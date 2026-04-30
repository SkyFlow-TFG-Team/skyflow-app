import { useEffect, useState } from 'react';
import api from '../api/api';
import { supabase } from "../supabaseClient";
import toast from 'react-hot-toast';
import VueloCard from '../components/vuelos/VueloCard';

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

    const promesaReserva = api.post('/reservas/', { vuelo_id: vueloId });

    toast.promise(promesaReserva, {
      loading: 'Confirmando tu asiento con SkyFlow...',
      success: () => {
        cargarVuelos();
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
      
      <section className="max-w-6xl mx-auto">
        {vuelos.length === 0 ? (
          <div className="bg-white p-10 rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
            No hay vuelos programados para esta ruta actualmente.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vuelos.map((vuelo) => (
              <VueloCard 
                key={vuelo.id} 
                vuelo={vuelo} 
                perfil={perfil} 
                onReservar={reservarVuelo} 
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;