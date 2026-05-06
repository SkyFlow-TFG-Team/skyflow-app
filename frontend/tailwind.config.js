/** @type {import('tailwindcss').Config} */
export default {
	// ¡ESTA LÍNEA ES CRÍTICA!
	darkMode: "class",
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {},
	},
	plugins: [],
}
