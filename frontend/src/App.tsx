{/* 1. Turns on browser URL listening 2. Checks all rules below and picks the matching one*/}
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GamePage from './pages/GamePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import Menu from './pages/Menu';
import ReadyCheck from './pages/ReadyCheck';
import Lobby from './pages/Lobby';
import LobbyWaiting from './pages/LobbyWaiting';
import SpectatePage from './pages/SpectatePage';
import { GameSessionProvider } from './sockets/GameSessionContext';
import LeaderboardPage from './pages/LeaderboardPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
    return (
        <BrowserRouter>
          <GameSessionProvider>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/menu"
                  element={
                    <ProtectedRoute>
                      <Menu />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lobby"
                  element={
                    <ProtectedRoute>
                      <Lobby />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lobby/waiting"
                  element={
                    <ProtectedRoute>
                      <LobbyWaiting />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lobby/waiting/:lobbyId"
                  element={
                    <ProtectedRoute>
                      <LobbyWaiting />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ready-check"
                  element={
                    <ProtectedRoute>
                      <ReadyCheck />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/game"
                  element={
                    <ProtectedRoute>
                      <GamePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/spectate"
                  element={
                    <ProtectedRoute>
                      <SpectatePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leaderboard"
                  element={
                    <ProtectedRoute>
                      <LeaderboardPage />
                    </ProtectedRoute>
                  }
                />
            </Routes>
          </GameSessionProvider>
        </BrowserRouter>
    );
}
