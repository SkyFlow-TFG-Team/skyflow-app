import { useEffect, useState } from "react";
import api from "../api/api";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Función para saber si se puede cancelar (más de 72h antes de la salida)
  const puedeCancelar = (fechaStr) => {
    if (!fechaStr) return false;
    const ahora = new Date();
    const fechaVuelo = new Date(fechaStr);

    // Si la fecha no es válida, devolvemos false
    if (isNaN(fechaVuelo.getTime())) return false;

    const diffMs = fechaVuelo - ahora;
    const diffHoras = diffMs / (1000 * 60 * 60);

    return diffHoras > 72;
  };

  // 🔹 Cargar reservas desde el Backend
  const loadBookings = async () => {
    try {
      // Llamada al nuevo endpoint que hemos creado en reservas.py
      const { data } = await api.get("/reservas/mis-reservas");
      setBookings(data);
    } catch (err) {
      console.error("Error cargando reservas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // 🔹 Función para cancelar la reserva
  const cancelarReserva = async (id) => {
    if (!window.confirm("¿Seguro que quieres cancelar esta reserva?")) return;

    try {
      // El backend ahora se encarga de borrar la reserva y sumar la plaza al vuelo
      await api.delete(`/reservas/${id}`);
      
      alert("Reserva cancelada correctamente. Se ha liberado la plaza del vuelo.");
      
      // Actualizamos el estado local para que desaparezca la tarjeta
      setBookings(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Error al cancelar:", err);
      const mensajeError = err.response?.data?.detail || "No se pudo cancelar la reserva.";
      alert(mensajeError);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl font-semibold text-slate-600 animate-pulse">Consultando tus viajes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-800">
          Mis <span className="text-blue-600">Reservas</span>
        </h1>
        <p className="text-slate-500 text-sm">Gestiona tus próximos vuelos y cancelaciones</p>
      </header>

      {bookings.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center">
          <p className="text-slate-400 font-medium">No tienes ninguna reserva activa en este momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((r) => {
            // Extraemos los datos del vuelo que vienen del JOIN en el backend
            const vuelo = r.vuelos; 

            return (
              <div 
                key={r.id} 
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center hover:shadow-md transition-all"
              >
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg uppercase tracking-wider">
                      Confirmado
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID RES: {r.id.slice(0, 8)}</span>
                  </div>

                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    {vuelo?.origen} 
                    <span className="text-blue-500 text-base">✈️</span> 
                    {vuelo?.destino}
                  </h2>

                  <div className="flex flex-wrap gap-4 mt-3">
                    <div className="flex items-center gap-1 text-slate-500 text-sm">
                      <span>📅</span>
                      {vuelo?.fecha_salida 
                        ? new Date(vuelo.fecha_salida).toLocaleString('es-ES', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) 
                        : "Fecha no definida"}
                    </div>
                    <div className="flex items-center gap-1 text-slate-700 text-sm font-bold">
                      <span>💰</span> {vuelo?.precio}€
                    </div>
                  </div>
                </div>

                <div className="mt-6 md:mt-0 w-full md:w-auto flex flex-col items-center">
                  {puedeCancelar(vuelo?.fecha_salida) ? (
                    <button
                      onClick={() => cancelarReserva(r.id)}
                      className="w-full md:w-auto bg-red-50 text-red-600 border border-red-100 px-6 py-2.5 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all duration-300"
                    >
                      Cancelar Reserva
                    </button>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                        🔒 NO CANCELABLE
                      </span>
                      <p className="text-[9px] text-slate-400">Faltan menos de 72h para el vuelo</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}