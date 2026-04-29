import { useEffect, useState } from 'react';
import api from '../api/api';
import FormularioVuelo from '../components/FormularioVuelo'; 
import FormularioAerolinea from '../components/FormularioAerolinea';
import { supabase } from "../supabaseClient";
import toast from 'react-hot-toast';

// Histograma de precios con CSS puro (Tarea 3 a salvo)
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
  const maxCount = destinosOrdenados[0]?.[1] || 1;
  const destinoMasRepetido = vuelos.length > 0 ? destinosOrdenados[0][0] : "-";
  const vueloMasCaro = vuelos.reduce((max, v) => v.precio > (max?.precio || 0) ? v : max, null);
  const vueloMasBarato = vuelos.reduce((min, v) => v.precio < (min?.precio || Infinity) ? v : min, null);

  const cargarVuelos = async (origenOverride, destinoOverride) => {
    const toastId = toast.loading("Sincronizando con el radar de SkyFlow...");

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
      toast.dismiss(toastId);
    } catch (err) {
      console.error("Error al cargar vuelos:", err);
      setCargando(false);
      toast.dismiss(toastId);
      toast.error("Error al cargar los vuelos. Intenta recargar la página");
    }
  };

  const eliminarVuelos = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este vuelo?")) {
      const promesaEliminar = api.delete(`/vuelos/${id}/`);

      toast.promise(promesaEliminar, {
        loading: 'Eliminando vuelo del sistema...',
        success: () => {
          cargarVuelos();
          return 'Vuelo eliminado correctamente';
        },
        error: 'Error al intentar eliminar el vuelo',
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

      {/* 📊 DASHBOARD */}
      {perfil?.rol === "admin" && (
        <div className="mb-10 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-100 p-4 relative overflow-hidden text-center md:text-left">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-xl" />
              <p className="text-xs text-slate-400 mb-1">Total vuelos</p>
              <p className="text-3xl font-semibold text-blue-600">{totalVuelos}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4 relative overflow-hidden text-center md:text-left">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400 rounded-t-xl" />
              <p className="text-xs text-slate-400 mb-1">Destino Top</p>
              <p className="text-xl font-semibold text-slate-800 truncate">{destinoMasRepetido}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4 relative overflow-hidden text-center md:text-left">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-400 rounded-t-xl" />
              <p className="text-xs text-slate-400 mb-1">Más caro</p>
              <p className="text-xl font-semibold text-red-500">{vueloMasCaro ? `${vueloMasCaro.precio}€` : "-"}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4 relative overflow-hidden text-center md:text-left">
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
          <span>🛫</span> Gestión de Flota (Solo Admin)
        </h2>

        {/* BUSCADOR ADMIN */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-10 flex flex-col md:flex-row gap-4 items-end">
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
        
        {/* LISTADO DE TARJETAS UNIFICADO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vuelos.map((vuelo) => (
            <div key={vuelo.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden flex flex-col">
              
              {/* CABECERA AZUL CON BOTÓN BORRAR */}
              <div className="bg-blue-600 p-3 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs tracking-widest font-bold">VUELO #{vuelo.id.slice(0, 6)}</span>
                  <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold backdrop-blur-sm bg-white/20}`}>
                    {vuelo.plazas_disponibles > 0 ? 'Disponible' : 'Agotado'}
                  </span>
                </div>
                {perfil?.rol === "admin" && (
                  <button 
                    onClick={() => eliminarVuelos(vuelo.id)} 
                    className="text-[10px] bg-red-500/20 text-red-100 border border-red-500/50 px-3 py-1 rounded-full uppercase font-bold hover:bg-red-500 hover:text-white transition-all"
                  >
                    Borrar
                  </button>
                )}
              </div>
              
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-center mb-6">
                  <div className="text-center">
                    <p className="text-3xl font-black text-slate-800">{vuelo.origen}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold text-center">Origen</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center px-4">
                    <span className="text-slate-400 text-xs mb-1">✈️</span>
                    <div className="w-full border-t-2 border-dashed border-slate-200"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-slate-800">{vuelo.destino}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold text-center">Destino</p>
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

                {/* CONTADOR DE DISPONIBILIDAD IGUAL A HOME */}
                <div className="flex justify-between items-center px-1 mb-2">
                  <p className="text-[11px] text-slate-500 font-bold uppercase">Plazas libres</p>
                  <p className={`text-sm font-mono font-bold ${vuelo.plazas_disponibles > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {vuelo.plazas_disponibles} <span className="text-slate-300 font-normal">/ {vuelo.plazas_totales}</span>
                  </p>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                  <div 
                    className={`h-full transition-all duration-500 ${vuelo.plazas_disponibles > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${(vuelo.plazas_disponibles / vuelo.plazas_totales) * 100}%` }}
                  />
                </div>
              </div>

              {/* SECCIÓN DE PRECIO IGUAL A HOME */}
              <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white">
                <div className="w-full text-center md:text-left">
                  <p className="text-xs text-slate-500">Precio de referencia</p>
                  <p className="text-2xl font-black text-blue-600">{vuelo.precio}€</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Vuelos;