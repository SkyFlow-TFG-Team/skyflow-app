import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from "./components/Header";
import Vuelos from "./pages/vuelos";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from './pages/Profile';
import MyBookings from './pages/MyBookings';

function App() {
  return (
    <Router>
      <Header />
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<Vuelos />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-bookings" element={<MyBookings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;