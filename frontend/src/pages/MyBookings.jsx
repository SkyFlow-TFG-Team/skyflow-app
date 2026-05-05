import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { supabase } from "../supabaseClient";
import { Calendar, Banknote, Download, Armchair, Plane, XCircle, QrCode } from "lucide-react";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const navigate = useNavigate();

  // Función para verificar si el vuelo es cancelable (más de 72h)
  const puedeCancelar = (fechaStr) => {
    if (!fechaStr) return false;
    const ahora = new Date();
    const fechaVuelo = new Date(fechaStr);
    if (isNaN(fechaVuelo.getTime())) return false;
    return (fechaVuelo - ahora) / (1000 * 60 * 60) > 72;
  };

  const loadData = async () => {
    try {
      const { data: reservasData } = await api.get("/reservas/mis-reservas");
      setBookings(reservasData || []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: perfilData } = await supabase
          .from("perfiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setPerfil(perfilData);
      }
    } catch (err) {
      console.error("Error al cargar datos:", err);
      if (err.response?.status === 401) {
        toast.error("Sesión caducada. Por favor, vuelve a entrar.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const cancelarReserva = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar esta reserva?")) return;
    const toastId = toast.loading("Cancelando...");
    try {
      await api.delete(`/reservas/${id}`);
      toast.success("Reserva eliminada con éxito", { id: toastId });
      setBookings((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Error al cancelar la reserva", { id: toastId });
    }
  };

  // Generador de PDF corregido para ESLint (sin async en el executor)
  const generarPDF = (reserva, vuelo) => {
    return new Promise((resolve, reject) => {
      const crearDocumento = async () => {
        try {
          const doc = new jsPDF();
          const nombrePasajero = perfil?.nombre || "Pasajero SkyFlow";
          const numAsiento = reserva?.asiento || "S/N";
          
          const qrData = `SkyFlow|Reserva:${reserva?.id}|Asiento:${numAsiento}|Vuelo:${vuelo?.origen}-${vuelo?.destino}`;
          const qrImage = await QRCode.toDataURL(qrData);

          // Cabecera Estilo Boarding Pass
          doc.setFillColor(37, 99, 235);
          doc.rect(0, 0, 210, 40, 'F');
          doc.setFont("helvetica", "bold");
          doc.setFontSize(30);
          doc.setTextColor(255, 255, 255);
          doc.text("SkyFlow", 20, 28);
          doc.setFontSize(10);
          doc.text("BOARDING PASS / TARJETA DE EMBARQUE", 130, 26);

          // Información del Pasajero
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(10);
          doc.text("PASAJERO / PASSENGER", 20, 55);
          doc.setFontSize(16);
          doc.text(nombrePasajero.toUpperCase(), 20, 65);

          // Información del Vuelo
          doc.setFontSize(10);
          doc.text("VUELO / FLIGHT", 20, 80);
          doc.setFontSize(16);
          doc.text(`${vuelo?.origen || '---'} > ${vuelo?.destino || '---'}`, 20, 90);

          // Recuadro del Asiento Destacado
          doc.setFillColor(241, 245, 249);
          doc.roundedRect(140, 50, 50, 40, 5, 5, 'F');
          doc.setTextColor(37, 99, 235);
          doc.setFontSize(10);
          doc.text("ASIENTO / SEAT", 145, 60);
          doc.setFontSize(24);
          doc.text(numAsiento, 145, 82);

          // Fecha y QR
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(9);
          doc.text("FECHA Y HORA / DATE AND TIME", 20, 115);
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(12);
          const fecha = vuelo?.fecha_salida 
            ? new Date(vuelo.fecha_salida).toLocaleString('es-ES') 
            : 'No definida';
          doc.text(fecha, 20, 125);

          doc.addImage(qrImage, 'PNG', 140, 100, 45, 45);

          doc.save(`Billete_SkyFlow_${numAsiento}.pdf`);
          resolve();
        } catch (error) {
          console.error("Error PDF:", error);
          reject(error);
        }
      };
      crearDocumento();
    });
  };

  const handleDescargar = (reserva, vuelo) => {
    toast.promise(generarPDF(reserva, vuelo), {
      loading: 'Generando billete...',
      success: '¡Billete descargado! ✈️',
      error: 'Error al generar el PDF',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <p className="text-slate-400 font-bold animate-pulse">CARGANDO TUS VUELOS...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-slate-800 italic tracking-tighter">
          Mis <span className="text-blue-600">Reservas</span>
        </h1>
        <p className="text-slate-500 font-medium">Gestiona tus billetes y próximos viajes</p>
      </header>

      <div className="space-y-6">
        {bookings.length === 0 ? (
          <div className="bg-white p-16 rounded-[40px] border-2 border-dashed border-slate-200 text-center">
            <p className="text-slate-400 font-bold uppercase italic">Aún no tienes ninguna reserva</p>
          </div>
        ) : (
          bookings.map((r) => {
            const vuelo = r.vuelos;
            if (!vuelo) return null;

            return (
              <div key={r.id} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-all">
                {/* LADO IZQUIERDO: INFORMACIÓN */}
                <div className="p-8 flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-black px-3 py-1 bg-green-100 text-green-600 rounded-full uppercase italic">
                      Confirmado
                    </span>
                    
                    {/* Badge de Asiento Resaltado */}
                    <div className="flex items-center gap-1.5 bg-blue-600 px-3 py-1.5 rounded-xl shadow-lg shadow-blue-100">
                      <Armchair size={14} className="text-white" />
                      <span className="text-[11px] font-black text-white uppercase">
                        {r.asiento ? `Asiento ${r.asiento}` : 'No asignado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter">{vuelo.origen}</h2>
                    <div className="flex-1 h-[2px] bg-slate-100 relative">
                      <Plane size={16} className="absolute -top-2 left-1/2 -translate-x-1/2 text-blue-500 rotate-90" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter">{vuelo.destino}</h2>
                  </div>

                  <div className="flex gap-6 mt-6 pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">
                      <Calendar size={14} className="text-blue-500" />
                      {new Date(vuelo.fecha_salida).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">
                      <Banknote size={14} className="text-blue-500" />
                      {vuelo.precio}€
                    </div>
                  </div>
                </div>

                {/* LADO DERECHO: ACCIONES */}
                <div className="bg-slate-50/50 p-6 flex flex-col justify-center items-center gap-3 md:border-l border-slate-100 min-w-[200px]">
                  
                  {/* 🆕 BOTÓN BOARDING PASS DIGITAL */}
                  <button
                    onClick={() => navigate(`/boarding-pass/${r.id}`)}
                    className="bg-blue-600 text-white w-40 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                  >
                    <QrCode size={14} /> Boarding Pass
                  </button>

                  <button
                    onClick={() => handleDescargar(r, vuelo)}
                    className="bg-slate-900 text-white w-40 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                  >
                    <Download size={14} /> Billete PDF
                  </button>

                  {puedeCancelar(vuelo.fecha_salida) ? (
                    <button
                      onClick={() => cancelarReserva(r.id)}
                      className="text-red-500 font-bold text-[10px] uppercase tracking-widest hover:text-red-700 transition-colors py-2 flex items-center gap-1"
                    >
                      <XCircle size={12} /> Cancelar Reserva
                    </button>
                  ) : (
                    <span className="text-[9px] font-black text-slate-400 uppercase">🔒 No cancelable</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}