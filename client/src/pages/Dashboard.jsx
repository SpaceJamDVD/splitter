import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import useIsMobile from "../hooks/useIsMobile";
import { getMyGroups } from "../services/groupService"; // your API call
import { useNavigate } from "react-router-dom";
import GroupForm from "../components/GroupForm";
import GroupCard from "../components/GroupCard";

function Dashboard() {
    const { user } = useContext(AuthContext);
    const isMobile = useIsMobile();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();
  
    useEffect(() => {
      const fetchGroups = async () => {
        try {
          const result = await getMyGroups();
          setGroups(result);
        } catch (err) {
          console.error("Failed to fetch groups", err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchGroups();
    }, []);
  
    const handleCreateGroup = () => {
        setShowModal(true);
      };

      const handleCloseModal = () => {
        setShowModal(false);
      };
   
  const styles = {
    newGroupButton: {
      padding: "10px 16px",
      backgroundColor: "#4caf50",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "1rem",
    },
    groupItem: {
      marginBottom: "12px",
      padding: "12px",
      background: "#2f2f40",
      borderRadius: "6px",
      color: "#fff",
    }
  };
  
    return (
      <div>
        <Navbar />
        <div
          style={{
            marginLeft: isMobile ? "0" : "220px",
            padding: "40px",
            transition: "margin 0.3s ease-in-out",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1>My Groups</h1>
            <button onClick={handleCreateGroup} style={styles.newGroupButton}>
              + New Group
            </button>
          </div>
  
          {loading ? (
            <p>Loading groups...</p>
          ) : groups.length === 0 ? (
            <p>You aren't in any groups yet.</p>
          ) : (
            <ul>
              {groups.map((group) => (
                <GroupCard key={group._id} group={group} />
              ))}
            </ul>
          )}
        </div>

        {showModal && (
            <div style={styles.modalOverlay}>
                <div style={styles.modalContent}>
                <button style={styles.closeButton} onClick={handleCloseModal}>✕</button>
                <GroupForm onSuccess={handleCloseModal} />
                </div>
            </div>
            )}

      </div>
    );
  }

  export default Dashboard;
  