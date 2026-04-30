import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole }) {
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setPerfil(data);
      setLoading(false);
    }

    checkUser();
  }, []);

  if (loading) return <p className="text-center mt-10">Cargando...</p>;

  if (!perfil) return <Navigate to="/login" />;

  if (requiredRole && perfil.rol !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
}