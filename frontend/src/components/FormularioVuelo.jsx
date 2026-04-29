import { useState, useEffect } from 'react';
import api from '../api/api';

const FormularioVuelo = ({ onVueloCreado }) => {
  const [aerolineas, setAerolineas] = useState([]);
  const [nuevoVuelo, setNuevoVuelo] = useState({
    origen: '', 
    destino: '', 
    precio: '', 
    fecha_salida: '',
    plazas_totales: 150,
    plazas_disponibles: 150,
    aerolinea_id: '' 
  });

  // TAREA 2: Calculamos la fecha actual para bloquear fechas pasadas en el input
  // slice(0, 16) lo corta en el formato exacto que necesita 'datetime-local' (YYYY-MM-DDTHH:mm)
  const fechaMinima = new Date().toISOString().slice(0, 16);

  // CARGAR AEROLINEAS DESDE EL BACKEND
  useEffect(() => {
    api.get('/aerolineas')
      .then(res => {
        setAerolineas(res.data);
        if (res.data.length > 0) {
          setNuevoVuelo(prev => ({ ...prev, aerolinea_id: res.data[0].id }));
        }
      })
      .catch(err => console.error("Error al cargar aerolíneas:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convertimos los datos a números para poder hacer las validaciones matemáticas
    const precioFinal = parseFloat(nuevoVuelo.precio);
    const totalesFinal = parseInt(nuevoVuelo.plazas_totales);
    const disponiblesFinal = parseInt(nuevoVuelo.plazas_disponibles);

    // --- 🛡️ TAREA 2: BLINDAJE DE FORMULARIO (VALIDACIONES EN JAVASCRIPT) ---
    
    // 1. Impedir que el precio sea inferior a 1€
    if (precioFinal < 1) {
      alert("Error: El precio del vuelo debe ser al menos de 1€.");
      return; // El return detiene la función y evita que se mande a la base de datos
    }

    // 2. Asegurar que plazas disponibles no sea mayor que totales
    if (disponiblesFinal > totalesFinal) {
      alert(`Error: Las plazas disponibles (${disponiblesFinal}) no pueden superar a las totales (${totalesFinal}).`);
      return;
    }

    const datosParaEnviar = {
      ...nuevoVuelo,
      precio: precioFinal,
      plazas_totales: totalesFinal,
      plazas_disponibles: disponiblesFinal
    };

    try {
      await api.post('/vuelos/', datosParaEnviar);
      alert("¡Vuelo registrado!");
      
      // Limpiamos el formulario reseteando también las plazas por defecto
      setNuevoVuelo({ 
        ...nuevoVuelo, 
        origen: '', 
        destino: '', 
        precio: '', 
        fecha_salida: '',
        plazas_totales: 150,
        plazas_disponibles: 150
      });
      onVueloCreado();
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || "Error en el servidor"));
    }
  };

  return (
    // Hemos ajustado el grid a 8 columnas en pantallas grandes para acomodar las plazas
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md mb-8 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
      <div className="lg:col-span-1">
        <label className="block text-xs font-bold text-gray-500 uppercase">Origen</label>
        <input type="text" value={nuevoVuelo.origen} onChange={(e) => setNuevoVuelo({...nuevoVuelo, origen: e.target.value})} className="w-full border rounded-md p-2 mt-1" required />
      </div>
      
      <div className="lg:col-span-1">
        <label className="block text-xs font-bold text-gray-500 uppercase">Destino</label>
        <input type="text" value={nuevoVuelo.destino} onChange={(e) => setNuevoVuelo({...nuevoVuelo, destino: e.target.value})} className="w-full border rounded-md p-2 mt-1" required />
      </div>
      
      <div className="lg:col-span-1">
        <label className="block text-xs font-bold text-gray-500 uppercase">Aerolínea</label>
        <select 
          value={nuevoVuelo.aerolinea_id} 
          onChange={(e) => setNuevoVuelo({...nuevoVuelo, aerolinea_id: e.target.value})}
          className="w-full border rounded-md p-2 mt-1 bg-white"
        >
          {aerolineas.map(a => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
      </div>
      
      <div className="lg:col-span-2">
        <label className="block text-xs font-bold text-gray-500 uppercase">Fecha</label>
        {/* TAREA 2: Añadido min={fechaMinima} en el HTML para bloquear visualmente el calendario */}
        <input type="datetime-local" value={nuevoVuelo.fecha_salida} min={fechaMinima} onChange={(e) => setNuevoVuelo({...nuevoVuelo, fecha_salida: e.target.value})} className="w-full border rounded-md p-2 mt-1" required />
      </div>
      
      <div className="lg:col-span-1">
        <label className="block text-xs font-bold text-gray-500 uppercase">Precio (€)</label>
        {/* TAREA 2: Añadido min="1" y step="0.01" para permitir céntimos pero no negativos */}
        <input type="number" min="1" step="0.01" value={nuevoVuelo.precio} onChange={(e) => setNuevoVuelo({...nuevoVuelo, precio: e.target.value})} className="w-full border rounded-md p-2 mt-1" required />
      </div>

      <div className="lg:col-span-1">
        <label className="block text-xs font-bold text-gray-500 uppercase" title="Totales / Disponibles">Plazas</label>
        <div className="flex gap-1 mt-1">
          {/* Cajas para controlar las plazas y poder validarlas */}
          <input type="number" min="1" placeholder="Tot" title="Plazas Totales" value={nuevoVuelo.plazas_totales} onChange={(e) => setNuevoVuelo({...nuevoVuelo, plazas_totales: e.target.value})} className="w-1/2 border rounded-md p-2 text-xs" required />
          <input type="number" min="0" placeholder="Disp" title="Plazas Disponibles" value={nuevoVuelo.plazas_disponibles} onChange={(e) => setNuevoVuelo({...nuevoVuelo, plazas_disponibles: e.target.value})} className="w-1/2 border rounded-md p-2 text-xs" required />
        </div>
      </div>

      <div className="lg:col-span-1">
        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-2 rounded-md hover:bg-blue-700 transition-all shadow-sm h-[42px] text-sm">
          Registrar
        </button>
      </div>
    </form>
  );
};

export default FormularioVuelo;