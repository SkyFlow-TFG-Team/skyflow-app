import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Plane, Calendar, Clock, User, Users, ChevronRight, ArrowLeft, Search, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const AssignedFlights = () => {
  const [vuelosAsignados, setVuelosAsignados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vueloSeleccionado, setVueloSeleccionado] = useState(null);
  const [pasajeros, setPasajeros] = useState([]);
  const [cargandoPasajeros, setCargandoPasajeros] = useState(false);
  const [filtro, setFiltro] = useState("");

  const cargarVuelosAsignados = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('asignaciones_empleados')
        .select(`
          rol_en_vuelo,
          vuelos (
            id,
            origen,
            destino,
            fecha_salida,
            precio,
            aerolineas (nombre)
          )
        `)
        .eq('empleado_id', user.id);

      if (error) throw error;
      setVuelosAsignados(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar vuelos asignados');
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarManifiesto = async (vueloId) => {
    setCargandoPasajeros(true);
    setPasajeros([]);
    try {
      // CORRECCIÓN: No pedimos .email porque no está en la tabla perfiles
      const { data, error } = await supabase
        .from('reservas')
        .select(`
          id,
          fecha_reserva,
          perfiles (
            nombre,
            apellidos
          )
        `)
        .eq('vuelo_id', vueloId);

      if (error) throw error;
      setPasajeros(data || []);
    } catch (error) {
      console.error("Error Manifiesto:", error);
      toast.error('Error al obtener la lista de pasajeros');
    } finally {
      setCargandoPasajeros(false);
    }
  };

  useEffect(() => {
    cargarVuelosAsignados();
  }, [cargarVuelosAsignados]);

  const manejarVerPasajeros = (asignacion) => {
    setVueloSeleccionado(asignacion.vuelos);
    cargarManifiesto(asignacion.vuelos.id);
  };

  const vuelosFiltrados = vuelosAsignados.filter(a => 
    a.vuelos.origen.toLowerCase().includes(filtro.toLowerCase()) ||
    a.vuelos.destino.toLowerCase().includes(filtro.toLowerCase())
  );

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-500 font-bold animate-pulse">CARGANDO...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {!vueloSeleccionado ? (
          <>
            <header className="mb-10">
              <h1 className="text-4xl font-black text-slate-800 dark:text-white italic tracking-tighter">
                Mis <span className="text-blue-600">Asignaciones</span>
              </h1>
            </header>

            <div className="mb-8 relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Filtrar por ciudad..."
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 rounded-2xl border-none shadow-sm dark:text-white"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {vuelosFiltrados.length > 0 ? (
                vuelosFiltrados.map((asignacion, index) => (
                  <div key={index} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border dark:border-slate-800 hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {asignacion.rol_en_vuelo}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white">{asignacion.vuelos.origen}</h3>
                      <Plane className="text-blue-500" size={24} />
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white">{asignacion.vuelos.destino}</h3>
                    </div>
                    <button 
                      onClick={() => manejarVerPasajeros(asignacion)}
                      className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition-all"
                    >
                      VER PASAJEROS
                    </button>
                  </div>
                ))
              ) : (
                <p className="col-span-full text-center text-slate-400 uppercase font-bold py-20">Sin vuelos asignados</p>
              )}
            </div>
          </>
        ) : (
          <div>
            <button onClick={() => setVueloSeleccionado(null)} className="flex items-center gap-2 text-slate-500 font-bold mb-8">
              <ArrowLeft size={16} /> Volver
            </button>
            <div className="bg-white dark:bg-slate-900 rounded-4xl shadow-xl overflow-hidden border dark:border-slate-800">
              <div className="bg-slate-900 p-8 text-white">
                <h2 className="text-4xl font-black">{vueloSeleccionado.origen} → {vueloSeleccionado.destino}</h2>
              </div>
              <div className="p-8">
                {cargandoPasajeros ? (
                  <p className="text-center animate-pulse">Sincronizando lista...</p>
                ) : pasajeros.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b dark:border-slate-800">
                          <th className="pb-4 text-[10px] font-black uppercase">Pasajero</th>
                          <th className="pb-4 text-[10px] font-black uppercase">Fecha Reserva</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-slate-800">
                        {pasajeros.map((p, idx) => (
                          <tr key={idx}>
                            <td className="py-5 font-black uppercase text-sm dark:text-white">{p.perfiles?.nombre} {p.perfiles?.apellidos}</td>
                            <td className="py-5 text-sm dark:text-slate-400">{new Date(p.fecha_reserva).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-10">Sin pasajeros registrados</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedFlights;