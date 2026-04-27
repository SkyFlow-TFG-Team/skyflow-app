import { useEffect, useState } from "react";
import api from "../api/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        // 🔹 Perfil
        const perfilRes = await api.get("/usuarios/perfil", {
          headers: { Authorization: `Bearer ${token}` }
        });

        setProfile(perfilRes.data);

        // ✅ IMPORTANTE: guardar perfil para roles
        localStorage.setItem("perfil", JSON.stringify(perfilRes.data));

        // 🔹 Reservas
        const reservasRes = await api.get("/reservas/mis-reservas", {
          headers: { Authorization: `Bearer ${token}` }
        });

        setReservas(reservasRes.data);

      } catch (err) {
        console.error("Error cargando perfil:", err);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) return <p className="text-center mt-10">Cargando perfil...</p>;

  if (!profile) return <p className="text-center mt-10">No se encontró el perfil.</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-8">

      {/* PERFIL */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h1 className="text-3xl font-bold mb-4 text-blue-600">👤 My Profile</h1>

        <div className="space-y-2">
          <p><strong>Nombre:</strong> {profile.nombre}</p>
          <p><strong>Apellidos:</strong> {profile.apellidos}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Rol:</strong> {profile.rol}</p>
        </div>
      </div>

      {/* RESERVAS */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-slate-800">✈️ Mis Reservas</h2>

        {reservas.length === 0 ? (
          <p>No tienes reservas todavía.</p>
        ) : (
          <div className="space-y-4">
            {reservas.map((r) => (
              <div key={r.id} className="bg-white p-4 rounded-xl shadow-md border">
                <h3 className="text-lg font-bold">
                  {r.vuelos?.origen} → {r.vuelos?.destino}
                </h3>
                <p className="text-sm text-slate-500">
                  Fecha: {new Date(r.vuelos?.fecha_salida).toLocaleString()}
                </p>
                <p className="text-sm text-slate-500">
                  Precio: {r.vuelos?.precio}€
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}