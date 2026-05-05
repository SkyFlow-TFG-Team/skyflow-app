import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import api from "../api/api";
import QRCode from "qrcode";
import toast from "react-hot-toast";

export default function BoardingPass() {
  const { reservaId } = useParams();
  const navigate = useNavigate();
  const [reserva, setReserva] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Cargar todas las reservas y filtrar la que coincide
        const { data: reservasData } = await api.get("/reservas/mis-reservas");
        const reservaEncontrada = reservasData?.find(r => r.id === reservaId);

        if (!reservaEncontrada) {
          toast.error("Reserva no encontrada");
          navigate("/my-bookings");
          return;
        }

        setReserva(reservaEncontrada);

        // Cargar perfil del usuario
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: perfilData } = await supabase
            .from("perfiles")
            .select("*")
            .eq("id", user.id)
            .single();
          setPerfil(perfilData);
        }

        // Generar QR
        const qrData = `SkyFlow|Reserva:${reservaEncontrada.id}|Asiento:${reservaEncontrada.asiento || "S/N"}|Vuelo:${reservaEncontrada.vuelos?.origen}-${reservaEncontrada.vuelos?.destino}`;
        const url = await QRCode.toDataURL(qrData, { width: 200, margin: 1 });
        setQrUrl(url);

      } catch (err) {
        console.error("Error al cargar boarding pass:", err);
        toast.error("Error al cargar la tarjeta de embarque");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [reservaId, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-100">
        <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest">Preparando tu tarjeta...</p>
      </div>
    );
  }

  if (!reserva) return null;

  const vuelo = reserva.vuelos;
  const nombrePasajero = `${perfil?.nombre || ""} ${perfil?.apellidos || ""}`.trim() || "Pasajero SkyFlow";
  const asiento = reserva.asiento || "S/N";
  const fechaSalida = vuelo?.fecha_salida ? new Date(vuelo.fecha_salida) : null;
  const fechaFormateada = fechaSalida
    ? fechaSalida.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
  const horaFormateada = fechaSalida
    ? fechaSalida.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">

      {/* Botón volver */}
      <button
        onClick={() => navigate("/my-bookings")}
        className="mb-6 text-sm text-slate-500 hover:text-slate-800 font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
      >
        ← Volver a Mis Reservas
      </button>

      {/* TARJETA DE EMBARQUE */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* CABECERA AZUL */}
        <div className="bg-blue-600 px-8 py-6 flex justify-between items-center">
          <div>
            <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest">Boarding Pass</p>
            <p className="text-white text-2xl font-black tracking-tight">SkyFlow ✈️</p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest">Estado</p>
            <span className="bg-green-400 text-green-900 text-[10px] font-black px-3 py-1 rounded-full uppercase">
              Confirmado
            </span>
          </div>
        </div>

        {/* RUTA PRINCIPAL */}
        <div className="px-8 py-6 flex items-center justify-between border-b border-dashed border-slate-200">
          <div className="text-center">
            <p className="text-4xl font-black text-slate-800 tracking-tighter">{vuelo?.origen}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Origen</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <div className="w-8 h-[2px] bg-slate-300" />
              <span className="text-xl">✈️</span>
              <div className="w-8 h-[2px] bg-slate-300" />
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase">{vuelo?.aerolineas?.nombre || "—"}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-black text-slate-800 tracking-tighter">{vuelo?.destino}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Destino</p>
          </div>
        </div>

        {/* DATOS DEL PASAJERO Y VUELO */}
        <div className="px-8 py-5 grid grid-cols-2 gap-4 border-b border-dashed border-slate-200">
          <div>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Pasajero</p>
            <p className="text-sm font-black text-slate-800 uppercase mt-1">{nombrePasajero}</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Asiento</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{asiento}</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Fecha</p>
            <p className="text-sm font-black text-slate-800 uppercase mt-1">{fechaFormateada}</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Hora</p>
            <p className="text-sm font-black text-slate-800 mt-1">{horaFormateada}</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Precio</p>
            <p className="text-sm font-black text-slate-800 mt-1">{vuelo?.precio}€</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">ID Reserva</p>
            <p className="text-[10px] font-mono text-slate-500 mt-1">{reserva.id?.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* ZONA PERFORADA + QR */}
        <div className="relative px-8 py-6 flex items-center justify-between bg-slate-50">
          {/* Círculos de perforación izq/der */}
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-100 rounded-full border border-slate-200" />
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-100 rounded-full border border-slate-200" />

          <div>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Escanea para embarcar</p>
            <p className="text-[10px] text-slate-500 font-medium max-w-[160px]">
              Muestra este código en el aeropuerto
            </p>
          </div>

          {qrUrl && (
            <img src={qrUrl} alt="QR de embarque" className="w-24 h-24 rounded-xl" />
          )}
        </div>

        {/* PIE */}
        <div className="bg-blue-600 px-8 py-3 text-center">
          <p className="text-blue-200 text-[9px] font-bold uppercase tracking-widest">
            Gracias por volar con SkyFlow · Buen viaje 🌍
          </p>
        </div>
      </div>

      {/* Instrucciones móvil */}
      <p className="mt-6 text-xs text-slate-400 text-center max-w-xs">
        Puedes hacer una captura de pantalla o descargar el PDF desde "Mis Reservas" para llevarlo sin conexión.
      </p>
    </div>
  );
}