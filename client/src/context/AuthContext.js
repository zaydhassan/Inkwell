import { createContext, useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { setAccessToken, logoutUser } from "../utils/auth";
import axios from "axios";
import { authActions } from "../redux/store";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    let parsed;
    try {
      parsed = JSON.parse(storedUser);
    } catch {
    
      return;
    }
  
    setUser(parsed);
    setIsLoggedIn(true);

    axios
      .post("/api/v1/user/refresh")
      .then(({ data }) => {
        if (!data?.success || !data.user) return;
        const fresh = data.user;
        localStorage.setItem("user", JSON.stringify(fresh));
        localStorage.setItem("userId", fresh._id);
        localStorage.setItem("userRole", fresh.role);
        localStorage.setItem("isLogin", "true");
        if (data.accessToken) setAccessToken(data.accessToken);
        setUser(fresh);
        setIsLoggedIn(true);
        dispatch(authActions.login(fresh));
      })
      .catch((err) => {
        if (err?.response?.status !== 401) return;
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        localStorage.removeItem("isLogin");
        setUser(null);
        setIsLoggedIn(false);
        dispatch(authActions.logout());
      });
  }, [dispatch]);

  // userData is the safe user object from the API; accessToken is the
  // short-lived JWT. The refresh token is already an httpOnly cookie.
  const login = (userData, accessToken) => {
    if (accessToken) setAccessToken(accessToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("userId", userData._id);
    localStorage.setItem("userRole", userData.role);
    localStorage.setItem("isLogin", "true");
    setUser(userData);
    setIsLoggedIn(true);
    dispatch(authActions.login(userData));
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      // Firebase sign-out failure shouldn't block local logout.
      console.error("Firebase signOut error:", error);
    }
    await logoutUser(); // clears the server refresh cookie + local auth state
    setUser(null);
    setIsLoggedIn(false);
    dispatch(authActions.logout());
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);