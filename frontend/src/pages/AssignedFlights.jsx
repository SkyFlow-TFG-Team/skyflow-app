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

  if (loading) return <p className="text-center mt-10">Cargando vuelos asignados...</p>;

  return (
    <div className="max-w-6xl mx-auto mt-10 p-4">
      <h1 className="text-3xl font-bold mb-8 text-blue-600">Panel de Tripulación: Mis Vuelos</h1>

      {vuelos.length === 0 ? (
        <p className="text-slate-500 text-center">No tienes vuelos asignados.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vuelos.map((v) => (
            <div key={v.id} className="relative">
              <VueloCard 
                vuelo={v.vuelos} 
                perfil={{ rol: 'empleado' }} 
              />
              <div className="absolute top-2 right-12">
                 <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase">
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