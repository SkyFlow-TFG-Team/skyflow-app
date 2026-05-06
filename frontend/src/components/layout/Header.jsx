import { useEffect, useState, useRef } from "react";
import { supabase } from "../../supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { useNotificaciones } from "../../hooks/useNotificaciones";
import { Bell, Sun, Moon } from "lucide-react"; // Añadimos iconos

// ─── FUERA del componente ─────────────────────────────────────────────────────
const tiempoRelativo = (fechaStr) => {
  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) return "";
  const ahora = new Date();
  const diff = ahora - fecha;
  const mins = Math.floor(diff / 60000);
  const horas = Math.floor(mins / 60);
  const dias = Math.floor(horas / 24);
  if (dias > 0) return `hace ${dias}d`;
  if (horas > 0) return `hace ${horas}h`;
  if (mins > 0) return `hace ${mins}m`;
  return "ahora";
};

// ─── COMPONENTE ───────────────────────────────────────────────────────────────
const Header = () => {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [panelNotifAbierto, setPanelNotifAbierto] = useState(false);
  
  // LÓGICA DE MODO OSCURO
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const notifRef = useRef(null);
  const navigate = useNavigate();

  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useNotificaciones(user?.id);

  // Efecto para aplicar el tema al HTML
  useEffect(() => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark'); // <-- Crucial
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light'); // <-- Crucial
  }
}, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        obtenerPerfil(session.user.id);
      }
    });

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

  useEffect(() => {
    const handleClickFuera = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setPanelNotifAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    setMenuAbierto(false);
    navigate("/login");
  };

  return (
    // Header adaptado: dark:bg-slate-900 y dark:border-slate-800
    <header className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 shadow-sm border-b dark:border-slate-800 relative transition-colors duration-300">
      <h1 
        className="font-bold text-2xl text-blue-600 dark:text-blue-400 cursor-pointer" 
        onClick={() => navigate("/")}
      >
        SkyFlow
      </h1>

      <div className="flex gap-4 items-center">
        
        {/* 🌗 BOTÓN TOGGLE TEMA (Añadido) */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:ring-2 hover:ring-blue-500 transition-all"
          title="Cambiar modo"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {!user ? (
          <div className="flex gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-600 dark:text-slate-300 p-2">Iniciar sesión</Link>
            <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Registrarse</Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">

            {/* 🔔 CAMPANA DE NOTIFICACIONES */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setPanelNotifAbierto(!panelNotifAbierto); setMenuAbierto(false); }}
                className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
              >
                <Bell size={20} />
                {noLeidas > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                    {noLeidas > 9 ? '9+' : noLeidas}
                  </span>
                )}
              </button>

              {panelNotifAbierto && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-sm font-black text-slate-700 dark:text-slate-200">Notificaciones</p>
                    {noLeidas > 0 && (
                      <button
                        onClick={marcarTodasLeidas}
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 uppercase tracking-widest"
                      >
                        Marcar todas leídas
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notificaciones.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-2xl mb-2">🔔</p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase">Sin notificaciones</p>
                      </div>
                    ) : (
                      notificaciones.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => marcarLeida(n.id)}
                          className={`px-4 py-3 border-b border-slate-50 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!n.leida ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <p className={`text-xs font-black text-slate-800 dark:text-slate-200 ${!n.leida ? 'text-blue-700 dark:text-blue-400' : ''}`}>
                                {n.titulo}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{n.mensaje}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">{tiempoRelativo(n.creada_en)}</p>
                              {!n.leida && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* MENÚ DE USUARIO */}
            <div className="relative">
              <button 
                onClick={() => { setMenuAbierto(!menuAbierto); setPanelNotifAbierto(false); }}
                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg transition-colors"
              >
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {perfil ? perfil.nombre : user.email}
                </span>
                <span className="text-[10px] text-slate-400">▼</span>
              </button>

              {menuAbierto && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-2 text-left">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      {perfil?.rol || 'Usuario'}
                    </p>
                  </div>

                  <button 
                    onClick={() => { navigate("/profile"); setMenuAbierto(false); }} 
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Mi Perfil
                  </button>

                  <button 
                    onClick={() => { navigate("/my-bookings"); setMenuAbierto(false); }} 
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Mis Reservas
                  </button>

                  {(perfil?.rol === 'empleado' || perfil?.rol === 'admin') && (
                    <button 
                      onClick={() => { navigate("/assigned_flights"); setMenuAbierto(false); }} 
                      className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      ✈️ Vuelos Asignados
                    </button>
                  )}

                  {perfil?.rol === 'admin' && (
                    <>
                      <hr className="my-1 border-slate-100 dark:border-slate-800" />
                      <button 
                        onClick={() => { navigate("/vuelos"); setMenuAbierto(false); }} 
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        ⚙️ Panel Control
                      </button>
                    </>
                  )}

                  <hr className="my-1 border-slate-100 dark:border-slate-800" />

                  <button 
                    onClick={handleLogout} 
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;