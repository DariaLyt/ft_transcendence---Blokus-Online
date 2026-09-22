import { Navigate } from "react-router-dom";
import { useGameSession } from "../sockets/GameSessionContext";


type ProtectedRouteProps = {
	children: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
	const { currentUser, authLoading } = useGameSession();

	if (authLoading) {
		return <div>Loading...</div>;
	}

	if (!currentUser) {
		return <Navigate to="/" replace />;
	}
	return children;
}