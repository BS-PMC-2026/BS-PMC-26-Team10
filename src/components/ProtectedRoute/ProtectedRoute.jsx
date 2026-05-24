import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fdf7f0",
      }}>
        <div style={{
          width: 38,
          height: 38,
          border: "3px solid #e0d0c4",
          borderTopColor: "#b22222",
          borderRadius: "50%",
          animation: "pr-spin 0.75s linear infinite",
        }} />
        <style>{`@keyframes pr-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/staffLogin" replace />;
  }

  return children;
}

export default ProtectedRoute;
