import { useEffect, useState, useRef } from "react";
import { supabase } from "../../supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { useNotificaciones } from "../../hooks/useNotificaciones";
import { Bell } from "lucide-react";

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
  const notifRef = useRef(null);
  const navigate = useNavigate();

  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useNotificaciones(user?.id);

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
    <header className="flex justify-between items-center p-4 bg-white shadow-sm border-b relative">
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
          <div className="flex items-center gap-3">

            {/* 🔔 CAMPANA DE NOTIFICACIONES */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setPanelNotifAbierto(!panelNotifAbierto); setMenuAbierto(false); }}
                className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
              >
                <Bell size={20} />
                {noLeidas > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {noLeidas > 9 ? '9+' : noLeidas}
                  </span>
                )}
              </button>

              {panelNotifAbierto && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <p className="text-sm font-black text-slate-700">Notificaciones</p>
                    {noLeidas > 0 && (
                      <button
                        onClick={marcarTodasLeidas}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest"
                      >
                        Marcar todas leídas
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notificaciones.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-2xl mb-2">🔔</p>
                        <p className="text-slate-400 text-xs font-bold uppercase">Sin notificaciones</p>
                      </div>
                    ) : (
                      notificaciones.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => marcarLeida(n.id)}
                          className={`px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!n.leida ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <p className={`text-xs font-black text-slate-800 ${!n.leida ? 'text-blue-700' : ''}`}>
                                {n.titulo}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{n.mensaje}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <p className="text-[9px] text-slate-400 font-bold">{tiempoRelativo(n.creada_en)}</p>
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

                  {(perfil?.rol === 'empleado' || perfil?.rol === 'admin') && (
                    <button 
                      onClick={() => { navigate("/assigned_flights"); setMenuAbierto(false); }} 
                      className="w-full text-left px-4 py-2 text-sm text-blue-600 font-semibold hover:bg-blue-50"
                    >
                      ✈️ Vuelos Asignados
                    </button>
                  )}

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
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;