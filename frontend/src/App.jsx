import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from "./components/layout/Header";
import Home from "./pages/Home";
import Vuelos from "./pages/vuelos";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from './pages/Profile';
import MyBookings from './pages/MyBookings';
import AssignedFlights from "./pages/AssignedFlights";
import BoardingPass from "./pages/BoardingPass";
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <>
    <Toaster 
      position="top-center"
      toastOptions={{
        className: 'font-sans font-medium',
        success: {
          duration: 4000,
          iconTheme: { primary: '#10b981', secondary: '#fff' },
        },
        error: {
          duration: 5000,
          style: { background: '#ef4444', color: '#fff' },
        },
      }}
    />
    <Router>
      <Header />
      <div className="container mx-auto p-4">
        <Routes>

          {/* 🔓 Público */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 🔐 Usuario logueado */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/my-bookings" 
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            } 
          />

          {/* 🎫 TARJETA DE EMBARQUE */}
          <Route 
            path="/boarding-pass/:reservaId" 
            element={
              <ProtectedRoute>
                <BoardingPass />
              </ProtectedRoute>
            } 
          />

          {/* 🧑‍✈️ SOLO EMPLEADO */}
          <Route 
            path="/assigned_flights" 
            element={
              <ProtectedRoute requiredRole="empleado">
                <AssignedFlights />
              </ProtectedRoute>
            } 
          />

          {/* 🛠️ PANEL DE ADMINISTRACIÓN (Mesa limpia) */}
          <Route 
            path="/vuelos" 
            element={
              <ProtectedRoute requiredRole="admin">
                <Vuelos />
              </ProtectedRoute>
            } 
          />

        </Routes>
      </div>
    </Router>
    </>
  );
}

export default App;