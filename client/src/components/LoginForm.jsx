import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./button";
import API from "../api"; 

function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const styles = {
        container: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '400px',
          margin: '0 auto',
          padding: '20px',
        },
        inputcontainer: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          gap: '12px',
        },
        input: {
          width: '100%',
          maxWidth: '400px',
          padding: '10px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          fontSize: '16px',
          boxSizing: 'border-box',
        },
        buttonGroup: {
          display: 'flex',
          flexDirection: 'column', 
          gap: '10px',               
          width: '100%',
        },
      };
      

    const handleRegister = async () => {
        try {
            const res = await API.post("/auth/register", { username, password });
            setMessage(`✅ Registered: ${res.data.userId}`);
        } catch (err) {
            setMessage(`❌ ${err.response?.data?.error || "Error"}`);
        }
    }   

    const handleLogin = async () => {
        try {
            const res = await API.post("/auth/login", { username, password });

            const token = res.data.token;
            localStorage.setItem("token", token);

            navigate("/dashboard");
        } catch (err) {
            setMessage(`❌ ${err.response?.data?.error || "Error"}`);
        }
    };


    return (
        <div style={styles.container}>
            <h2>Register or Login</h2>
            <div style={styles.inputcontainer}>
                <input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
                />
                <input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                />
                <div style={styles.buttonGroup}>
                <Button onClick={handleRegister}>Register</Button>
                <Button onClick={handleLogin}>Login</Button>
                </div>
            </div>
        <p>{message}</p>
      </div>
    );

}

export default LoginForm;