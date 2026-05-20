import { useEffect, useState, useCallback } from "react"
import { supabase } from "../supabaseClient"

export const useNotificaciones = (userId) => {
	const [notificaciones, setNotificaciones] = useState([])

	useEffect(() => {
		if (!userId) {
			setNotificaciones([])
			return
		}

		let activo = true

		const cargar = async () => {
			try {
				const { data, error } = await supabase
					.from("notificaciones")
					.select("*")
					.eq("usuario_id", userId)
					.order("creada_en", { ascending: false })
					.limit(30)

				if (!error && data && activo) {
					setNotificaciones(data)
				}
			} catch (err) {
				console.error("Error cargando notificaciones:", err)
			}
		}

		cargar()

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
					if (activo) {
						setNotificaciones((prev) => [payload.new, ...prev])
					}
				},
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
					if (activo) {
						setNotificaciones((prev) =>
							prev.map((n) => (n.id === payload.new.id ? payload.new : n)),
						)
					}
				},
			)
			.subscribe()

		return () => {
			activo = false
			supabase.removeChannel(channel)
		}
	}, [userId])

	const marcarLeida = useCallback(async (notifId) => {
		setNotificaciones((prev) =>
			prev.map((n) => (n.id === notifId ? { ...n, leida: true } : n)),
		)
		await supabase
			.from("notificaciones")
			.update({ leida: true })
			.eq("id", notifId)
	}, [])

	const marcarTodasLeidas = useCallback(async () => {
		setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
		await supabase
			.from("notificaciones")
			.update({ leida: true })
			.eq("usuario_id", userId)
	}, [userId])

	// Siempre devuelve un número, incluso si notificaciones es undefined
	const noLeidas = (notificaciones || []).filter((n) => !n.leida).length

	return {
		notificaciones: notificaciones || [],
		noLeidas,
		marcarLeida,
		marcarTodasLeidas,
	}
}
