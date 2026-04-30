import { useEffect, useState } from 'react';
import api from '../api/api';
import FormularioVuelo from '../components/vuelos/FormularioVuelo'; 
import FormularioAerolinea from '../components/vuelos/FormularioAerolinea';
import { supabase } from "../supabaseClient";
import toast from 'react-hot-toast';
import VueloCard from '../components/vuelos/VueloCard';

const PreciosHistograma = ({ vuelos }) => {
  const precios = vuelos.map(v => v.precio).sort((a, b) => a - b);
  if (!precios.length) return <p className="text-xs text-slate-300">Sin datos</p>;

  const min = precios[0];
  const max = precios[precios.length - 1];
  const step = Math.ceil((max - min + 1) / 5);
  const bins = Array.from({ length: 5 }, (_, i) => ({
    rango: `${min + i * step}€`,
    vuelos: precios.filter(p => p >= min + i * step && p < min + (i + 1) * step).length,
  }));
  const maxBin = Math.max(...bins.map(b => b.vuelos), 1);

  return (
    <div className="flex items-end gap-2 h-28 w-full pt-2">
      {bins.map((bin, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-1 h-full justify-end">
          <span className="text-xs text-slate-400">{bin.vuelos || ''}</span>
          <div
            className="w-full bg-blue-500 rounded-t-md transition-all duration-700"
            style={{ height: `${(bin.vuelos / maxBin) * 100}%`, minHeight: bin.vuelos ? 4 : 0 }}
          />
          <span className="text-xs text-slate-400 truncate w-full text-center">{bin.rango}</span>
        </div>
      ))}
    </div>
  );
};

const Vuelos = () => {
  const [vuelos, setVuelos] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [filtroOrigen, setFiltroOrigen] = useState('');
  const [filtroDestino, setFiltroDestino] = useState('');

  const totalVuelos = vuelos.length;
  const contadorDestinos = vuelos.reduce((acc, v) => {
    acc[v.destino] = (acc[v.destino] || 0) + 1;
    return acc;
  }, {});

  const destinosOrdenados = Object.entries(contadorDestinos).sort((a, b) => b[1] - a[1]);
  const maxCount = destinosOrdenados[0]?.[1] || 1; // Aquí se define maxCount
  const destinoMasRepetido = vuelos.length > 0 ? destinosOrdenados[0][0] : "-";
  const vueloMasCaro = vuelos.reduce((max, v) => v.precio > (max?.precio || 0) ? v : max, null);
  const vueloMasBarato = vuelos.reduce((min, v) => v.precio < (min?.precio || Infinity) ? v : min, null);

  const cargarVuelos = async (origenOverride, destinoOverride) => {
    const toastId = toast.loading("Sincronizando con el radar de SkyFlow...");
    try {
      const origenFinal = origenOverride !== undefined ? origenOverride : filtroOrigen;
      const destinoFinal = destinoOverride !== undefined ? destinoOverride : filtroDestino;
      const res = await api.get('/vuelos/', {
        params: { origen: origenFinal || undefined, destino: destinoFinal || undefined }
      });
      setVuelos(res.data);
      setCargando(false);
      toast.dismiss(toastId);
    } catch (err) {
      console.error("Error al cargar vuelos:", err);
      setCargando(false);
      toast.dismiss(toastId);
      toast.error("Error al cargar los vuelos.");
    }
  };

  const eliminarVuelos = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este vuelo?")) {
      const promesaEliminar = api.delete(`/vuelos/${id}/`);
      toast.promise(promesaEliminar, {
        loading: 'Eliminando vuelo...',
        success: () => {
          cargarVuelos();
          return 'Vuelo eliminado correctamente';
        },
        error: 'Error al eliminar el vuelo',
      });
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cargando) return <div className="text-center mt-20 text-slate-600">🛰️ Sincronizando SkyFlow...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
          Panel de Control <span className="text-blue-600">SkyFlow</span>
        </h1>
        <p className="text-slate-500 mt-2">Gestión y monitorización de flota en tiempo real</p>
      </header>

      {perfil?.rol === "admin" && (
        <>
          {/* Tarjetas de estadísticas rápidas */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
             <div className="bg-white rounded-xl border p-4 relative overflow-hidden">
               <p className="text-xs text-slate-400 mb-1">Total vuelos</p>
               <p className="text-3xl font-semibold text-blue-600">{totalVuelos}</p>
             </div>
             <div className="bg-white rounded-xl border p-4 relative overflow-hidden">
               <p className="text-xs text-slate-400 mb-1">Destino Top</p>
               <p className="text-xl font-semibold text-slate-800 truncate">{destinoMasRepetido}</p>
             </div>
             <div className="bg-white rounded-xl border p-4 relative overflow-hidden">
               <p className="text-xs text-slate-400 mb-1">Más caro</p>
               <p className="text-xl font-semibold text-red-500">{vueloMasCaro ? `${vueloMasCaro.precio}€` : "-"}</p>
             </div>
             <div className="bg-white rounded-xl border p-4 relative overflow-hidden">
               <p className="text-xs text-slate-400 mb-1">Más barato</p>
               <p className="text-xl font-semibold text-green-500">{vueloMasBarato ? `${vueloMasBarato.precio}€` : "-"}</p>
             </div>
          </div>

          {/* DASHBOARD VISUAL (Aquí es donde usamos maxCount) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <p className="text-xs font-medium text-slate-400 mb-4 uppercase font-bold">Top destinos</p>
              <div className="space-y-3">
                {destinosOrdenados.slice(0, 5).map(([dest, cnt]) => (
                  <div key={dest} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-12 truncate">{dest}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{ width: `${(cnt / maxCount) * 100}%` }} 
                      />
                    </div>
                    <span className="text-xs text-slate-400 font-bold">{cnt}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <p className="text-xs font-medium text-slate-400 mb-2 uppercase font-bold">Distribución de precios</p>
              <PreciosHistograma vuelos={vuelos} />
            </div>
          </div>

          <div className="space-y-12 mb-12 border-t pt-8">
            <section><h2 className="text-xl font-bold mb-4">🏢 Registrar Aerolínea</h2><FormularioAerolinea /></section>
            <section><h2 className="text-xl font-bold mb-4">➕ Registrar Vuelo</h2><FormularioVuelo onVueloCreado={() => cargarVuelos()} /></section>
          </div>
        </>
      )}

      <section>
        <h2 className="text-xl font-bold text-slate-700 mb-6">🛫 Gestión de Flota</h2>
        <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-gray-500 uppercase">Origen</label>
            <input type="text" value={filtroOrigen} onChange={(e) => setFiltroOrigen(e.target.value)} className="w-full border rounded-md p-2" />
          </div>
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-gray-500 uppercase">Destino</label>
            <input type="text" value={filtroDestino} onChange={(e) => setFiltroDestino(e.target.value)} className="w-full border rounded-md p-2" />
          </div>
          <button onClick={() => cargarVuelos()} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700 h-[42px]">🔍 Buscar</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vuelos.map((vuelo) => (
            <VueloCard 
              key={vuelo.id} 
              vuelo={vuelo} 
              perfil={perfil} 
              onEliminar={eliminarVuelos} 
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Vuelos;