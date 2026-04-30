import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  const obtenerPerfil = async (userId) => {
    try {
      const { data } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) setPerfil(data);
    } catch {
      console.warn("Perfil no encontrado todavía");
    }
  };

  useEffect(() => {
    // 1. Ver si ya hay sesión al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        obtenerPerfil(session.user.id);
      }
    });

    // 2. Escuchar cambios (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        obtenerPerfil(session.user.id);
      } else {
        setUser(null);
        setPerfil(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    setMenuAbierto(false);
    navigate("/login");
  };

  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-sm border-b relative">
      {/* 🏠 EL LOGO SIEMPRE LLEVA A LA HOME PÚBLICA */}
      <h1 className="font-bold text-2xl text-blue-600 cursor-pointer" onClick={() => navigate("/")}>
        SkyFlow
      </h1>

      <div className="flex gap-4 items-center">
        {!user ? (
          <div className="flex gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-600 p-2">Iniciar sesión</Link>
            <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Registrarse</Link>
          </div>
        ) : (
          <div className="relative">
            <button 
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg"
            >
              <span className="text-sm font-bold text-slate-700">
                {perfil ? perfil.nombre : user.email}
              </span>
              <span>▼</span>
            </button>

            {menuAbierto && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-xl z-50 py-2 text-left">
                <div className="px-4 py-2 border-b bg-slate-50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    {perfil?.rol || 'Usuario'}
                  </p>
                </div>

                {/* ✅ 1. Accesible para TODOS los usuarios logueados */}
                <button 
                  onClick={() => { navigate("/profile"); setMenuAbierto(false); }} 
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                >
                  Mi Perfil
                </button>

                <button 
                  onClick={() => { navigate("/my-bookings"); setMenuAbierto(false); }} 
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                >
                  Mis Reservas
                </button>

                {/* ✅ 2. Solo para EMPLEADOS y ADMINS */}
                {(perfil?.rol === 'empleado' || perfil?.rol === 'admin') && (
                  <button 
                    onClick={() => { navigate("/assigned_flights"); setMenuAbierto(false); }} 
                    className="w-full text-left px-4 py-2 text-sm text-blue-600 font-semibold hover:bg-blue-50"
                  >
                    ✈️ Vuelos Asignados
                  </button>
                )}

                {/* ✅ 3. Solo para ADMINS (Manda a la nueva ruta /admin-vuelos) */}
                {perfil?.rol === 'admin' && (
                  <>
                    <hr className="my-1" />
                    <button 
                      onClick={() => { navigate("/vuelos"); setMenuAbierto(false); }} 
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      ⚙️ Panel Control
                    </button>
                  </>
                )}

                <hr className="my-1" />

                <button 
                  onClick={handleLogout} 
                  className="w-full text-left px-4 py-2 text-sm text-red-600 font-bold hover:bg-red-50"
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