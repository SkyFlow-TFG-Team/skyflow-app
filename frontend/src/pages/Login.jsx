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
    <div className="flex justify-center items-center min-h-[80vh] transition-colors duration-500">
      <form 
        onSubmit={handleLogin} 
        className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl w-96 border border-slate-200 dark:border-slate-800 transition-all"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter italic">
            Sky<span className="text-blue-600">Flow</span>
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">
            Iniciar Sesión
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest">Email</label>
            <input 
              type="email" 
              placeholder="tu@email.com" 
              className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest">Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button className="w-full bg-blue-600 text-white p-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 mt-4">
            Entrar al radar
          </button>
        </div>

        <p className="text-center mt-6 text-xs text-slate-400 dark:text-slate-500 font-medium">
          ¿No tienes cuenta? <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline" onClick={() => navigate('/register')}>Regístrate</span>
        </p>
      </form>
    </div>
  );
};

export default Login;