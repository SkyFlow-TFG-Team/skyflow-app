import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Header from "./components/Header";
import Vuelos from "./pages/vuelos";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  useEffect(() => {
    // 🛡️ Limpieza al inicio: Cierra sesión en Supabase y borra el token local
    const limpiarSesionAlEntrar = async () => {
      await supabase.auth.signOut();
      localStorage.removeItem("token");
    };
    limpiarSesionAlEntrar();
  }, []);

  return (
    <Router>
      <Header />
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<Vuelos />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;