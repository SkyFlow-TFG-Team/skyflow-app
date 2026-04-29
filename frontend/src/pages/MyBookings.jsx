import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/api";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { supabase } from "../supabaseClient";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);

  // 🔹 Función para saber si se puede cancelar (más de 72h antes de la salida)
  const puedeCancelar = (fechaStr) => {
    if (!fechaStr) return false;
    const ahora = new Date();
    const fechaVuelo = new Date(fechaStr);

    if (isNaN(fechaVuelo.getTime())) return false;

    const diffMs = fechaVuelo - ahora;
    const diffHoras = diffMs / (1000 * 60 * 60);

    return diffHoras > 72;
  };

  // 🔹 Cargar reservas desde el Backend y Perfil
  const loadData = async () => {
    try {
      const { data: reservasData } = await api.get("/reservas/mis-reservas");
      setBookings(reservasData);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: perfilData } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
        setPerfil(perfilData);
      }
    } catch (err) {
      console.error("Error cargando reservas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🔹 Función para cancelar la reserva
  const cancelarReserva = async (id) => {
    if (!window.confirm("¿Seguro que quieres cancelar esta reserva?")) return;
    const toastId = toast.loading("Cancelando reserva...");

    try {
      await api.delete(`/reservas/${id}`);
      
      toast.success("Reserva cancelada correctamente. Se ha liberado la plaza.", { id: toastId });
      
      setBookings(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Error al cancelar:", err);
      const mensajeError = err.response?.data?.detail || "No se pudo cancelar la reserva.";
      toast.error(mensajeError, { id: toastId });
    }
  };

  // 🪄 TAREA C: MAGIA DE GENERACIÓN DE PDF (Corregido)
  const generarPDF = async (reserva, vuelo) => {
    return new Promise(async (resolve, reject) => {
      try {
        const nombrePasajero = perfil?.nombre || "Pasajero Autorizado";
        
        // 1. Generar el Código QR (con texto seguro)
        const qrData = `SkyFlow | Reserva: ${reserva.id} | Pasajero: ${nombrePasajero} | Vuelo: ${vuelo.origen}-${vuelo.destino}`;
        const qrImage = await QRCode.toDataURL(qrData);

        // 2. Crear el documento PDF
        const doc = new jsPDF();

        // 3. Diseño del billete
        doc.setFont("helvetica", "bold");
        doc.setFontSize(28);
        doc.setTextColor(37, 99, 235); // Azul corporate
        doc.text("SkyFlow", 20, 30);

        doc.setFontSize(14);
        doc.setTextColor(100, 116, 139); // Gris
        doc.text("TARJETA DE EMBARQUE / BOARDING PASS", 20, 40);

        doc.setLineWidth(0.5);
        doc.line(20, 45, 190, 45);

        doc.setTextColor(15, 23, 42); // slate-900
        doc.setFontSize(12);
        
        doc.setFont("helvetica", "bold");
        doc.text("PASAJERO / PASSENGER:", 20, 60);
        doc.setFont("helvetica", "normal");
        doc.text(nombrePasajero.toUpperCase(), 20, 67);

        doc.setFont("helvetica", "bold");
        doc.text("ID RESERVA / BOOKING ID:", 20, 80);
        doc.setFont("helvetica", "normal");
        doc.text(reserva.id, 20, 87);

        doc.setFont("helvetica", "bold");
        doc.text("AEROLÍNEA / AIRLINE:", 20, 100);
        doc.setFont("helvetica", "normal");
        const aerolineaNombre = vuelo.aerolineas?.nombre || "SkyFlow Airlines";
        doc.text(aerolineaNombre, 20, 107);

        // Solución: Guion en lugar de emoji para que no pete jsPDF
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(37, 99, 235);
        doc.text(`${vuelo.origen} - ${vuelo.destino}`, 20, 130);

        // Fecha
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        const fechaFormateada = new Date(vuelo.fecha_salida).toLocaleString('es-ES');
        doc.text(`FECHA / DATE: ${fechaFormateada}`, 20, 140);

        // Imprimir el Código QR
        doc.addImage(qrImage, 'PNG', 130, 60, 50, 50);

        // Guardar el PDF
        doc.save(`SkyFlow_Billete_${vuelo.origen}-${vuelo.destino}.pdf`);
        
        setTimeout(() => resolve(), 600); 

      } catch (error) {
        console.error("Error generando PDF:", error);
        reject("Error al generar el documento");
      }
    });
  };

  const handleDescargar = (reserva, vuelo) => {
    toast.promise(
      generarPDF(reserva, vuelo),
      {
        loading: 'Generando billete PDF...',
        success: '¡Billete descargado con éxito! ✈️',
        error: 'No se pudo generar el billete.',
      }
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl font-semibold text-slate-600 animate-pulse">Consultando tus viajes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-800">
          Mis <span className="text-blue-600">Reservas</span>
        </h1>
        <p className="text-slate-500 text-sm">Gestiona tus próximos vuelos y descarga tus billetes</p>
      </header>

      {bookings.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center">
          <p className="text-slate-400 font-medium">No tienes ninguna reserva activa en este momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((r) => {
            const vuelo = r.vuelos; 

            return (
              <div 
                key={r.id} 
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center hover:shadow-md transition-all"
              >
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg uppercase tracking-wider">
                      Confirmado
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID RES: {r.id.slice(0, 8)}</span>
                  </div>

                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    {vuelo?.origen} 
                    <span className="text-blue-500 text-base">✈️</span> 
                    {vuelo?.destino}
                  </h2>

                  <div className="flex flex-wrap gap-4 mt-3">
                    <div className="flex items-center gap-1 text-slate-500 text-sm">
                      <span>📅</span>
                      {vuelo?.fecha_salida 
                        ? new Date(vuelo.fecha_salida).toLocaleString('es-ES', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) 
                        : "Fecha no definida"}
                    </div>
                    <div className="flex items-center gap-1 text-slate-700 text-sm font-bold">
                      <span>💰</span> {vuelo?.precio}€
                    </div>
                  </div>
                </div>

                <div className="mt-6 md:mt-0 w-full md:w-auto flex flex-col gap-3 items-center md:items-end">
                  
                  <button
                    onClick={() => handleDescargar(r, vuelo)}
                    className="w-full md:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm hover:bg-blue-700 hover:-translate-y-0.5 transition-all duration-300 flex justify-center items-center gap-2"
                  >
                    📥 Descargar Billete
                  </button>

                  {puedeCancelar(vuelo?.fecha_salida) ? (
                    <button
                      onClick={() => cancelarReserva(r.id)}
                      className="w-full md:w-auto bg-red-50 text-red-600 border border-red-100 px-6 py-2.5 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all duration-300"
                    >
                      Cancelar Reserva
                    </button>
                  ) : (
                    <div className="flex flex-col items-center md:items-end gap-1">
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                        🔒 NO CANCELABLE
                      </span>
                      <p className="text-[9px] text-slate-400">Faltan menos de 72h para el vuelo</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}