import { useEffect, useState } from 'react';
import api from '../api/api';
import { supabase } from "../supabaseClient";
import toast from 'react-hot-toast';
import VueloCard from '../components/vuelos/VueloCard';
import Buscador from '../components/vuelos/Buscador';
import MapaAsientos from '../components/vuelos/MapaAsientos';
import { X, Plane } from 'lucide-react';

const Home = () => {
  const [vuelos, setVuelos] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  // --- ESTADOS PARA EL MAPA DE ASIENTOS ---
  const [modalAbierto, setModalAbierto] = useState(false);
  const [vueloSeleccionado, setVueloSeleccionado] = useState(null);
  const [asientosOcupados, setAsientosOcupados] = useState([]);
  const [asientoElegido, setAsientoElegido] = useState(null);

  // --- ESTADOS PARA FILTROS ---
  const [filtroOrigen, setFiltroOrigen] = useState('');
  const [filtroDestino, setFiltroDestino] = useState('');
  const [precioMax, setPrecioMax] = useState(2000);
  const [aerolineas, setAerolineas] = useState([]);
  const [aerolineaSeleccionada, setAerolineaSeleccionada] = useState('');

  // 1. Cargar datos iniciales
  const cargarAerolineas = async () => {
    try {
      const res = await api.get('/aerolineas/');
      setAerolineas(res.data);
    } catch (err) {
      console.error("Error cargando aerolíneas:", err);
    }
  };

  const cargarVuelos = async () => {
    try {
      const res = await api.get('/vuelos/', {
        params: {
          origen: filtroOrigen || undefined,
          destino: filtroDestino || undefined
        }
      });

      const resultadosFiltrados = res.data.filter(vuelo => {
        const cumplePrecio = Number(vuelo.precio) <= precioMax;
        const nombreVuelo = vuelo.aerolineas?.nombre || ''; 
        const cumpleAerolinea = aerolineaSeleccionada === '' || nombreVuelo === aerolineaSeleccionada;
        return cumplePrecio && cumpleAerolinea;
      });

      setVuelos(resultadosFiltrados);
    } catch (err) {
      console.error("Error cargando vuelos:", err);
      toast.error("No se pudieron actualizar los vuelos");
    } finally {
      setCargando(false);
    }
  };

  // 2. Lógica del Selector de Asientos
  const abrirSelectorAsientos = async (vuelo) => {
    if (!perfil) {
      toast.error("Debes iniciar sesión para reservar");
      return;
    }
    setVueloSeleccionado(vuelo);
    setAsientoElegido(null); // Limpiar selección previa
    
    try {
      const res = await api.get(`/reservas/ocupados/${vuelo.id}`);
      setAsientosOcupados(res.data);
      setModalAbierto(true);
    } catch {
      toast.error("Error al obtener la disponibilidad de asientos");
    }
  };

  const confirmarReserva = async () => {
    if (!asientoElegido) {
      toast.error("Por favor, selecciona un asiento primero");
      return;
    }

    const promesa = api.post('/reservas/', { 
      vuelo_id: vueloSeleccionado.id,
      asiento: asientoElegido 
    });

    toast.promise(promesa, {
      loading: 'Confirmando tu reserva...',
      success: () => {
        setModalAbierto(false);
        cargarVuelos();
        return `✅ Asiento ${asientoElegido} reservado con éxito`;
      },
      error: (err) => `Error: ${err.response?.data?.detail || "No se pudo realizar la reserva"}`
    });
  };

  useEffect(() => {
    const inicializar = async () => {
      await Promise.all([cargarVuelos(), cargarAerolineas()]);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("perfiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setPerfil(data);
      }
    };
    inicializar();
  }, []);

  if (cargando) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50">
        <div className="animate-bounce text-6xl mb-4">🛫</div>
        <p className="text-slate-500 font-black uppercase tracking-tighter">Preparando motores SkyFlow...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* HEADER */}
      <header className="mb-10 text-center shrink-0">
        <h1 className="text-6xl font-black text-slate-800 tracking-tighter mb-2 italic">
          Sky<span className="text-blue-600">Flow</span>
        </h1>
        <p className="text-slate-500 text-lg font-medium tracking-tight">Vuela más alto, paga menos</p>
      </header>

      {/* BUSCADOR */}
      <Buscador 
        filtroOrigen={filtroOrigen}
        setFiltroOrigen={setFiltroOrigen}
        filtroDestino={filtroDestino}
        setFiltroDestino={setFiltroDestino}
        precioMax={precioMax}
        setPrecioMax={setPrecioMax}
        aerolineas={aerolineas}
        aerolineaSeleccionada={aerolineaSeleccionada}
        setAerolineaSeleccionada={setAerolineaSeleccionada}
        onBuscar={cargarVuelos}
        onLimpiar={() => {
          setFiltroOrigen('');
          setFiltroDestino('');
          setPrecioMax(2000);
          setAerolineaSeleccionada('');
          cargarVuelos();
        }}
      />
      
      {/* GRID DE VUELOS */}
      <section className="max-w-6xl mx-auto mt-12">
        {vuelos.length === 0 ? (
          <div className="text-center p-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold uppercase italic">No se han encontrado vuelos con estos filtros</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vuelos.map((vuelo) => (
              <VueloCard 
                key={vuelo.id} 
                vuelo={vuelo} 
                perfil={perfil} 
                onReservar={() => abrirSelectorAsientos(vuelo)} 
              />
            ))}
          </div>
        )}
      </section>

      {/* MODAL DEL MAPA DE ASIENTOS CON STICKY FOOTER/HEADER */}
      {modalAbierto && vueloSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-[300px] shadow-2xl flex flex-col h-full max-h-[80vh] overflow-hidden animate-in zoom-in duration-200">
            
            {/* Header Fijo */}
            <div className="p-4 border-b flex justify-between items-center bg-white shrink-0">
              <div>
                <h2 className="text-sm font-black text-slate-800">Seleccionar Asiento</h2>
                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">
                  {vueloSeleccionado.origen} — {vueloSeleccionado.destino}
                </p>
              </div>
              <button onClick={() => setModalAbierto(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={18} />
              </button>
            </div>

            {/* CUERPO: Centrado pero con scroll suave si es necesario */}
            <div className="flex-1 overflow-y-auto bg-slate-50 flex justify-center items-start min-h-0 custom-scrollbar">
              <MapaAsientos 
                ocupados={asientosOcupados}
                seleccionado={asientoElegido}
                alSeleccionar={setAsientoElegido}
              />
            </div>

            {/* Footer Fijo */}
            <div className="p-4 bg-white border-t shrink-0">
              <button 
                onClick={confirmarReserva}
                disabled={!asientoElegido}
                className={`w-full py-3 rounded-xl font-black text-[10px] tracking-widest transition-all shadow-lg ${
                  asientoElegido 
                  ? 'bg-blue-600 text-white shadow-blue-100' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {asientoElegido ? `RESERVAR ASIENTO ${asientoElegido}` : 'ELIJA SU ASIENTO'}
              </button>
              <p className="text-center text-[6px] text-slate-400 font-bold uppercase mt-2 tracking-widest">
                Transacción Segura SkyFlow
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;