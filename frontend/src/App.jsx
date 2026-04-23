import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from "./components/Header";
import Vuelos from "./pages/vuelos";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from './pages/Profile';
import MyBookings from './pages/MyBookings';
import AssignedFlights from './pages/AssignedFlights';
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Header />
      <div className="container mx-auto p-4">
        <Routes>

          {/* 🔓 Público */}
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

          {/* 🧑‍✈️ SOLO EMPLEADO */}
          <Route 
            path="/assigned-flights" 
            element={
              <ProtectedRoute requiredRole="empleado">
                <AssignedFlights />
              </ProtectedRoute>
            } 
          />

          {/* 🛠️ TODOS LOS USUARIOS LOGUEADOS */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Vuelos />
              </ProtectedRoute>
            } 
          />

        </Routes>
      </div>
    </Router>
  );
}

export default App;