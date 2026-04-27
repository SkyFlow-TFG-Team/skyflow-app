import { useEffect, useState } from 'react';
import api from '../api/api';
import FormularioVuelo from '../components/FormularioVuelo';
import FormularioAerolinea from '../components/FormularioAerolinea'; 

const Vuelos = () => {
  const [vuelos, setVuelos] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estados para el buscador
  const [filtroOrigen, setFiltroOrigen] = useState('');
  const [filtroDestino, setFiltroDestino] = useState('');

  // Función principal para cargar y filtrar vuelos
  const cargarVuelos = async (origenOverride, destinoOverride) => {
    try {
      // Usamos el valor pasado por argumento o el del estado del input
      const origenFinal = origenOverride !== undefined ? origenOverride : filtroOrigen;
      const destinoFinal = destinoOverride !== undefined ? destinoOverride : filtroDestino;

      const res = await api.get('/vuelos', {
        params: {
          origen: origenFinal || undefined,
          destino: destinoFinal || undefined
        }
      });
      
      setVuelos(res.data);
      setCargando(false);
    } catch (err) {
      console.error("Error al conectar con la torre de control:", err);
      setCargando(false);
    }
  };

  const eliminarVuelos = async (id) => {
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

  useEffect(() => {
    cargarVuelos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

      {/* SECCIÓN REGISTRAR AEROLÍNEA */}
      <section className="mb-8 border-b-2 border-slate-200 pb-8">
        <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span>🏢</span> Registrar Nueva Aerolínea
        </h2>
        <FormularioAerolinea />
      </section>

      {/* SECCIÓN REGISTRAR VUELO */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span>➕</span> Registrar Nuevo Vuelo
        </h2>
        <FormularioVuelo onVueloCreado={() => cargarVuelos()} />
      </section>

      {/* SECCIÓN LISTA Y BUSCADOR */}
      <section>
        <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
          <span>🛫</span> Vuelos Activos
        </h2>

        {/* BARRA DE BÚSQUEDA */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase">Buscar Origen</label>
            <input 
              type="text" 
              placeholder="Ej. Madrid" 
              value={filtroOrigen}
              onChange={(e) => setFiltroOrigen(e.target.value)}
              className="w-full border rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase">Buscar Destino</label>
            <input 
              type="text" 
              placeholder="Ej. Paris" 
              value={filtroDestino}
              onChange={(e) => setFiltroDestino(e.target.value)}
              className="w-full border rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <button 
            onClick={() => cargarVuelos()}
            className="bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700 transition-all shadow-sm h-[42px]"
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
        
        {vuelos.length === 0 ? (
          <div className="bg-white p-10 rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
            No hay vuelos que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vuelos.map((vuelo) => (
              <div 
                key={vuelo.id} 
                className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
                  <span className="font-mono font-bold">ID: {vuelo.id.slice(0, 8)}</span>
                  <button
                    onClick={() => eliminarVuelos(vuelo.id)}
                    className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 font-bold"
                  >
                    Borrar
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-black text-slate-800">{vuelo.origen}</p>
                      <p className="text-[10px] text-slate-400 uppercase">Origen</p>
                    </div>
                    <span className="text-2xl">✈️</span>
                    <div className="text-center">
                      <p className="text-2xl font-black text-slate-800">{vuelo.destino}</p>
                      <p className="text-[10px] text-slate-400 uppercase">Destino</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Aerolínea</p>
                      <p className="text-slate-700 font-semibold">{vuelo.aerolineas?.nombre || "N/A"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-blue-600">{vuelo.precio}€</p>
                    </div>
                  </div>
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