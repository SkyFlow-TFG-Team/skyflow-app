import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AssignedFlights() {
  const [vuelos, setVuelos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssigned() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("asignaciones_empleados")
        .select("*, vuelos(origen, destino, fecha_salida)")
        .eq("empleado_id", user.id);

      if (!error) setVuelos(data);
      setLoading(false);
    }

    loadAssigned();
  }, []);

  if (loading) return <p className="text-center mt-10">Cargando vuelos...</p>;

  if (vuelos.length === 0)
    return <p className="text-center mt-10">No tienes vuelos asignados.</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">
        Vuelos Asignados
      </h1>

      <div className="space-y-4">
        {vuelos.map((v) => (
          <div key={v.id} className="bg-white p-4 rounded-xl shadow-md border">
            <h2 className="text-xl font-bold text-slate-800">
              {v.vuelos.origen} → {v.vuelos.destino}
            </h2>
            <p className="text-sm text-slate-500">
              Fecha: {new Date(v.vuelos.fecha_salida).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}