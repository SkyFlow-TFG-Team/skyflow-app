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
    const datosParaEnviar = {
      ...nuevoVuelo,
      precio: parseFloat(nuevoVuelo.precio),
      plazas_totales: parseInt(nuevoVuelo.plazas_totales),
      plazas_disponibles: parseInt(nuevoVuelo.plazas_disponibles)
    };

    try {
      await api.post('/vuelos/', datosParaEnviar);
      alert("¡Vuelo registrado!");
      setNuevoVuelo({ ...nuevoVuelo, origen: '', destino: '', precio: '', fecha_salida: '' });
      onVueloCreado();
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || "Error en el servidor"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md mb-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase">Origen</label>
        <input type="text" value={nuevoVuelo.origen} onChange={(e) => setNuevoVuelo({...nuevoVuelo, origen: e.target.value})} className="w-full border rounded-md p-2 mt-1" required />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase">Destino</label>
        <input type="text" value={nuevoVuelo.destino} onChange={(e) => setNuevoVuelo({...nuevoVuelo, destino: e.target.value})} className="w-full border rounded-md p-2 mt-1" required />
      </div>
      <div>
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
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase">Fecha</label>
        <input type="datetime-local" value={nuevoVuelo.fecha_salida} onChange={(e) => setNuevoVuelo({...nuevoVuelo, fecha_salida: e.target.value})} className="w-full border rounded-md p-2 mt-1" required />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase">Precio</label>
        <input type="number" value={nuevoVuelo.precio} onChange={(e) => setNuevoVuelo({...nuevoVuelo, precio: e.target.value})} className="w-full border rounded-md p-2 mt-1" required />
      </div>
      <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-all shadow-sm h-10-5px">
        Registrar
      </button>
    </form>
  );
};

export default FormularioVuelo;