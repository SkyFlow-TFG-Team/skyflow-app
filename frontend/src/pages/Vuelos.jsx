import { useEffect, useState, useCallback } from 'react';
import api from '../api/api';
import FormularioVuelo from '../components/vuelos/FormularioVuelo'; 
import FormularioAerolinea from '../components/vuelos/FormularioAerolinea';
import { supabase } from "../supabaseClient";
import toast from 'react-hot-toast';
import VueloCard from '../components/vuelos/VueloCard';
import { X } from 'lucide-react';

const PreciosHistograma = ({ vuelos }) => {
  const precios = vuelos.map(v => v.precio).sort((a, b) => a - b);
  if (!precios.length) return <p className="text-xs text-slate-500">Sin datos</p>;

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
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{bin.vuelos || ''}</span>
          <div
            className="w-full bg-blue-500 dark:bg-blue-600 rounded-t-md transition-all duration-700 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
            style={{ height: `${(bin.vuelos / maxBin) * 100}%`, minHeight: bin.vuelos ? 4 : 0 }}
          />
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 truncate w-full text-center uppercase tracking-tighter">{bin.rango}</span>
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
  
  // ESTADOS ASIGNACIÓN TRIPULACIÓN
  const [showModalAsignar, setShowModalAsignar] = useState(false);
  const [vueloParaAsignar, setVueloParaAsignar] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState("");
  const [rolTripulante, setRolTripulante] = useState("Piloto");

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

  const cargarVuelos = useCallback(async (origenOverride, destinoOverride) => {
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
  }, [filtroOrigen, filtroDestino]);

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

  const cargarEmpleados = async () => {
    const { data, error } = await supabase
      .from("perfiles")
      .select("id, nombre, apellidos")
      .eq("rol", "empleado");
    if (!error) setEmpleados(data);
  };

  const manejarAsignacion = async () => {
    if (!empleadoSeleccionado) return toast.error("Selecciona un empleado");
    const { error } = await supabase
      .from("asignaciones_empleados")
      .insert([{ 
        vuelo_id: vueloParaAsignar.id, 
        empleado_id: empleadoSeleccionado,
        rol_en_vuelo: rolTripulante 
      }]);

    if (error) {
      toast.error("Error o empleado ya asignado a este vuelo");
    } else {
      toast.success("¡Tripulante asignado! 🧑‍✈️");
      setShowModalAsignar(false);
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
  }, [cargarVuelos]);

  if (cargando) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest animate-pulse">🛰️ Sincronizando SkyFlow...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 md:p-8 transition-colors duration-500">
      <header className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight italic">
          Panel de Control <span className="text-blue-600 dark:text-blue-500">SkyFlow</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Gestión y monitorización de flota en tiempo real</p>
      </header>

      {perfil?.rol === "admin" && (
        <>
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
             {/* Cambiado rounded-[24px] por rounded-3xl */}
             <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total vuelos</p>
               <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{totalVuelos}</p>
             </div>
             <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Destino Top</p>
               <p className="text-xl font-black text-slate-800 dark:text-white truncate">{destinoMasRepetido}</p>
             </div>
             <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Más caro</p>
               <p className="text-xl font-black text-red-500 dark:text-red-400">{vueloMasCaro ? `${vueloMasCaro.precio}€` : "-"}</p>
             </div>
             <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Más barato</p>
               <p className="text-xl font-black text-green-500 dark:text-green-400">{vueloMasBarato ? `${vueloMasBarato.precio}€` : "-"}</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Cambiado rounded-[32px] por rounded-4xl */}
            <div className="bg-white dark:bg-slate-900 rounded-4xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 mb-6 uppercase tracking-widest">Top destinos</p>
              <div className="space-y-4">
                {destinosOrdenados.slice(0, 5).map(([dest, cnt]) => (
                  <div key={dest} className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 w-16 truncate">{dest}</span>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 dark:bg-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.3)] transition-all duration-1000" 
                        style={{ width: `${(cnt / maxCount) * 100}%` }} 
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-800 dark:text-white">{cnt}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-4xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">Distribución de precios</p>
              <PreciosHistograma vuelos={vuelos} />
            </div>
          </div>

          <div className="space-y-12 mb-12 border-t dark:border-slate-800 pt-8">
            <section><h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 tracking-tight">🏢 Registrar Aerolínea</h2><FormularioAerolinea onAerolineaCreada={() => cargarVuelos()} /></section>
            <section><h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 tracking-tight">➕ Registrar Vuelo</h2><FormularioVuelo onVueloCreado={() => cargarVuelos()} /></section>
          </div>
        </>
      )}

      <section>
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-2xl font-black text-slate-700 dark:text-slate-200 tracking-tight">🛫 Gestión de Flota</h2>
          <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border dark:border-slate-800 flex flex-col md:flex-row gap-2 items-center">
            <input 
              type="text" 
              placeholder="Origen"
              value={filtroOrigen} 
              onChange={(e) => setFiltroOrigen(e.target.value)} 
              className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-2 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all w-32" 
            />
            <input 
              type="text" 
              placeholder="Destino"
              value={filtroDestino} 
              onChange={(e) => setFiltroDestino(e.target.value)} 
              className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-2 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all w-32" 
            />
            <button onClick={() => cargarVuelos()} className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2 px-6 rounded-xl transition-all active:scale-95 text-xs uppercase tracking-widest">
              Buscar
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vuelos.map((vuelo) => (
            <VueloCard 
              key={vuelo.id} 
              vuelo={vuelo} 
              perfil={perfil} 
              onEliminar={eliminarVuelos} 
              onAsignar={(v) => {
                setVueloParaAsignar(v);
                cargarEmpleados();
                setShowModalAsignar(true);
              }}
            />
          ))}
        </div>
      </section>

      {/* MODAL DE ASIGNACIÓN */}
      {showModalAsignar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-md rounded-5xl p-8 border dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white italic tracking-tighter">Asignar <span className="text-blue-600">Tripulación</span></h2>
              <button onClick={() => setShowModalAsignar(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X /></button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 ml-2">Seleccionar Empleado</label>
                <select 
                  className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl dark:text-white border-none outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all"
                  onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
                >
                  <option value="">Tripulante disponible...</option>
                  {empleados.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.nombre} {emp.apellidos}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 ml-2">Rol en el vuelo</label>
                <select 
                  className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl dark:text-white border-none outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all"
                  onChange={(e) => setRolTripulante(e.target.value)}
                >
                  <option value="Piloto">Piloto</option>
                  <option value="Co-Piloto">Co-Piloto</option>
                  <option value="Sobrecargo">Sobrecargo</option>
                  <option value="TCP">TCP</option>
                </select>
              </div>

              <button 
                onClick={manejarAsignacion}
                className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95"
              >
                Confirmar Asignación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vuelos;