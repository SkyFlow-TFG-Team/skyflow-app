import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const navigate = useNavigate();

const handleRegister = async (e) => {
    e.preventDefault();
    const tId = toast.loading("Creando tu cuenta en SkyFlow...");

    // 1. Crear usuario en Auth
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      toast.error("Error: " + error.message, { id: tId });
      return;
    }

    if (data.user) {
      // 2. Crear perfil en la tabla 'perfiles'
      const { error: pError } = await supabase
        .from('perfiles')
        .insert([{ id: data.user.id, nombre, apellidos, rol: 'usuario' }]);

      if (pError) {
        toast.error("Cuenta creada, pero hubo un error en el perfil", { id: tId });
      } else {
        toast.success("¡Registro completado! Por favor, entra.", { id: tId });
        await supabase.auth.signOut();
        localStorage.removeItem("token");
        navigate('/login'); 
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <form onSubmit={handleRegister} className="bg-white p-8 rounded-xl shadow-md w-80 border border-slate-200">
        <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">Crear Cuenta</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nombre</label>
            <input 
              type="text" 
              placeholder="Ej. Alejandro" 
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
              onChange={(e) => setNombre(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Apellidos</label>
            <input 
              type="text" 
              placeholder="Ej. Quiñones" 
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
              onChange={(e) => setApellidos(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</label>
            <input 
              type="email" 
              placeholder="correo@ejemplo.com" 
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button className="w-full bg-green-600 text-white font-bold p-3 rounded-lg hover:bg-green-700 transition shadow-lg mt-2">
            Registrarme
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-slate-600">
          ¿Ya tienes cuenta? <a href="/login" className="text-blue-600 font-bold hover:underline">Entrar</a>
        </p>
      </form>
    </div>
  );
};

export default Register;