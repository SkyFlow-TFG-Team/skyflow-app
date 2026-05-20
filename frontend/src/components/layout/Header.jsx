import { useEffect, useState, useRef } from "react";
import { supabase } from "../../supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { useNotificaciones } from "../../hooks/useNotificaciones";
import { 
  Bell, 
  Sun, 
  Moon, 
  LogOut, 
  User, 
  LayoutDashboard, 
  Briefcase, 
  Settings, 
  Plane,
  Calendar 
} from "lucide-react"; 
import toast from "react-hot-toast";


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

const Header = () => {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [panelNotifAbierto, setPanelNotifAbierto] = useState(false);
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const notifRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useNotificaciones(user?.id);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
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
    } catch (e) {
      console.warn("Perfil no cargado:", e);
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
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    setMenuAbierto(false);
    toast.success("Sesión cerrada");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-[100] flex justify-between items-center p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b dark:border-slate-800 transition-all duration-500">
      
      {/* LOGO */}
      <div 
        className="flex items-center gap-2 group cursor-pointer"
        onClick={() => navigate("/")}
      >
        <div className="bg-blue-600 p-2 rounded-xl group-hover:rotate-12 transition-transform duration-500 shadow-lg shadow-blue-500/20">
          <Plane className="text-white fill-white" size={24} />
        </div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">
          Sky<span className="text-blue-600">Flow</span>
        </h1>
      </div>

      <div className="flex gap-4 items-center">
        
        {/* BOTÓN TEMA */}
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:ring-2 hover:ring-blue-500 transition-all shadow-sm"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {!user ? (
          <div className="flex gap-2">
            <Link to="/login" className="text-sm font-bold text-slate-600 dark:text-slate-300 px-4 py-2 uppercase tracking-widest hover:text-blue-600 transition-colors">Iniciar Sesión</Link>
            <Link to="/register" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">Registro</Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">

            {/* CAMPANIA NOTIF */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={(e) => { 
                  e.stopPropagation();
                  setPanelNotifAbierto(!panelNotifAbierto); 
                  setMenuAbierto(false); 
                }}
                className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300"
              >
                <Bell size={20} />
                {noLeidas > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950 animate-bounce">
                    {noLeidas > 9 ? '9+' : noLeidas}
                  </span>
                )}
              </button>

              {panelNotifAbierto && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[110] overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Notificaciones</p>
                    {noLeidas > 0 && (
                      <button onClick={marcarTodasLeidas} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline uppercase">Limpiar todo</button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notificaciones.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 dark:text-slate-600 text-xs font-bold uppercase italic">Bandeja vacía</div>
                    ) : (
                      notificaciones.map((n) => (
                        <div key={n.id} onClick={() => marcarLeida(n.id)} className={`px-4 py-3 border-b border-slate-50 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!n.leida ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <p className={`text-xs font-bold text-slate-800 dark:text-slate-200 ${!n.leida ? 'text-blue-600 dark:text-blue-400' : ''}`}>{n.titulo}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.mensaje}</p>
                            </div>
                            <p className="text-[9px] text-slate-400 dark:text-slate-600 font-bold whitespace-nowrap">{tiempoRelativo(n.creada_en)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* MENÚ USUARIO */}
            <div className="relative" ref={menuRef}>
              <button 
                onClick={(e) => { 
                  e.stopPropagation();
                  setMenuAbierto(!menuAbierto); 
                  setPanelNotifAbierto(false); 
                }}
                className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 pl-4 pr-3 py-1.5 rounded-2xl border border-transparent hover:border-blue-500/30 transition-all group"
              >
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                    {perfil ? perfil.nombre : 'Usuario'}
                  </span>
                  <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                    {perfil?.rol || 'Cliente'}
                  </span>
                </div>
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  {perfil?.nombre?.charAt(0).toUpperCase() || <User size={16} />}
                </div>
              </button>

              {menuAbierto && (
                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[110] py-3 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 pb-2 mb-2 border-b dark:border-slate-800">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Navegación</p>
                  </div>

                  <button onClick={() => { navigate("/profile"); setMenuAbierto(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <User size={16} className="text-blue-500" /> Mi Perfil
                  </button>

                  <button onClick={() => { navigate("/my-bookings"); setMenuAbierto(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Calendar size={16} className="text-blue-500" /> Mis Reservas
                  </button>

                  {(perfil?.rol === 'empleado' || perfil?.rol === 'admin') && (
                    <button onClick={() => { navigate("/assigned_flights"); setMenuAbierto(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <Briefcase size={16} /> Vuelos Asignados
                    </button>
                  )}

                  {perfil?.rol === 'admin' && (
                    <button onClick={() => { navigate("/vuelos"); setMenuAbierto(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <Settings size={16} className="text-blue-500" /> Panel de Control
                    </button>
                  )}

                  <div className="my-2 border-t dark:border-slate-800" />

                  <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-black text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <LogOut size={16} /> Cerrar sesión
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