import { useState } from 'react';
import api from '../api/api';

const FormularioAerolinea = ({ onAerolineaCreada }) => {
  const [nuevaAerolinea, setNuevaAerolinea] = useState({
    nombre: '',
    codigo_iata: '',
    pais: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Usamos la misma instancia api que usan tus compañeros
      await api.post('/aerolineas/', nuevaAerolinea);
      alert("¡Aerolínea registrada con éxito!");
      
      // Limpiamos el formulario tras guardar
      setNuevaAerolinea({ nombre: '', codigo_iata: '', pais: '' });
      
      // Si el componente padre necesita actualizar algo, le avisamos
      if (onAerolineaCreada) onAerolineaCreada();
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || "Error en el servidor"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase">Nombre</label>
        <input 
          type="text" 
          value={nuevaAerolinea.nombre} 
          onChange={(e) => setNuevaAerolinea({...nuevaAerolinea, nombre: e.target.value})} 
          className="w-full border rounded-md p-2 mt-1" 
          required 
          placeholder="Ej. Iberia" 
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase">Código IATA</label>
        <input 
          type="text" 
          value={nuevaAerolinea.codigo_iata} 
          onChange={(e) => setNuevaAerolinea({...nuevaAerolinea, codigo_iata: e.target.value})} 
          className="w-full border rounded-md p-2 mt-1" 
          required 
          maxLength="3" 
          placeholder="Ej. IBE" 
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase">País</label>
        <input 
          type="text" 
          value={nuevaAerolinea.pais} 
          onChange={(e) => setNuevaAerolinea({...nuevaAerolinea, pais: e.target.value})} 
          className="w-full border rounded-md p-2 mt-1" 
          required 
          placeholder="Ej. España" 
        />
      </div>
      <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-all shadow-sm h-[42px]">
        Añadir Aerolínea
      </button>
    </form>
  );
};

export default FormularioAerolinea;