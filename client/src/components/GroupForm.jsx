import React, { useState } from "react";
import { createGroup } from "../services/groupService";

const GroupForm = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const group = await createGroup({
        name,
        description,
      });

      setMessage(`✅ Group "${group.name}" created successfully`);
      setName("");
      setDescription("");
    } catch (error) {
      console.error("Error creating group:", error);
      setMessage("❌ Failed to create group");
    }
  };

  const styles = {
    form: {
      maxWidth: "400px",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      padding: "20px",
      background: "#2c2c3c",
      borderRadius: "8px",
      color: "#fff"
    },
    input: {
      padding: "10px",
      borderRadius: "4px",
      border: "1px solid #ccc"
    },
    textarea: {
      padding: "10px",
      borderRadius: "4px",
      border: "1px solid #ccc",
      minHeight: "60px"
    },
    button: {
      padding: "10px",
      backgroundColor: "#4caf50",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer"
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2>Create a New Group</h2>

      <input
        type="text"
        placeholder="Group name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        style={styles.input}
      />

      <textarea
        placeholder="Group description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={styles.textarea}
      />

      <button type="submit" style={styles.button}>Create Group</button>

      {message && <p>{message}</p>}
    </form>
  );
};

export default GroupForm;
