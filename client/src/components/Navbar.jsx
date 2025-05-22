import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FaHome, FaUsers, FaCog, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";

const BREAKPOINT_MOBILE = 768;
const NAVBAR_WIDTH_PX = 220;
const ANIMATION_DURATION_MS = 300;

const Navbar = () => {
  const initialIsMobile = window.innerWidth <= BREAKPOINT_MOBILE;
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [isOpen, setIsOpen] = useState(!initialIsMobile);
  const [showHamburger, setShowHamburger] = useState(initialIsMobile && !isOpen);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= BREAKPOINT_MOBILE;
      setIsMobile(newIsMobile);

      if (!newIsMobile) { // Desktop
        setIsOpen(true);
        setShowHamburger(false);
      } else { // Mobile
        setShowHamburger(!isOpen);
      }
    };

    handleResize(); 
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]); // Re-evaluate showHamburger on mobile if isOpen changes due to non-resize events


  const styles = {
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "30px",
      width: "100%",
    },
    toggleButton: {
      background: "none",
      border: "none",
      color: "#fff",
      fontSize: "1.5rem",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    navbar: {
      position: "fixed",
      top: 0,
      left: isOpen ? "0" : `-${NAVBAR_WIDTH_PX}px`,
      width: `${NAVBAR_WIDTH_PX}px`,
      height: "100vh",
      backgroundColor: "#1e1e2f",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      padding: "20px",
      boxSizing: "border-box",
      transition: `left ${ANIMATION_DURATION_MS}ms ease-in-out`,
      zIndex: 1000,
    },
    logo: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      whiteSpace: "nowrap"
    },
    link: {
      color: "#ccc",
      textDecoration: "none",
      marginBottom: "20px",
      fontSize: "1.1rem",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    activeLink: {
      color: "#fff",
      fontWeight: "bold",
    },
    hamburgerButton: {
      position: "fixed",
      top: "20px",
      left: "20px",
      background: "none",
      border: "none",
      color: "#fff", 
      fontSize: "1.5rem",
      zIndex: 2000, 
      cursor: "pointer",
    }
  };

  const getNavLinkStyle = ({ isActive }) =>
    isActive ? { ...styles.link, ...styles.activeLink } : styles.link;

  const openMobileMenu = () => {
    setIsOpen(true);
    setShowHamburger(false);
  };

  const closeMobileMenu = () => {
    setIsOpen(false);
    setShowHamburger(false); // Hide immediately during transition
    setTimeout(() => setShowHamburger(true), ANIMATION_DURATION_MS);
  };

  const handleNavLinkClick = () => {
    if (isMobile) {
      closeMobileMenu();
    }
  };


  return (
    <>
      {isMobile && !isOpen && showHamburger && (
        <button
          onClick={openMobileMenu}
          style={styles.hamburgerButton}
          aria-label="Open navigation menu"
        >
          <FaBars />
        </button>
      )}

      <nav style={styles.navbar}>
        <div style={styles.header}>
          <div style={styles.logo}>Splitter</div>
          {isMobile && isOpen && (
            <button
              onClick={closeMobileMenu}
              style={styles.toggleButton}
              aria-label="Close navigation menu"
            >
              <FaTimes />
            </button>
          )}
        </div>

        <NavLink to="/dashboard" style={getNavLinkStyle} onClick={handleNavLinkClick}>
          <FaHome /> Groups
        </NavLink>
        <NavLink to="/settings" style={getNavLinkStyle} onClick={handleNavLinkClick}>
          <FaCog /> Settings
        </NavLink>
        <NavLink to="/logout" style={getNavLinkStyle} onClick={handleNavLinkClick}>
          <FaSignOutAlt /> Logout
        </NavLink>
      </nav>
    </>
  );
};

export default Navbar;