import { useEffect, useState } from "react";
import api from "../api/api";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Función para saber si se puede cancelar (más de 72h)
  const puedeCancelar = (fecha) => {
    const ahora = new Date();
    const vuelo = new Date(fecha);

    const diffHoras = (vuelo - ahora) / (1000 * 60 * 60);

    return diffHoras > 72;
  };

  // 🔹 Cargar reservas
  useEffect(() => {
    async function loadBookings() {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const { data } = await api.get("/reservas/mis-reservas", {
          headers: { Authorization: `Bearer ${token}` }
        });

        setBookings(data);
      } catch (err) {
        console.error("Error cargando reservas:", err);
      }

      setLoading(false);
    }

    loadBookings();
  }, []);

  const cancelarReserva = async (id) => {
    const token = localStorage.getItem("token");

    if (!window.confirm("¿Seguro que quieres cancelar esta reserva?")) return;

    try {
      // Usamos las backticks `` para que la variable ${id} se inserte correctamente en la URL
      await api.delete(`/reservas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Reserva cancelada correctamente");

      // Actualizamos la lista local eliminando la reserva cancelada
      setBookings(prev => prev.filter(r => r.id !== id));

      } catch (err) {
      // Registramos el error completo en la consola para depuración técnica (F12)
      console.error("Error al cancelar la reserva:", err.response?.data || err);

      // Extraemos el detalle del error que envía el backend (FastAPI)
      const mensajeError = err.response?.data?.detail;

      // Si el backend nos mandó un texto de error, lo mostramos. 
      // Si no (o si es un error 500 feo), mostramos un mensaje genérico.
      if (typeof mensajeError === "string") {
        alert(mensajeError);
      } else {
        alert("No se pudo cancelar la reserva. Por favor, inténtalo de nuevo más tarde.");
      }
    }
  };

  // 🔹 Estados de carga
  if (loading) return <p className="text-center mt-10">Cargando reservas...</p>;

  if (bookings.length === 0)
    return <p className="text-center mt-10">No tienes reservas todavía.</p>;

  // 🔹 Render
  return (
    <div className="max-w-3xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">My Bookings</h1>

      <div className="space-y-4">
        {bookings.map((r) => (
          <div key={r.id} className="bg-white p-4 rounded-xl shadow-md border">

            <h2 className="text-xl font-bold text-slate-800">
              {r.vuelos?.origen} → {r.vuelos?.destino}
            </h2>

            <p className="text-sm text-slate-500">
              Fecha: {new Date(r.vuelos?.fecha_salida).toLocaleString()}
            </p>

            <p className="text-sm text-slate-500">
              Precio: {r.vuelos?.precio}€
            </p>

            {/* 🔥 BOTÓN CANCELAR CON REGLA 72H */}
            {puedeCancelar(r.vuelos?.fecha_salida) ? (
              <button
                onClick={() => cancelarReserva(r.id)}
                className="mt-3 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              >
                Cancelar reserva
              </button>
            ) : (
              <p className="text-xs text-red-400 mt-2">
                No cancelable (menos de 72h)
              </p>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}