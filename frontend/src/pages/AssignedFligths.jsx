import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AssignedFlights() {
  const [vuelos, setVuelos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssigned() {
      // 1. Obtenemos el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. Consultamos la tabla de asignaciones con el JOIN a vuelos
      // Hemos asegurado que la relación traiga los campos necesarios
      const { data, error } = await supabase
        .from("asignaciones_empleados")
        .select("*, vuelos(origen, destino, fecha_salida)")
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

  if (vuelos.length === 0)
    return (
      <div className="text-center mt-10">
        <p className="text-slate-500">No tienes vuelos asignados en este momento.</p>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">
        Panel de Tripulación: Mis Vuelos
      </h1>

      <div className="space-y-4">
        {vuelos.map((v) => (
          <div key={v.id} className="bg-white p-4 rounded-xl shadow-md border-l-4 border-blue-500">
            <h2 className="text-xl font-bold text-slate-800">
              {/* 🛡️ Uso de ?. para evitar errores si vuelos es null */}
              {v.vuelos?.origen || "N/A"} → {v.vuelos?.destino || "N/A"}
            </h2>
            
            <div className="mt-2 flex justify-between items-center">
              <p className="text-sm text-slate-600">
                <span className="font-semibold">Fecha:</span> {v.vuelos?.fecha_salida 
                  ? new Date(v.vuelos.fecha_salida).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) 
                  : "Fecha no disponible"}
              </p>
              
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded">
                {v.rol_en_vuelo || "Tripulación"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}