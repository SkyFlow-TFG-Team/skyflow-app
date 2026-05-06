import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import VueloCard from "../components/vuelos/VueloCard";

export default function AssignedFlights() {
  const [vuelos, setVuelos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssigned() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("asignaciones_empleados")
        .select("*, vuelos(*, aerolineas(nombre))")
        .eq("empleado_id", user.id);

      if (error) {
        console.error("Error de Supabase:", error.message);
      } else {
        setVuelos(data);
      }
      setLoading(false);
    }
    loadAssigned();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-400 dark:text-slate-500 font-bold animate-pulse uppercase tracking-widest">
          Cargando tus asignaciones...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 max-w-6xl mx-auto mt-10 p-4 transition-colors duration-500 pb-20">
      
      <header className="mb-10 text-left">
        <h1 className="text-4xl font-black text-slate-800 dark:text-white italic tracking-tighter">
          Panel de <span className="text-blue-600 dark:text-blue-500">Tripulación</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Gestiona tus vuelos asignados y horarios</p>
      </header>

      {vuelos.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-16 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center transition-colors">
          <p className="text-slate-400 dark:text-slate-600 font-bold uppercase italic">
            No tienes vuelos asignados actualmente
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vuelos.map((v) => (
            <div key={v.id} className="relative group">
              <VueloCard 
                vuelo={v.vuelos} 
                perfil={{ rol: 'empleado' }} 
              />
              
              {/* Badge de Rol Dinámico */}
              <div className="absolute top-4 right-14">
                 <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg shadow-amber-200/50 dark:shadow-none uppercase tracking-widest border border-amber-200 dark:border-amber-800 transition-all">
                   {v.rol_en_vuelo}
                 </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}