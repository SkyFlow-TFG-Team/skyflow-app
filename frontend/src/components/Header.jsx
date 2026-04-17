import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  // 1. Función para obtener datos de la tabla perfiles
  const obtenerPerfil = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setPerfil(data);
      }
      if (error) {
        console.warn("Perfil no encontrado o error:", error.message);
      }
    } catch (err) {
      console.error("Error inesperado al obtener perfil:", err);
    }
  };

  // 2. Efecto para controlar la sesión
  useEffect(() => {
    // Comprobar si ya hay una sesión activa al cargar
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        obtenerPerfil(session.user.id);
      }
    };
    checkInitialSession();

    // Escuchar cambios de estado (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        obtenerPerfil(session.user.id);
      } else {
        setUser(null);
        setPerfil(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    setMenuAbierto(false);
    navigate("/login");
  };

  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-sm border-b relative">
      <h1 
        className="font-bold text-2xl text-blue-600 cursor-pointer" 
        onClick={() => navigate("/")}
      >
        SkyFlow
      </h1>

      <div className="flex gap-4 items-center">
        {!user ? (
          <div className="flex gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 p-2">
              Iniciar sesión
            </Link>
            <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              Registrarse
            </Link>
          </div>
        ) : (
          <div className="relative">
            <button 
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition"
            >
              <span className="text-sm font-bold text-slate-700">
                {perfil ? perfil.nombre : "Mi Cuenta"}
              </span>
              <span className="text-xs">▼</span>
            </button>

            {menuAbierto && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-xl z-50 py-2">
                <div className="px-4 py-2 border-b bg-slate-50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {perfil?.rol || 'Usuario'}
                  </p>
                  <p className="text-xs text-slate-600 truncate">{user.email}</p>
                </div>
                
                <button 
                  onClick={() => { navigate("/"); setMenuAbierto(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  Panel Principal
                </button>

                <hr className="my-1 border-slate-100" />
                
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 font-bold hover:bg-red-50 transition"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;