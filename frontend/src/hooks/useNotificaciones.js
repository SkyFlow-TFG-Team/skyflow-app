import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";

export const useNotificaciones = (userId) => {
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => {
    // Si no hay usuario, no hacemos nada — el estado ya es [] por defecto
    if (!userId) return;

    let activo = true;

    const cargar = async () => {
      const { data, error } = await supabase
        .from("notificaciones")
        .select("id, usuario_id, titulo, mensaje, leida, creada_en")
        .eq("usuario_id", userId)
        .order("creada_en", { ascending: false })
        .limit(30);
      // setState dentro de async callback — no es síncrono, React lo permite
      if (!error && data && activo) {
        setNotificaciones(data);
      }
    };

    cargar();

    const channel = supabase
      .channel(`notificaciones-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificaciones",
          filter: `usuario_id=eq.${userId}`,
        },
        (payload) => {
          setNotificaciones((prev) => [payload.new, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notificaciones",
          filter: `usuario_id=eq.${userId}`,
        },
        (payload) => {
          setNotificaciones((prev) =>
            prev.map((n) => (n.id === payload.new.id ? payload.new : n))
          );
        }
      )
      .subscribe();

    return () => {
      activo = false;
      supabase.removeChannel(channel);
      // Limpiamos al desmontar/cambiar userId en el cleanup
      setNotificaciones([]);
    };
  }, [userId]);

  const marcarLeida = useCallback(
    async (notifId) => {
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, leida: true } : n))
      );
      await supabase
        .from("notificaciones")
        .update({ leida: true })
        .eq("id", notifId)
        .eq("usuario_id", userId);
    },
    [userId]
  );

  const marcarTodasLeidas = useCallback(async () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("usuario_id", userId)
      .eq("leida", false);
  }, [userId]);

  const eliminarNotificacion = useCallback(
    async (notifId) => {
      setNotificaciones((prev) => prev.filter((n) => n.id !== notifId));
      await supabase
        .from("notificaciones")
        .delete()
        .eq("id", notifId)
        .eq("usuario_id", userId);
    },
    [userId]
  );

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return {
    notificaciones,
    noLeidas,
    marcarLeida,
    marcarTodasLeidas,
    eliminarNotificacion,
  };
};