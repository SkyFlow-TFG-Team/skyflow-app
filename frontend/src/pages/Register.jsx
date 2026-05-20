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

    // Crear usuario en Auth
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      toast.error("Error: " + error.message, { id: tId });
      return;
    }

    if (data.user) {
      // Crear perfil en la tabla 'perfiles'
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
    <div className="flex justify-center items-center min-h-[80vh] transition-colors duration-500 p-4">
      <form 
        onSubmit={handleRegister} 
        className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 transition-all"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter italic">
            Sky<span className="text-blue-600">Flow</span>
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
            Únete a la tripulación
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest mb-1">Nombre</label>
              <input 
                type="text" 
                placeholder="Alejandro" 
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600" 
                onChange={(e) => setNombre(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest mb-1">Apellidos</label>
              <input 
                type="text" 
                placeholder="Quiñones" 
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600" 
                onChange={(e) => setApellidos(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest mb-1">Email</label>
            <input 
              type="email" 
              placeholder="correo@ejemplo.com" 
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600" 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest mb-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600" 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 mt-4 tracking-widest text-sm uppercase">
            REGISTRARME
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
          ¿Ya tienes cuenta? <span onClick={() => navigate('/login')} className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer">Inicia sesión</span>
        </p>
      </form>
    </div>
  );
};

export default Register;