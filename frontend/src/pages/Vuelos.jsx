import { useEffect, useState } from 'react';
import api from '../api/api';
import FormularioVuelo from '../components/FormularioVuelo';
import FormularioAerolinea from '../components/FormularioAerolinea'; // IMPORTAMOS TU PIEZA

const Vuelos = () => {
  const [vuelos, setVuelos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Definimos la función de carga fuera del useEffect para poder reutilizarla
  const cargarVuelos = async () => {
    try {
      const res = await api.get('/vuelos');
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
      cargarVuelos(); // Recargamos la lista tras borrar
    } catch (err) {
      console.error("Error al borrar:", err);
      alert("No se pudo eliminar el vuelo");
    }
  }
};

const reservarVuelo = async (vueloId) => {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Debes iniciar sesión para reservar");
    return;
  }

  try {
    await api.post("/reservas", 
      { vuelo_id: vueloId },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    alert("✈️ Reserva realizada con éxito");

  } catch (err) {
    console.error(err);
    alert("Error al reservar");
  }
};

  // Se ejecuta solo una vez al montar el componente
  useEffect(() => {
    let montado = true; // Controlamos si el componente sigue en pantalla

    const inicializarDatos = async () => {
        if (montado) {
            await cargarVuelos();
        }
    };
    inicializarDatos();
    
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

      {/* SECCIÓN DEL NUEVO FORMULARIO DE AEROLÍNEAS */}
      <section className="mb-8 border-b-2 border-slate-200 pb-8">
        <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span>🏢</span> Registrar Nueva Aerolínea
        </h2>
        <FormularioAerolinea />
      </section>

      {/* SECCIÓN DEL FORMULARIO DE VUELOS: Le pasamos la función cargarVuelos como "prop" */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span>➕</span> Registrar Nuevo Vuelo
        </h2>
        <FormularioVuelo onVueloCreado={cargarVuelos} />
      </section>

      {/* SECCIÓN DE LA LISTA */}
      <section>
        <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
          <span>🛫</span> Vuelos Activos
        </h2>
        
        {vuelos.length === 0 ? (
          <div className="bg-white p-10 rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
            No hay vuelos registrados en el sistema.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vuelos.map((vuelo) => (
              <div 
                key={vuelo.id} 
                className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
                  <span className="font-mono font-bold tracking-widest">ID: {vuelo.id.slice(0, 8)}</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-2 py-1 rounded-full uppercase font-bold">
                    Confirmado
                  </span>
                  <button
                  onClick={() => eliminarVuelos(vuelo.id)}
                  className="text-xs bg-red-500/20 text-red-400 border border-red-500/50 px-2 py-1 rounded-full hover:bg-red-500 hover:text-white transition-colors uppercase font-bold"
                  >
                    Borrar
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-black text-slate-800">{vuelo.origen}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Origen</p>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center px-4">
                      <span className="text-slate-300 text-xs mb-1">Directo</span>
                      <div className="w-full border-t-2 border-dashed border-slate-200 relative">
                        <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-2 text-lg">
                          ✈️
                        </span>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-black text-slate-800">{vuelo.destino}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Destino</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Aerolínea</p>
                      <p className="text-slate-700 font-semibold italic">ID: {vuelo.aerolineas?.nombre || "Compañia desconocida"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Tarifa</p>
                      <p className="text-2xl font-black text-blue-600">{vuelo.precio}€</p>
                    </div>
                  </div>
                  <button
                    onClick={() => reservarVuelo(vuelo.id)}
                    className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                  >
                    Reservar vuelo
                  </button>
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