import { useEffect, useState } from 'react';
import api from '../api/api';
import { supabase } from "../supabaseClient";
import toast from 'react-hot-toast';
import VueloCard from '../components/vuelos/VueloCard';
import Buscador from '../components/vuelos/Buscador';

const Home = () => {
  const [vuelos, setVuelos] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  // Estados para los filtros
  const [filtroOrigen, setFiltroOrigen] = useState('');
  const [filtroDestino, setFiltroDestino] = useState('');
  const [precioMax, setPrecioMax] = useState(2000);
  const [aerolineas, setAerolineas] = useState([]);
  const [aerolineaSeleccionada, setAerolineaSeleccionada] = useState('');

  // 1. Cargar las aerolíneas para el buscador (Dropdown)
  const cargarAerolineas = async () => {
    try {
      const res = await api.get('/aerolineas/');
      setAerolineas(res.data);
    } catch (err) {
      console.error("Error al cargar aerolíneas:", err);
    }
  };

  // 2. Cargar vuelos con filtros combinados (API + Frontend)
  const cargarVuelos = async () => {
    // Solo mostramos el loading de toast si ya no es la carga inicial
    const toastId = !cargando ? toast.loading("Actualizando vuelos...") : null;

    try {
      // Petición al Backend con filtros básicos (Origen/Destino)
      const res = await api.get('/vuelos/', {
        params: {
          origen: filtroOrigen || undefined,
          destino: filtroDestino || undefined
        }
      });

      // FILTRADO EN FRONTEND: Precio y nombre de Aerolínea
      const resultadosFiltrados = res.data.filter(vuelo => {
        // Filtro de precio
        const cumplePrecio = Number(vuelo.precio) <= precioMax;
        
        // CORRECCIÓN CLAVE: Acceso a la relación de Supabase 'aerolineas' -> 'nombre'
        const nombreVuelo = vuelo.aerolineas?.nombre || ''; 
        const cumpleAerolinea = aerolineaSeleccionada === '' || nombreVuelo === aerolineaSeleccionada;
        
        return cumplePrecio && cumpleAerolinea;
      });

      setVuelos(resultadosFiltrados);
      
      if (toastId) toast.success("Vuelos actualizados", { id: toastId });
    } catch (err) {
      console.error("Error al cargar los vuelos:", err);
      if (toastId) toast.error("Error en la búsqueda", { id: toastId });
    } finally {
      setCargando(false);
    }
  };

  // 3. Limpiar todos los filtros y recargar
  const limpiarFiltros = () => {
    setFiltroOrigen('');
    setFiltroDestino('');
    setPrecioMax(2000);
    setAerolineaSeleccionada('');
    
    // Recarga inmediata sin filtros
    api.get('/vuelos/').then(res => setVuelos(res.data));
    toast.success("Filtros reseteados");
  };

  const reservarVuelo = async (vueloId) => {
    if (!perfil) {
      toast.error("Debes iniciar sesión para reservar");
      return;
    }

    const promesaReserva = api.post('/reservas/', { vuelo_id: vueloId });

    toast.promise(promesaReserva, {
      loading: 'Confirmando tu asiento...',
      success: () => {
        cargarVuelos(); // Recargamos para actualizar las plazas disponibles
        return '✈️ ¡Vuelo reservado con éxito!';
      },
      error: (err) => `❌ ${err.response?.data?.detail || "No se pudo reservar"}`
    });
  };

  useEffect(() => {
    let montado = true;
    
    const inicializar = async () => {
      // Cargamos aerolíneas y vuelos iniciales
      await Promise.all([cargarVuelos(), cargarAerolineas()]);
      
      // Verificamos sesión de usuario
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
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50">
        <div className="animate-bounce text-4xl mb-4">🛫</div>
        <p className="text-slate-500 font-medium">SkyFlow está preparando los motores...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="mb-10 text-center">
        <h1 className="text-6xl font-black text-slate-800 tracking-tighter mb-2 italic">
          Sky<span className="text-blue-600">Flow</span>
        </h1>
        <p className="text-slate-500 text-lg font-medium">Busca, compara y vuela al mejor precio</p>
      </header>

      {/* COMPONENTE BUSCADOR */}
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
        onLimpiar={limpiarFiltros}
      />
      
      <section className="max-w-6xl mx-auto mt-12">
        {vuelos.length === 0 ? (
          <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-slate-200 text-center shadow-sm">
            <div className="text-6xl mb-6">🏜️</div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No hay vuelos disponibles</h3>
            <p className="text-slate-400 mb-6">Prueba a ajustar los filtros o el rango de precio.</p>
            <button 
              onClick={limpiarFiltros} 
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              Mostrar todos los vuelos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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