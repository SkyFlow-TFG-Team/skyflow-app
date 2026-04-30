import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const tId = toast.loading("Verificando credenciales...");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error("Error: " + error.message, { id: tId });
      return;
    }

    if (data.session) {
      localStorage.setItem("token", data.session.access_token);
      toast.success("¡Bienvenido de nuevo! 🛫", { id: tId });
      navigate('/'); 
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-md w-80 border border-slate-200">
        <h2 className="text-xl font-bold mb-4 text-center">Iniciar Sesión</h2>
        <input type="email" placeholder="Email" className="w-full mb-3 p-2 border rounded" onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" className="w-full mb-3 p-2 border rounded" onChange={(e) => setPassword(e.target.value)} required />
        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition">Entrar</button>
      </form>
    </div>
  );
};

export default Login;