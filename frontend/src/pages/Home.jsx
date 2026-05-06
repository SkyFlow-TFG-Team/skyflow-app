import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { supabase } from "../supabaseClient";
import toast from 'react-hot-toast';
import VueloCard from '../components/vuelos/VueloCard';
import Buscador from '../components/vuelos/Buscador';
import MapaAsientos from '../components/vuelos/MapaAsientos';
import { X, Plane, CreditCard, Lock, CheckCircle } from 'lucide-react';

const formatearTarjeta = (valor) => valor.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const formatearCaducidad = (valor) => {
  const limpio = valor.replace(/\D/g, '').slice(0, 4);
  return limpio.length >= 3 ? `${limpio.slice(0, 2)}/${limpio.slice(2)}` : limpio;
};

const Home = () => {
  const navigate = useNavigate();
  const [vuelos, setVuelos] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [favoritos, setFavoritos] = useState([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [vueloSeleccionado, setVueloSeleccionado] = useState(null);
  const [asientosOcupados, setAsientosOcupados] = useState([]);
  const [asientoElegido, setAsientoElegido] = useState(null);

  const [filtroOrigen, setFiltroOrigen] = useState('');
  const [filtroDestino, setFiltroDestino] = useState('');
  const [precioMax, setPrecioMax] = useState(2000);
  const [aerolineas, setAerolineas] = useState([]);
  const [aerolineaSeleccionada, setAerolineaSeleccionada] = useState('');

  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [pagoCompletado, setPagoCompletado] = useState(false);
  const [datosTarjeta, setDatosTarjeta] = useState({ nombre: '', numero: '', caducidad: '', cvv: '' });
  const [erroresTarjeta, setErroresTarjeta] = useState({});

  const cargarAerolineas = async () => { 
    try { 
      const res = await api.get('/aerolineas/'); 
      setAerolineas(res.data); 
    } catch { 
      console.warn("No se pudieron cargar las aerolíneas"); 
    } 
  };

  const cargarVuelos = async () => {
    try {
      const res = await api.get('/vuelos/', { params: { origen: filtroOrigen || undefined, destino: filtroDestino || undefined } });
      const filtrados = res.data.filter(v => (Number(v.precio) <= precioMax) && (aerolineaSeleccionada === '' || (v.aerolineas?.nombre || '') === aerolineaSeleccionada));
      setVuelos(filtrados);
    } catch { 
      toast.error("Error cargando vuelos"); 
    } finally { 
      setCargando(false); 
    }
  };

  const abrirSelectorAsientos = async (vuelo) => {
    if (!perfil) { toast.error("Debes iniciar sesión"); return; }
    setVueloSeleccionado(vuelo);
    setAsientoElegido(null);
    try {
      const res = await api.get(`/reservas/ocupados/${vuelo.id}`);
      setAsientosOcupados(res.data);
      setModalAbierto(true);
    } catch { 
      toast.error("Error de disponibilidad"); 
    }
  };

  const handleToggleFavorito = async (vueloId) => {
    if (!perfil) return toast.error("Inicia sesión");
    const isFav = favoritos.includes(vueloId);
    try {
      if (isFav) {
        await supabase.from('favoritos').delete().match({ cliente_id: perfil.id, vuelo_id: vueloId });
        setFavoritos(prev => prev.filter(id => id !== vueloId));
      } else {
        await supabase.from('favoritos').insert({ cliente_id: perfil.id, vuelo_id: vueloId });
        setFavoritos(prev => [...prev, vueloId]);
      }
    } catch { 
      toast.error("Error favoritos"); 
    }
  };

  const handleEliminarVuelo = async (vueloId) => {
    if (!window.confirm("¿Eliminar vuelo?")) return;
    toast.promise(api.delete(`/vuelos/${vueloId}`), { 
      loading: 'Eliminando...', 
      success: () => { cargarVuelos(); return 'Eliminado'; }, 
      error: 'Error' 
    });
  };

  const abrirPasarelaPago = () => {
    if (!asientoElegido) return toast.error("Selecciona asiento");
    setModalAbierto(false);
    setModalPagoAbierto(true);
  };

  const procesarPago = async () => {
    const errores = {};
    if (!datosTarjeta.nombre.trim()) errores.nombre = "Obligatorio";
    if (datosTarjeta.numero.replace(/\s/g, '').length !== 16) errores.numero = "16 dígitos";
    if (!/^\d{2}\/\d{2}$/.test(datosTarjeta.caducidad)) errores.caducidad = "MM/AA";
    if (datosTarjeta.cvv.length < 3) errores.cvv = "CVV inválido";

    setErroresTarjeta(errores);
    if (Object.keys(errores).length > 0) return;

    setProcesandoPago(true);
    await new Promise(res => setTimeout(res, 1500));
    try {
      await api.post('/reservas/', { vuelo_id: vueloSeleccionado.id, asiento: asientoElegido });
      setPagoCompletado(true);
      cargarVuelos();
    } catch { 
      toast.error("Error al confirmar la reserva"); 
      setModalPagoAbierto(false); 
    } finally { 
      setProcesandoPago(false); 
    }
  };

  const cerrarModalPago = () => { setModalPagoAbierto(false); setPagoCompletado(false); };

  useEffect(() => {
    const inicializar = async () => {
      await Promise.all([cargarVuelos(), cargarAerolineas()]);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
        setPerfil(p);
        const { data: f } = await supabase.from("favoritos").select("vuelo_id").eq("cliente_id", user.id);
        if (f) setFavoritos(f.map(i => i.vuelo_id));
      }
    };
    inicializar();
  }, []);

  if (cargando) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="animate-bounce text-6xl mb-4">🛫</div>
        <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-tighter italic">SkyFlow está despegando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 md:p-8 transition-colors duration-500">
      <header className="mb-10 text-center">
        <h1 className="text-6xl font-black text-slate-800 dark:text-white tracking-tighter mb-2 italic">
          Sky<span className="text-blue-600 dark:text-blue-500">Flow</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium tracking-tight">Vuela más alto, paga menos</p>
      </header>

      <Buscador 
        filtroOrigen={filtroOrigen} setFiltroOrigen={setFiltroOrigen}
        filtroDestino={filtroDestino} setFiltroDestino={setFiltroDestino}
        precioMax={precioMax} setPrecioMax={setPrecioMax}
        aerolineas={aerolineas} aerolineaSeleccionada={aerolineaSeleccionada}
        setAerolineaSeleccionada={setAerolineaSeleccionada} onBuscar={cargarVuelos}
        onLimpiar={() => { setFiltroOrigen(''); setFiltroDestino(''); setPrecioMax(2000); setAerolineaSeleccionada(''); cargarVuelos(); }}
      />
      
      <section className="max-w-6xl mx-auto mt-12">
        {vuelos.length === 0 ? (
          <div className="text-center p-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-400 dark:text-slate-600 font-bold uppercase italic">No hay vuelos disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vuelos.map(v => (
              <VueloCard 
                key={v.id} vuelo={v} perfil={perfil} 
                onReservar={() => abrirSelectorAsientos(v)}
                isFavorito={favoritos.includes(v.id)}
                onToggleFavorito={handleToggleFavorito}
                onEliminar={handleEliminarVuelo}
              />
            ))}
          </div>
        )}
      </section>

      {/* MODAL ASIENTOS */}
      {modalAbierto && vueloSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-[320px] shadow-2xl flex flex-col h-full max-h-[85vh] overflow-hidden border dark:border-slate-800 animate-in zoom-in duration-200">
            <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <div className="text-left">
                <h2 className="text-sm font-black text-slate-800 dark:text-white">Seleccionar Asiento</h2>
                <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{vueloSeleccionado.origen}-{vueloSeleccionado.destino}</p>
              </div>
              <button onClick={() => setModalAbierto(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 flex justify-center items-start min-h-0">
              <MapaAsientos ocupados={asientosOcupados} seleccionado={asientoElegido} alSeleccionar={setAsientoElegido} />
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800">
              <button 
                onClick={abrirPasarelaPago} disabled={!asientoElegido}
                className={`w-full py-3 rounded-xl font-black text-[10px] tracking-widest transition-all ${asientoElegido ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'}`}
              >
                {asientoElegido ? 'CONTINUAR AL PAGO →' : 'SELECCIONA ASIENTO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAGO */}
      {modalPagoAbierto && vueloSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden border dark:border-slate-800 animate-in zoom-in duration-200">
            {pagoCompletado ? (
              <div className="p-10 flex flex-col items-center text-center gap-4">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"><CheckCircle size={40} className="text-green-500 dark:text-green-400" /></div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">¡Pago completado!</h2>
                <button onClick={() => { cerrarModalPago(); navigate("/my-bookings"); }} className="w-full bg-blue-600 text-white font-black py-3 rounded-xl">VER MIS RESERVAS</button>
              </div>
            ) : (
              <>
                <div className="bg-slate-900 dark:bg-black px-6 py-5 flex justify-between items-center text-left">
                  <div>
                    <p className="text-slate-400 text-[9px] font-black uppercase">Pago seguro</p>
                    <p className="text-white font-black text-lg">{vueloSeleccionado.origen} → {vueloSeleccionado.destino}</p>
                    <p className="text-blue-400 text-[10px] font-bold uppercase">Asiento {asientoElegido} · {vueloSeleccionado.precio}€</p>
                  </div>
                  <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full"><Lock size={10} className="text-green-400" /><span className="text-green-400 text-[9px] font-black uppercase tracking-widest">SSL</span></div>
                </div>
                <div className="p-6 space-y-4 text-left">
                  <div className="flex items-center gap-2 mb-2"><CreditCard size={18} className="text-blue-600 dark:text-blue-400" /><span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Datos de tarjeta</span></div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre del titular</label>
                    <input type="text" placeholder="JUAN GARCÍA" value={datosTarjeta.nombre} onChange={e => setDatosTarjeta(prev => ({ ...prev, nombre: e.target.value.toUpperCase() }))}
                      className={`w-full border rounded-xl p-3 mt-1 font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 ${erroresTarjeta.nombre ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`} />
                    {erroresTarjeta.nombre && <p className="text-red-500 text-[10px] mt-1 font-bold">{erroresTarjeta.nombre}</p>}
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Número de tarjeta</label>
                    <input type="text" placeholder="4242 4242 4242 4242" value={datosTarjeta.numero} onChange={e => setDatosTarjeta(prev => ({ ...prev, numero: formatearTarjeta(e.target.value) }))}
                      className={`w-full border rounded-xl p-3 mt-1 font-mono font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 ${erroresTarjeta.numero ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`} />
                    {erroresTarjeta.numero && <p className="text-red-500 text-[10px] mt-1 font-bold">{erroresTarjeta.numero}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Caducidad</label>
                      <input type="text" placeholder="MM/AA" value={datosTarjeta.caducidad} onChange={e => setDatosTarjeta(prev => ({ ...prev, caducidad: formatearCaducidad(e.target.value) }))}
                        className={`w-full border rounded-xl p-3 mt-1 font-mono font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 ${erroresTarjeta.caducidad ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CVV</label>
                      <input type="password" placeholder="•••" maxLength={4} value={datosTarjeta.cvv} onChange={e => setDatosTarjeta(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                        className={`w-full border rounded-xl p-3 mt-1 font-mono font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 ${erroresTarjeta.cvv ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`} />
                    </div>
                  </div>
                  <button onClick={procesarPago} disabled={procesandoPago} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg dark:shadow-blue-900/30 tracking-widest text-sm disabled:opacity-50">
                    {procesandoPago ? 'PROCESANDO...' : `PAGAR ${vueloSeleccionado.precio}€`}
                  </button>
                  <button onClick={() => { setModalPagoAbierto(false); setModalAbierto(true); }} className="w-full text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest text-center">← Volver</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;