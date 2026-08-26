{/* 1. Turns on browser URL listening 2. Checks all rules below and picks the matching one*/}
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GamePage from './pages/GamePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import LobbyPage from './pages/LobbyPage';
import RegisterPage from './pages/RegisterPage';
import Menu from './pages/Menu';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
              {/* 3. The actual rules: */}
                <Route path="/" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/lobby" element={<LobbyPage />} />
                <Route path="/game" element={<GamePage />} />
                <Route path="/profile" element={<ProfilePage />} />
            </Routes>
        </BrowserRouter>
    );
}