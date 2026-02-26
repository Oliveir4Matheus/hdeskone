import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ForceChangePassword from "../pages/ForceChangePassword";

export default function PrivateRoute({ children }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.mustChangePassword) return <ForceChangePassword />;
  return children;
}
