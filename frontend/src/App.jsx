import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/index';
import Login from './pages/Login';
import Register from './pages/Register';  

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;