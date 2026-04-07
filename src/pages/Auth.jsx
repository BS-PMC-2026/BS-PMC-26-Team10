import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

function Auth() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "visitor",
  });

  const handleLoginChange = (e) => {
    const { id, value } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSignupChange = (e) => {
    const { id, value } = e.target;
    setSignupData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleLogin = () => {
    console.log("Login data:", loginData);
  };

  const handleSignup = () => {
    console.log("Signup data:", signupData);

    if (signupData.role === "visitor") {
      navigate("/visitor");
    } else if (signupData.role === "worker") {
      navigate("/tourguide");
    } else if (signupData.role === "admin") {
      navigate("/owner");
    }
  };

  const handleGuest = () => {
    navigate("/visitor");
  };

  return (
    <div className="page">
      <div className="box">
        <div className="left">
          <h1 className="title">ChiliLand</h1>
          <p className="subtitle">Farm Platform</p>

          <div className="tabs">
            <button
              id="loginTab"
              className={`tab ${activeTab === "login" ? "active" : ""}`}
              onClick={() => setActiveTab("login")}
            >
              Login
            </button>

            <button
              id="signupTab"
              className={`tab ${activeTab === "signup" ? "active" : ""}`}
              onClick={() => setActiveTab("signup")}
            >
              Sign Up
            </button>
          </div>
        </div>

        <div className="right">
          {activeTab === "login" && (
            <div id="login" className="form active">
              <h2>Login</h2>

              <input
                type="email"
                placeholder="Email"
                id="email"
                value={loginData.email}
                onChange={(e) =>
                  setLoginData((prev) => ({ ...prev, email: e.target.value }))
                }
              />

              <input
                type="password"
                placeholder="Password"
                id="password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData((prev) => ({ ...prev, password: e.target.value }))
                }
              />

              <button id="loginBtn" onClick={handleLogin}>
                Login
              </button>

              <p className="switch">
                Don’t have an account?{" "}
                <span id="goSignup" onClick={() => setActiveTab("signup")}>
                  Sign Up
                </span>
              </p>
            </div>
          )}

          {activeTab === "signup" && (
            <div id="signup" className="form active">
              <h2>Sign Up</h2>

              <input
                type="text"
                placeholder="Full Name"
                id="fullName"
                value={signupData.fullName}
                onChange={handleSignupChange}
              />

              <input
                type="email"
                placeholder="Email"
                id="email"
                value={signupData.email}
                onChange={handleSignupChange}
              />

              <input
                type="password"
                placeholder="Password"
                id="password"
                value={signupData.password}
                onChange={handleSignupChange}
              />

              <select
                id="role"
                value={signupData.role}
                onChange={handleSignupChange}
              >
                <option value="visitor">Visitor</option>
                <option value="worker">Worker</option>
                <option value="admin">Admin</option>
              </select>

              <button id="signupBtn" onClick={handleSignup}>
                Create Account
              </button>

              <button id="guestBtn" className="guest" onClick={handleGuest}>
                Continue as Guest
              </button>

              <p className="switch">
                Already have an account?{" "}
                <span id="goLogin" onClick={() => setActiveTab("login")}>
                  Login
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;