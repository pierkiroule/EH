import { useNavigate } from "react-router-dom";
import { createScene } from "../services/createScene";
import { useState } from "react";
import EmojiPicker from "../components/EmojiPicker";

export default function Experience() {
  const [selectedEmojis, setSelectedEmojis] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const generate = async () => {
    setError(null);

    if (selectedEmojis.length !== 3) return;

    setStatus("creating");

    let scene;
    try {
      scene = await createScene({ emojis: selectedEmojis });
    } catch (e) {
      setStatus("error");
      setError(e?.message || JSON.stringify(e));
      return;
    }

    if (!scene || !scene.id) {
      setStatus("error");
      setError("Scene invalide (id manquant)");
      return;
    }

    setStatus("navigating");
    navigate(`/scene/${scene.id}`);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        color: "#fff",
        zIndex: 999999,
        padding: 24,
      }}
    >
      <h2>Choisis 3 émojis</h2>

      <EmojiPicker value={selectedEmojis} onChange={setSelectedEmojis} />

      <div
        onClick={generate}
        style={{
          marginTop: 32,
          padding: 20,
          background: selectedEmojis.length === 3 ? "#fff" : "#444",
          color: "#000",
          fontSize: 20,
          borderRadius: 12,
          textAlign: "center",
          cursor: selectedEmojis.length === 3 ? "pointer" : "not-allowed",
          userSelect: "none",
        }}
      >
        ENTRER
      </div>

      <div style={{ marginTop: 16, fontSize: 14, opacity: 0.7 }}>
        Status : {status}
      </div>

      {error && (
        <div style={{ marginTop: 12, color: "red" }}>
          ❌ {error}
        </div>
      )}
    </div>
  );
}