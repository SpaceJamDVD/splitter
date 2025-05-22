import React, {createContext, useState, useEffect} from "react";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decodedUser = jwtDecode(token);
                const now = Date.now() / 1000;
                if (decodedUser.exp && decodedUser.exp < now) {
                  console.warn("Token expired");
                  logout();
                } else {
                  setUser(decodedUser);
                }
              } catch (error) {
                console.error("Invalid token", error);
                logout();
            }
        } 
    }, []);

    const login = (token) => {
        localStorage.setItem("token", token);
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    }  ;

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
            {children}
        </AuthContext.Provider>
    );

};