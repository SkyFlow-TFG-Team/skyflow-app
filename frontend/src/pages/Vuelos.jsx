import { useEffect, useState } from 'react';
import api from '../api/api';
import FormularioVuelo from '../components/FormularioVuelo'; 
import FormularioAerolinea from '../components/FormularioAerolinea';
import { supabase } from "../supabaseClient";

// Histograma de precios con CSS puro
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

  // 📊 ESTADÍSTICAS (Lógica de la Tarea 3 integrada)
  const totalVuelos = vuelos.length;

  const contadorDestinos = vuelos.reduce((acc, v) => {
    acc[v.destino] = (acc[v.destino] || 0) + 1;
    return acc;
  }, {});

  const destinosOrdenados = Object.entries(contadorDestinos).sort((a, b) => b[1] - a[1]);
  const maxCount = destinosOrdenados[0]?.[1] || 1;

  const destinoMasRepetido = vuelos.length > 0 ? destinosOrdenados[0][0] : "-";

  const vueloMasCaro = vuelos.reduce((max, v) => 
    v.precio > (max?.precio || 0) ? v : max, null
  );

  const vueloMasBarato = vuelos.reduce((min, v) => 
    v.precio < (min?.precio || Infinity) ? v : min, null
  );

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

  const eliminarVuelos = async (id) => {
    if (perfil?.rol !== "admin") {
      alert("No tienes permisos");
      return;
    }
    if (window.confirm("¿Seguro que quieres eliminar este vuelo?")) {
      try {
        await api.delete(`/vuelos/${id}`);
        cargarVuelos(); 
      } catch (err) {
        console.error("Error al eliminar vuelo:", err);
        alert("No se pudo eliminar el vuelo");
      }
    }
  };

  const reservarVuelo = async (vueloId) => {
    try {
      const response = await api.post('/reservas/', { vuelo_id: vueloId });
      if (response.data) {
        alert("✈️ ¡Reserva realizada!");
        await cargarVuelos(); 
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Error al reservar";
      alert(`❌ ${msg}`);
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
  }, []);

  if (cargando) {
    return <div className="flex justify-center items-center min-h-screen text-slate-600">🛰️ Sincronizando SkyFlow...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
          Panel de Control <span className="text-blue-600">SkyFlow</span>
        </h1>
        <p className="text-slate-500 mt-2">Gestión y monitorización de flota en tiempo real</p>
      </header>

      {/* 📊 DASHBOARD (Tarea 3 unificada) */}
      {perfil?.rol === "admin" && (
        <div className="mb-10 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-100 p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-xl" />
              <p className="text-xs text-slate-400 mb-1">Total vuelos</p>
              <p className="text-3xl font-semibold text-blue-600">{totalVuelos}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400 rounded-t-xl" />
              <p className="text-xs text-slate-400 mb-1">Destino Top</p>
              <p className="text-xl font-semibold text-slate-800 truncate">{destinoMasRepetido}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-400 rounded-t-xl" />
              <p className="text-xs text-slate-400 mb-1">Más caro</p>
              <p className="text-xl font-semibold text-red-500">{vueloMasCaro ? `${vueloMasCaro.precio}€` : "-"}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-500 rounded-t-xl" />
              <p className="text-xs text-slate-400 mb-1">Más barato</p>
              <p className="text-xl font-semibold text-green-500">{vueloMasBarato ? `${vueloMasBarato.precio}€` : "-"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <p className="text-xs font-medium text-slate-400 mb-4">Top destinos</p>
              <div className="space-y-3">
                {destinosOrdenados.slice(0, 5).map(([dest, cnt]) => (
                  <div key={dest} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-12 truncate">{dest}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${(cnt / maxCount) * 100}%`}} />
                    </div>
                    <span className="text-xs text-slate-400">{cnt}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <p className="text-xs font-medium text-slate-400 mb-2">Distribución de precios</p>
              <PreciosHistograma vuelos={vuelos} />
            </div>
          </div>
        </div>
      )}

      {/* 🔒 SECCIONES DE GESTIÓN ADMIN */}
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

        {/* BUSCADOR */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-500 uppercase">Origen</label>
            <input type="text" value={filtroOrigen} onChange={(e) => setFiltroOrigen(e.target.value)} className="w-full border rounded-md p-2 mt-1" />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-500 uppercase">Destino</label>
            <input type="text" value={filtroDestino} onChange={(e) => setFiltroDestino(e.target.value)} className="w-full border rounded-md p-2 mt-1" />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => cargarVuelos()} className="flex-1 bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700 h-[42px]">🔍 Buscar</button>
            <button onClick={() => { setFiltroOrigen(''); setFiltroDestino(''); cargarVuelos('', ''); }} className="bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-md h-[42px]">Limpiar</button>
          </div>
        </div>
        
        {/* LISTADO DE TARJETAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vuelos.map((vuelo) => (
            <div key={vuelo.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100 hover:shadow-xl transition-all">
              <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
                <span className="font-mono font-bold text-xs uppercase text-slate-400">ID: {vuelo.id.slice(0, 8)}</span>
                {perfil?.rol === "admin" && (
                  <button onClick={() => eliminarVuelos(vuelo.id)} className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/50 px-2 py-1 rounded-full uppercase font-bold">Borrar</button>
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
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
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
      </section>
    </div>
  );
};

export default Vuelos;