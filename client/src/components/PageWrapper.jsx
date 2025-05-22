import React from "react";

function PageWrapper({ children }) {
    const styles = {
        wrapper: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f7f7f7",
        },
        card: {
          width: "100%",
          maxWidth: "500px",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#fff",
          boxSizing: "border-box",
        },
    }
    
    return (
        <div style={styles.wrapper}>
        <div style={styles.card}>
          {children}
        </div>
      </div>
        );
    }
    

export default PageWrapper;