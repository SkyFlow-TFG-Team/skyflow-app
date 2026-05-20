import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import api from "../api/api";
import toast from "react-hot-toast";
import VueloCard from "../components/vuelos/VueloCard"; // 🔹 TAREA 4
import { HeartCrack } from "lucide-react"; // 🔹 TAREA 4

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [reservas, setReservas] = useState([]);
  
  // Favoritos
  const [vuelosFavoritos, setVuelosFavoritos] = useState([]);
  const [favoritosIds, setFavoritosIds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        // Cargar Perfil
        const perfilRes = await api.get("/usuarios/perfil", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(perfilRes.data);
        localStorage.setItem("perfil", JSON.stringify(perfilRes.data));

        // Cargar Reservas
        const reservasRes = await api.get("/reservas/mis-reservas", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReservas(reservasRes.data);

        // Cargar Favoritos
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: favsData } = await supabase
            .from('favoritos')
            .select('vuelo_id')
            .eq('cliente_id', user.id);
          
          const idsFavoritos = favsData ? favsData.map(f => f.vuelo_id) : [];
          setFavoritosIds(idsFavoritos);

          if (idsFavoritos.length > 0) {
            const resVuelos = await api.get('/vuelos/');
            const misVuelos = resVuelos.data.filter(vuelo => idsFavoritos.includes(vuelo.id));
            setVuelosFavoritos(misVuelos);
          }
        }

      } catch (err) {
        console.error("Error cargando perfil:", err);
      }

      setLoading(false);
    }

    loadData();
  }, [navigate]);

  // Eliminar de favoritos desde el perfil
  const handleToggleFavorito = async (vueloId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('favoritos').delete().match({ cliente_id: user.id, vuelo_id: vueloId });
      
      // Quitar de la pantalla sin recargar
      setFavoritosIds(prev => prev.filter(id => id !== vueloId));
      setVuelosFavoritos(prev => prev.filter(vuelo => vuelo.id !== vueloId));
      
      toast.success("Vuelo eliminado de tu lista", { icon: '🗑️' });
    } catch {
      toast.error("Error al quitar de favoritos");
    }
  };

  //  Redirigir a Home al intentar reservar desde perfil
  const handleIrAReservar = () => {
    toast('Redirigiendo al buscador para gestionar tu asiento...', { icon: '✈️' });
    navigate('/');
  };

  // Subir foto de perfil a Supabase Storage
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

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(ruta, archivo, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(ruta);

      const { error: updateError } = await supabase
        .from("perfiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success("✅ Foto actualizada correctamente");

    } catch (err) {
      console.error("Error al subir la foto:", err);
      toast.error("No se pudo subir la foto");
    }

    setSubiendoFoto(false);
  };

  // Cerrar sesión
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
    admin:    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    empleado: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    cliente:  "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  };

  if (loading) return <p className="text-center mt-10 font-bold text-slate-500 animate-pulse dark:text-slate-400">Cargando perfil...</p>;
  if (!profile) return <p className="text-center mt-10 dark:text-white">No se encontró el perfil.</p>;

  return (
    <div className="max-w-6xl mx-auto mt-10 space-y-8 px-4 pb-12 transition-colors duration-500">

      {/* PERFIL */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md overflow-hidden max-w-4xl mx-auto border dark:border-slate-800">
        <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-700 dark:to-blue-900" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 shadow-md overflow-hidden bg-slate-200 dark:bg-slate-800">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-slate-400 dark:text-slate-500 font-bold">
                    {profile.nombre?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={subiendoFoto}
                className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors text-sm"
                title="Cambiar foto"
              >
                {subiendoFoto ? "⏳" : "📷"}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
            </div>
            <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${rolColor[profile.rol] ?? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"}`}>
              {profile.rol ?? "Usuario"}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">
            {profile.nombre} {profile.apellidos}
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{profile.email}</p>
        </div>
      </div>

      {/* DATOS DEL PERFIL */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md p-6 space-y-4 max-w-4xl mx-auto border dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Mis datos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 transition-colors">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">Nombre</p>
            <p className="text-slate-800 dark:text-slate-200 font-semibold">{profile.nombre}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 transition-colors">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">Apellidos</p>
            <p className="text-slate-800 dark:text-slate-200 font-semibold">{profile.apellidos}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 md:col-span-2 transition-colors">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">Email</p>
            <p className="text-slate-800 dark:text-slate-200 font-semibold">{profile.email}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 transition-colors">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">Rol</p>
            <p className="text-slate-800 dark:text-slate-200 font-semibold capitalize">{profile.rol}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 transition-colors">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">Miembro desde</p>
            <p className="text-slate-800 dark:text-slate-200 font-semibold">
              {profile.creado_en ? new Date(profile.creado_en).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }) : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* LISTA DE DESEOS */}
      <div className="max-w-6xl mx-auto pt-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 tracking-tight flex items-center gap-2">
          ❤️ Mi Lista de Deseos
        </h2>

        {vuelosFavoritos.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center transition-colors">
            <HeartCrack size={64} className="text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Aún no tienes vuelos guardados</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">Explora el mundo y dale al corazón para guardar tus favoritos aquí.</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
            >
              BUSCAR VUELOS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vuelosFavoritos.map((vuelo) => (
              <VueloCard 
                key={vuelo.id} 
                vuelo={vuelo} 
                perfil={profile} 
                onReservar={handleIrAReservar} 
                isFavorito={true} 
                onToggleFavorito={handleToggleFavorito} 
                onEliminar={() => {}} 
              />
            ))}
          </div>
        )}
      </div>

      {/* RESERVAS */}
      <div className="max-w-6xl mx-auto pt-6">
        <h2 className="text-2xl font-black mb-6 text-slate-800 dark:text-white tracking-tight">✈️ Mis Reservas</h2>
        {reservas.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl transition-colors">
            <p className="text-slate-400 dark:text-slate-500 font-bold">No tienes reservas todavía.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reservas.map((r) => (
              <div key={r.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">
                  {r.vuelos?.origen} → {r.vuelos?.destino}
                </h3>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mr-2">Fecha:</span> 
                    {new Date(r.vuelos?.fecha_salida).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mr-2">Precio:</span> 
                    {r.vuelos?.precio}€
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CERRAR SESIÓN */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md p-6 max-w-4xl mx-auto mt-12 border dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Sesión</h2>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 font-bold py-3 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 dark:bg-red-900/10 dark:border-red-900/20 dark:text-red-500 dark:hover:bg-red-600 dark:hover:text-white"
        >
          🚪 Cerrar sesión
        </button>
      </div>

    </div>
  );
}