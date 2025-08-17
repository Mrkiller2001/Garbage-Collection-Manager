import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Bins from './pages/Bins';
import BinHistoryPage from './pages/BinHistory';
import RoutesPage from './pages/Routes';
import RoutePlanDetail from './pages/RoutePlanDetail';
import TrucksPage from './pages/Trucks';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/bins" element={<Bins />} />
        <Route path="/bins/:id/history" element={<BinHistoryPage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/routes/:id" element={<RoutePlanDetail />} />
        <Route path="/trucks" element={<TrucksPage />} />
      </Routes>
    </Router>
  );
}

export default App;
