import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import api from "../api/api";
import toast from "react-hot-toast";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

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

  // 📸 Subir foto de perfil a Supabase Storage
  const handleFotoChange = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      toast.error("El archivo debe ser una imagen");
      return;
    }

    setSubiendoFoto(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const extension = archivo.name.split(".").pop();
      const ruta = `${user.id}/avatar.${extension}`;

      // Subir al bucket "avatars"
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(ruta, archivo, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtener la URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(ruta);

      // Guardar la URL en la tabla perfiles
      const { error: updateError } = await supabase
        .from("perfiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Actualizar el estado local
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success("✅ Foto actualizada correctamente");

    } catch (err) {
      console.error("Error al subir la foto:", err);
      toast.error("No se pudo subir la foto");
    }

    setSubiendoFoto(false);
  };

  // 🚪 Cerrar sesión
  const handleLogout = async () => {
    if (!window.confirm("¿Seguro que quieres cerrar sesión?")) return;
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    localStorage.removeItem("perfil");
    toast.success("Sesión cerrada correctamente");
    navigate("/login");
  };

  // Badge de color según rol
  const rolColor = {
    admin:    "bg-red-100 text-red-700 border-red-200",
    empleado: "bg-blue-100 text-blue-700 border-blue-200",
    cliente:  "bg-green-100 text-green-700 border-green-200",
  };

  if (loading) return <p className="text-center mt-10">Cargando perfil...</p>;

  if (!profile) return <p className="text-center mt-10">No se encontró el perfil.</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-8 px-4 pb-12">

      {/* PERFIL */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">

        {/* Banner decorativo */}
        <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-700" />

        <div className="px-6 pb-6">

          {/* Avatar + botón cambiar foto */}
          <div className="flex items-end justify-between -mt-12 mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-200">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-slate-400">
                    {profile.nombre?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                )}
              </div>

              {/* Botón cámara */}
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={subiendoFoto}
                className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors text-sm"
                title="Cambiar foto"
              >
                {subiendoFoto ? "⏳" : "📷"}
              </button>

              {/* Input oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFotoChange}
              />
            </div>

            {/* Badge rol */}
            <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${rolColor[profile.rol] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
              {profile.rol ?? "Usuario"}
            </span>
          </div>

          {/* Nombre */}
          <h1 className="text-2xl font-extrabold text-slate-800">
            {profile.nombre} {profile.apellidos}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{profile.email}</p>
        </div>
      </div>

      {/* DATOS DEL PERFIL */}
      <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Mis datos</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Nombre</p>
            <p className="text-slate-800 font-semibold">{profile.nombre}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Apellidos</p>
            <p className="text-slate-800 font-semibold">{profile.apellidos}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 md:col-span-2">
            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Email</p>
            <p className="text-slate-800 font-semibold">{profile.email}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Rol</p>
            <p className="text-slate-800 font-semibold capitalize">{profile.rol}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Miembro desde</p>
            <p className="text-slate-800 font-semibold">
              {profile.creado_en
                ? new Date(profile.creado_en).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* CERRAR SESIÓN */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Sesión</h2>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 font-bold py-3 rounded-xl hover:bg-red-600 hover:text-white transition-all"
        >
          🚪 Cerrar sesión
        </button>
      </div>

      {/* RESERVAS — intacto igual que tenías */}
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