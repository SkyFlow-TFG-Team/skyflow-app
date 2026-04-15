import { useEffect, useState } from 'react';
import api from '../api/api';

const Vuelos = () => {
  const [vuelos, setVuelos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/vuelos')
      .then(res => {
        setVuelos(res.data);
        setCargando(false);
      })
      .catch(err => {
        console.error("Error al conectar con la torre de control:", err);
        setCargando(false);
      });
  }, []);

  if (cargando) return <div className="p-10 text-center">Cargando vuelos...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-800">Panel de Control SkyFlow</h1>
        <p className="text-slate-500">Monitorización de vuelos en tiempo real</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vuelos.map((vuelo) => (
          <div key={vuelo.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow">
            <div className="bg-slate-800 p-4 text-white flex justify-between">
              <span className="font-mono font-bold">{vuelo.numero_vuelo}</span>
              <span className="text-xs bg-blue-500 px-2 py-1 rounded text-white uppercase">Activo</span>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{vuelo.origen}</p>
                  <p className="text-xs text-slate-400 uppercase">Salida</p>
                </div>
                <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-4 relative">
                  <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-2">✈️</span>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{vuelo.destino}</p>
                  <p className="text-xs text-slate-400 uppercase">Llegada</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-50 flex justify-between text-sm">
                <span className="text-slate-500">Compañía: <span className="text-slate-800 font-semibold">{vuelo.aerolinea_id}</span></span>
                <span className="text-blue-600 font-bold">{vuelo.precio}€</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Vuelos;