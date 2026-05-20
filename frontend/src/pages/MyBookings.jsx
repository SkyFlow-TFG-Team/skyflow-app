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

  const generarPDF = (reserva, vuelo) => {
    return new Promise((resolve, reject) => {
      const crearDocumento = async () => {
        try {
          const doc = new jsPDF();
          const nombrePasajero = perfil?.nombre || "Pasajero SkyFlow";
          const numAsiento = reserva?.asiento || "S/N";

          const qrData = `SkyFlow|Reserva:${reserva?.id}|Asiento:${numAsiento}|Vuelo:${vuelo?.origen}-${vuelo?.destino}`;
          const qrImage = await QRCode.toDataURL(qrData);

          // Cabecera PDF
          doc.setFillColor(37, 99, 235);
          doc.rect(0, 0, 210, 40, 'F');
          doc.setFont("helvetica", "bold");
          doc.setFontSize(30);
          doc.setTextColor(255, 255, 255);
          doc.text("SkyFlow", 20, 28);

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
          doc.text(`${vuelo?.origen} > ${vuelo?.destino}`, 20, 90);

          // Asiento
          doc.setFillColor(241, 245, 249);
          doc.roundedRect(140, 50, 50, 40, 5, 5, 'F');
          doc.setTextColor(37, 99, 235);
          doc.text("ASIENTO", 145, 60);
          doc.setFontSize(24);
          doc.text(numAsiento, 145, 82);

          doc.addImage(qrImage, 'PNG', 140, 100, 45, 45);
          doc.save(`Billete_SkyFlow_${numAsiento}.pdf`);
          resolve();
        } catch (error) { reject(error); }
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
      <div className="flex justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        <p className="text-slate-400 dark:text-slate-500 font-bold animate-pulse uppercase tracking-widest">Cargando tus vuelos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 transition-colors">
      <header className="mb-10 text-left">
        <h1 className="text-4xl font-black text-slate-800 dark:text-white italic tracking-tighter">
          Mis <span className="text-blue-600 dark:text-blue-500">Reservas</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Gestiona tus billetes y próximos viajes</p>
      </header>

      <div className="space-y-6">
        {bookings.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-16 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center transition-colors">
            <p className="text-slate-400 dark:text-slate-600 font-bold uppercase italic">Aún no tienes ninguna reserva</p>
          </div>
        ) : (
          bookings.map((r) => {
            const vuelo = r.vuelos;
            if (!vuelo) return null;

            return (
              <div key={r.id} className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row hover:shadow-md dark:hover:border-slate-700 transition-all duration-300">

                <div className="p-8 flex-1 text-left">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-black px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full uppercase italic">
                      Confirmado
                    </span>

                    <div className="flex items-center gap-1.5 bg-blue-600 dark:bg-blue-500 px-3 py-1.5 rounded-xl shadow-lg dark:shadow-none">
                      <Armchair size={14} className="text-white" />
                      <span className="text-[11px] font-black text-white uppercase">
                        {r.asiento ? `Asiento ${r.asiento}` : 'No asignado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{vuelo.origen}</h2>
                    <div className="flex-1 h-[2px] bg-slate-100 dark:bg-slate-800 relative">
                      <Plane size={16} className="absolute -top-2 left-1/2 -translate-x-1/2 text-blue-500 rotate-90" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{vuelo.destino}</h2>
                  </div>

                  <div className="flex gap-6 mt-6 pt-6 border-t border-slate-50 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase">
                      <Calendar size={14} className="text-blue-500" />
                      {new Date(vuelo.fecha_salida).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase">
                      <Banknote size={14} className="text-blue-500" />
                      {vuelo.precio}€
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-800/40 p-6 flex flex-col justify-center items-center gap-3 md:border-l border-slate-100 dark:border-slate-800 min-w-[220px]">
                  <button
                    onClick={() => navigate(`/boarding-pass/${r.id}`)}
                    className="bg-blue-600 dark:bg-blue-500 text-white w-44 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 dark:shadow-none"
                  >
                    <QrCode size={14} /> Boarding Pass
                  </button>

                  <button
                    onClick={() => handleDescargar(r, vuelo)}
                    className="bg-slate-900 dark:bg-slate-700 text-white w-44 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={14} /> Billete PDF
                  </button>

                  {puedeCancelar(vuelo.fecha_salida) ? (
                    <button
                      onClick={() => cancelarReserva(r.id)}
                      className="text-red-500 dark:text-red-400 font-bold text-[10px] uppercase tracking-widest hover:text-red-700 transition-colors py-2 flex items-center gap-1"
                    >
                      <XCircle size={12} /> Cancelar Reserva
                    </button>
                  ) : (
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase mt-2">🔒 No cancelable</span>
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