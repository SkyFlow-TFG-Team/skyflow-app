import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { supabase } from "../supabaseClient";
import toast from 'react-hot-toast';
import VueloCard from '../components/vuelos/VueloCard';
import Buscador from '../components/vuelos/Buscador';
import MapaAsientos from '../components/vuelos/MapaAsientos';
import { X, Plane, CreditCard, Lock, CheckCircle } from 'lucide-react';

// 💳 Formateador de número de tarjeta (grupos de 4)
const formatearTarjeta = (valor) => {
  return valor.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
};

// 💳 Formateador de fecha de caducidad (MM/AA)
const formatearCaducidad = (valor) => {
  const limpio = valor.replace(/\D/g, '').slice(0, 4);
  if (limpio.length >= 3) return `${limpio.slice(0, 2)}/${limpio.slice(2)}`;
  return limpio;
};

const Home = () => {
  const navigate = useNavigate();
  const [vuelos, setVuelos] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  // --- ESTADOS PARA EL MAPA DE ASIENTOS ---
  const [modalAbierto, setModalAbierto] = useState(false);
  const [vueloSeleccionado, setVueloSeleccionado] = useState(null);
  const [asientosOcupados, setAsientosOcupados] = useState([]);
  const [asientoElegido, setAsientoElegido] = useState(null);

  // --- ESTADOS PARA FILTROS ---
  const [filtroOrigen, setFiltroOrigen] = useState('');
  const [filtroDestino, setFiltroDestino] = useState('');
  const [precioMax, setPrecioMax] = useState(2000);
  const [aerolineas, setAerolineas] = useState([]);
  const [aerolineaSeleccionada, setAerolineaSeleccionada] = useState('');

  // 💳 ESTADOS PARA LA PASARELA DE PAGO
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [pagoCompletado, setPagoCompletado] = useState(false);
  const [datosTarjeta, setDatosTarjeta] = useState({
    nombre: '',
    numero: '',
    caducidad: '',
    cvv: '',
  });
  const [erroresTarjeta, setErroresTarjeta] = useState({});

  // 1. Cargar datos iniciales
  const cargarAerolineas = async () => {
    try {
      const res = await api.get('/aerolineas/');
      setAerolineas(res.data);
    } catch (err) {
      console.error("Error cargando aerolíneas:", err);
    }
  };

  const cargarVuelos = async () => {
    try {
      const res = await api.get('/vuelos/', {
        params: {
          origen: filtroOrigen || undefined,
          destino: filtroDestino || undefined
        }
      });

      const resultadosFiltrados = res.data.filter(vuelo => {
        const cumplePrecio = Number(vuelo.precio) <= precioMax;
        const nombreVuelo = vuelo.aerolineas?.nombre || ''; 
        const cumpleAerolinea = aerolineaSeleccionada === '' || nombreVuelo === aerolineaSeleccionada;
        return cumplePrecio && cumpleAerolinea;
      });

      setVuelos(resultadosFiltrados);
    } catch (err) {
      console.error("Error cargando vuelos:", err);
      toast.error("No se pudieron actualizar los vuelos");
    } finally {
      setCargando(false);
    }
  };

  // 2. Lógica del Selector de Asientos
  const abrirSelectorAsientos = async (vuelo) => {
    if (!perfil) {
      toast.error("Debes iniciar sesión para reservar");
      return;
    }
    setVueloSeleccionado(vuelo);
    setAsientoElegido(null);
    
    try {
      const res = await api.get(`/reservas/ocupados/${vuelo.id}`);
      setAsientosOcupados(res.data);
      setModalAbierto(true);
    } catch {
      toast.error("Error al obtener la disponibilidad de asientos");
    }
  };

  // 💳 Abrir pasarela de pago (sustituye al antiguo confirmarReserva directo)
  const abrirPasarelaPago = () => {
    if (!asientoElegido) {
      toast.error("Por favor, selecciona un asiento primero");
      return;
    }
    setModalAbierto(false);
    setDatosTarjeta({ nombre: '', numero: '', caducidad: '', cvv: '' });
    setErroresTarjeta({});
    setPagoCompletado(false);
    setModalPagoAbierto(true);
  };

  // 💳 Validación del formulario de pago
  const validarTarjeta = () => {
    const errores = {};
    const numeroLimpio = datosTarjeta.numero.replace(/\s/g, '');

    if (!datosTarjeta.nombre.trim()) errores.nombre = "Introduce el nombre del titular";
    if (numeroLimpio.length !== 16) errores.numero = "El número debe tener 16 dígitos";
    if (!/^\d{2}\/\d{2}$/.test(datosTarjeta.caducidad)) errores.caducidad = "Formato MM/AA";
    if (datosTarjeta.cvv.length < 3) errores.cvv = "CVV inválido";

    setErroresTarjeta(errores);
    return Object.keys(errores).length === 0;
  };

  // 💳 Simular pago y confirmar reserva
  const procesarPago = async () => {
    if (!validarTarjeta()) return;

    setProcesandoPago(true);

    // Simulamos un delay de procesamiento bancario (1.5s)
    await new Promise(res => setTimeout(res, 1500));

    try {
      await api.post('/reservas/', {
        vuelo_id: vueloSeleccionado.id,
        asiento: asientoElegido
      });

      setPagoCompletado(true);
      cargarVuelos();

    } catch (err) {
      toast.error(`Error: ${err.response?.data?.detail || "No se pudo realizar la reserva"}`);
      setModalPagoAbierto(false);
    } finally {
      setProcesandoPago(false);
    }
  };

  const cerrarModalPago = () => {
    setModalPagoAbierto(false);
    setPagoCompletado(false);
    setDatosTarjeta({ nombre: '', numero: '', caducidad: '', cvv: '' });
  };

  useEffect(() => {
    const inicializar = async () => {
      await Promise.all([cargarVuelos(), cargarAerolineas()]);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("perfiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setPerfil(data);
      }
    };
    inicializar();
  }, []);

  if (cargando) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50">
        <div className="animate-bounce text-6xl mb-4">🛫</div>
        <p className="text-slate-500 font-black uppercase tracking-tighter">Preparando motores SkyFlow...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* HEADER */}
      <header className="mb-10 text-center shrink-0">
        <h1 className="text-6xl font-black text-slate-800 tracking-tighter mb-2 italic">
          Sky<span className="text-blue-600">Flow</span>
        </h1>
        <p className="text-slate-500 text-lg font-medium tracking-tight">Vuela más alto, paga menos</p>
      </header>

      {/* BUSCADOR */}
      <Buscador 
        filtroOrigen={filtroOrigen}
        setFiltroOrigen={setFiltroOrigen}
        filtroDestino={filtroDestino}
        setFiltroDestino={setFiltroDestino}
        precioMax={precioMax}
        setPrecioMax={setPrecioMax}
        aerolineas={aerolineas}
        aerolineaSeleccionada={aerolineaSeleccionada}
        setAerolineaSeleccionada={setAerolineaSeleccionada}
        onBuscar={cargarVuelos}
        onLimpiar={() => {
          setFiltroOrigen('');
          setFiltroDestino('');
          setPrecioMax(2000);
          setAerolineaSeleccionada('');
          cargarVuelos();
        }}
      />
      
      {/* GRID DE VUELOS */}
      <section className="max-w-6xl mx-auto mt-12">
        {vuelos.length === 0 ? (
          <div className="text-center p-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold uppercase italic">No se han encontrado vuelos con estos filtros</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vuelos.map((vuelo) => (
              <VueloCard 
                key={vuelo.id} 
                vuelo={vuelo} 
                perfil={perfil} 
                onReservar={() => abrirSelectorAsientos(vuelo)} 
              />
            ))}
          </div>
        )}
      </section>

      {/* MODAL DEL MAPA DE ASIENTOS — intacto */}
      {modalAbierto && vueloSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-[300px] shadow-2xl flex flex-col h-full max-h-[80vh] overflow-hidden animate-in zoom-in duration-200">
            
            {/* Header Fijo */}
            <div className="p-4 border-b flex justify-between items-center bg-white shrink-0">
              <div>
                <h2 className="text-sm font-black text-slate-800">Seleccionar Asiento</h2>
                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">
                  {vueloSeleccionado.origen} — {vueloSeleccionado.destino}
                </p>
              </div>
              <button onClick={() => setModalAbierto(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={18} />
              </button>
            </div>

            {/* CUERPO */}
            <div className="flex-1 overflow-y-auto bg-slate-50 flex justify-center items-start min-h-0 custom-scrollbar">
              <MapaAsientos 
                ocupados={asientosOcupados}
                seleccionado={asientoElegido}
                alSeleccionar={setAsientoElegido}
              />
            </div>

            {/* Footer Fijo — abre la pasarela de pago */}
            <div className="p-4 bg-white border-t shrink-0">
              <button 
                onClick={abrirPasarelaPago}
                disabled={!asientoElegido}
                className={`w-full py-3 rounded-xl font-black text-[10px] tracking-widest transition-all shadow-lg ${
                  asientoElegido 
                  ? 'bg-blue-600 text-white shadow-blue-100' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {asientoElegido ? `CONTINUAR AL PAGO →` : 'ELIJA SU ASIENTO'}
              </button>
              <p className="text-center text-[6px] text-slate-400 font-bold uppercase mt-2 tracking-widest">
                Transacción Segura SkyFlow
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 💳 MODAL DE PASARELA DE PAGO */}
      {modalPagoAbierto && vueloSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">

            {/* PANTALLA DE ÉXITO */}
            {pagoCompletado ? (
              <div className="p-10 flex flex-col items-center text-center gap-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={40} className="text-green-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-800">¡Pago completado!</h2>
                <p className="text-slate-500 text-sm">
                  Tu reserva del asiento <span className="font-black text-blue-600">{asientoElegido}</span> en el vuelo{' '}
                  <span className="font-black">{vueloSeleccionado.origen} → {vueloSeleccionado.destino}</span> ha sido confirmada.
                </p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Importe cobrado: {vueloSeleccionado.precio}€
                </p>
                <button
                  onClick={() => { cerrarModalPago(); navigate("/my-bookings"); }}
                  className="mt-2 w-full bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-700 transition-all tracking-widest text-sm"
                >
                  VER MIS RESERVAS
                </button>
              </div>
            ) : (
              <>
                {/* CABECERA */}
                <div className="bg-slate-900 px-6 py-5 flex justify-between items-center">
                  <div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Pago seguro</p>
                    <p className="text-white font-black text-lg">
                      {vueloSeleccionado.origen} → {vueloSeleccionado.destino}
                    </p>
                    <p className="text-blue-400 text-[10px] font-bold uppercase">
                      Asiento {asientoElegido} · {vueloSeleccionado.precio}€
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full">
                    <Lock size={10} className="text-green-400" />
                    <span className="text-green-400 text-[9px] font-black uppercase">SSL</span>
                  </div>
                </div>

                {/* FORMULARIO */}
                <div className="p-6 space-y-4">

                  {/* Icono tarjeta */}
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard size={18} className="text-blue-600" />
                    <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Datos de tarjeta</span>
                  </div>

                  {/* Nombre titular */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre del titular</label>
                    <input
                      type="text"
                      placeholder="JUAN GARCÍA"
                      value={datosTarjeta.nombre}
                      onChange={e => setDatosTarjeta(prev => ({ ...prev, nombre: e.target.value.toUpperCase() }))}
                      className={`w-full border rounded-xl p-3 mt-1 font-bold text-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${erroresTarjeta.nombre ? 'border-red-400' : 'border-slate-200'}`}
                    />
                    {erroresTarjeta.nombre && <p className="text-red-500 text-[10px] mt-1 font-bold">{erroresTarjeta.nombre}</p>}
                  </div>

                  {/* Número de tarjeta */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Número de tarjeta</label>
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      value={datosTarjeta.numero}
                      onChange={e => setDatosTarjeta(prev => ({ ...prev, numero: formatearTarjeta(e.target.value) }))}
                      className={`w-full border rounded-xl p-3 mt-1 font-mono font-bold text-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${erroresTarjeta.numero ? 'border-red-400' : 'border-slate-200'}`}
                    />
                    {erroresTarjeta.numero && <p className="text-red-500 text-[10px] mt-1 font-bold">{erroresTarjeta.numero}</p>}
                  </div>

                  {/* Caducidad y CVV */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Caducidad</label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        value={datosTarjeta.caducidad}
                        onChange={e => setDatosTarjeta(prev => ({ ...prev, caducidad: formatearCaducidad(e.target.value) }))}
                        className={`w-full border rounded-xl p-3 mt-1 font-mono font-bold text-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${erroresTarjeta.caducidad ? 'border-red-400' : 'border-slate-200'}`}
                      />
                      {erroresTarjeta.caducidad && <p className="text-red-500 text-[10px] mt-1 font-bold">{erroresTarjeta.caducidad}</p>}
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        value={datosTarjeta.cvv}
                        onChange={e => setDatosTarjeta(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        className={`w-full border rounded-xl p-3 mt-1 font-mono font-bold text-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${erroresTarjeta.cvv ? 'border-red-400' : 'border-slate-200'}`}
                      />
                      {erroresTarjeta.cvv && <p className="text-red-500 text-[10px] mt-1 font-bold">{erroresTarjeta.cvv}</p>}
                    </div>
                  </div>

                  {/* Nota simulación */}
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center bg-slate-50 rounded-xl p-2">
                    🧪 Entorno de pruebas — ningún cobro real se realizará
                  </p>

                  {/* Botones */}
                  <button
                    onClick={procesarPago}
                    disabled={procesandoPago}
                    className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 tracking-widest text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {procesandoPago ? (
                      <span className="flex items-center justify-center gap-2">
                        <Plane size={14} className="animate-bounce" /> PROCESANDO PAGO...
                      </span>
                    ) : (
                      `PAGAR ${vueloSeleccionado.precio}€`
                    )}
                  </button>

                  <button
                    onClick={() => { setModalPagoAbierto(false); setModalAbierto(true); }}
                    className="w-full text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors py-2"
                  >
                    ← Volver a selección de asiento
                  </button>
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