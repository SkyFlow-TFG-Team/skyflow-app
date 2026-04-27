import { useEffect, useState } from 'react';
import api from '../api/api';
import FormularioVuelo from '../components/FormularioVuelo'; 
import FormularioAerolinea from '../components/FormularioAerolinea';
import { supabase } from "../supabaseClient";

// Histograma de precios con CSS puro (sin dependencias extra)
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
  
  // Estados para el buscador
  const [filtroOrigen, setFiltroOrigen] = useState('');
  const [filtroDestino, setFiltroDestino] = useState('');

  // 📊 ESTADÍSTICAS
  const totalVuelos = vuelos.length;

  const contadorDestinos = vuelos.reduce((acc, v) => {
    acc[v.destino] = (acc[v.destino] || 0) + 1;
    return acc;
  }, {});

  const destinosOrdenados = Object.entries(contadorDestinos).sort((a, b) => b[1] - a[1]);
  const maxCount = destinosOrdenados[0]?.[1] || 1;

  const destinoMasRepetido = (() => {
    if (vuelos.length === 0) return "-";

    const contador = {};
    vuelos.forEach(v => {
      contador[v.destino] = (contador[v.destino] || 0) + 1;
    });

    return Object.entries(contador).sort((a, b) => b[1] - a[1])[0][0];
  })();

  const vueloMasCaro = vuelos.reduce((max, v) => 
    v.precio > (max?.precio || 0) ? v : max, null
  );

  const vueloMasBarato = vuelos.reduce((min, v) => 
    v.precio < (min?.precio || Infinity) ? v : min, null
  );


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

  // 3. Función para reservar (Solo Cliente)
  const reservarVuelo = async (vueloId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes iniciar sesión para reservar");
      return;
    }

    try {
      await api.post("/reservas", 
        { vuelo_id: vueloId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✈️ Reserva realizada con éxito");
    } catch (err) {
      console.error(err);
      alert("Error al reservar");
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

      {/* 📊 DASHBOARD SOLO ADMIN */}
      {perfil?.rol === "admin" && (
        <div className="mb-10 space-y-4">

          {/* Tarjetas de métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            <div className="bg-white rounded-xl border border-slate-100 p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-xl" />
              <p className="text-xs text-slate-400 mb-1">Total vuelos</p>
              <p className="text-3xl font-semibold text-blue-600">{totalVuelos}</p>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                en tiempo real
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400 rounded-t-xl" />
              <p className="text-xs text-slate-400 mb-1">Destino más repetido</p>
              <p className="text-2xl font-semibold text-slate-800">{destinoMasRepetido}</p>
              <p className="text-xs text-slate-300 mt-1">{contadorDestinos[destinoMasRepetido] ?? 0} vuelos</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-400 rounded-t-xl" />
              <p className="text-xs text-slate-400 mb-1">Más caro</p>
              <p className="text-2xl font-semibold text-red-500">
                {vueloMasCaro ? `${vueloMasCaro.precio}€` : "-"}
              </p>
              <p className="text-xs text-slate-300 mt-1">
                {vueloMasCaro ? `${vueloMasCaro.origen} → ${vueloMasCaro.destino}` : ""}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-500 rounded-t-xl" />
              <p className="text-xs text-slate-400 mb-1">Más barato</p>
              <p className="text-2xl font-semibold text-green-500">
                {vueloMasBarato ? `${vueloMasBarato.precio}€` : "-"}
              </p>
              <p className="text-xs text-slate-300 mt-1">
                {vueloMasBarato ? `${vueloMasBarato.origen} → ${vueloMasBarato.destino}` : ""}
              </p>
            </div>
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {/* Top destinos (barras horizontales) */}
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <p className="text-xs font-medium text-slate-400 mb-4">Top destinos</p>
              <div className="space-y-3">
                {destinosOrdenados.slice(0, 5).map(([dest, cnt], i) => {
                  const colors = ['bg-blue-500', 'bg-amber-400', 'bg-green-500', 'bg-red-400', 'bg-purple-400'];
                  return (
                    <div key={dest} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-12 truncate font-medium">{dest}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-700`}
                          style={{ width: `${(cnt / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-4 text-right">{cnt}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Histograma de precios */}
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <p className="text-xs font-medium text-slate-400 mb-2">Distribución de precios</p>
              <PreciosHistograma vuelos={vuelos} />
            </div>
          </div>
        </div>
      )}

      {/* 🔒 SECCIONES SOLO PARA ADMIN */}
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

      {/* SECCIÓN LISTA Y BUSCADOR (Visible para todos) */}
      <section>
        <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
          <span>🛫</span> Vuelos Activos
        </h2>

        {/* BARRA DE BÚSQUEDA */}
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
                  
                  {/* 🔒 BOTÓN BORRAR SOLO ADMIN */}
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

                  <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Aerolínea</p>
                      <p className="text-slate-700 font-semibold italic">{vuelo.aerolineas?.nombre || "Desconocida"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-blue-600">{vuelo.precio}€</p>
                    </div>
                  </div>

                  {/* 🔒 BOTÓN RESERVAR SOLO CLIENTE */}
                  {perfil?.rol === "cliente" && (
                    <button
                      onClick={() => reservarVuelo(vuelo.id)}
                      className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                    >
                      Reservar vuelo
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