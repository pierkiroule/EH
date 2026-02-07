import { useNavigate } from "react-router-dom";
import { createScene } from "../services/createScene";
import { useState } from "react";
import EmojiPicker from "../components/EmojiPicker";

export default function Experience() {
  const [selectedEmojis, setSelectedEmojis] = useState([]);
  const navigate = useNavigate();

  const generate = async () => {
    console.log("🧪 ENTER CLICKED", selectedEmojis);

    if (selectedEmojis.length !== 3) return;

    let scene;
    try {
      scene = await createScene({ emojis: selectedEmojis });
    } catch (e) {
      console.error("SCENE CREATION ERROR", e);
      return;
    }

    if (!scene || !scene.id) {
      console.error("INVALID SCENE", scene);
      return;
    }

    navigate(`/scene/${scene.id}`);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    generate();
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        position: "relative",
        zIndex: 1000,
        pointerEvents: "auto",
        padding: 20,
      }}
    >
      <h2>Choisis 3 émojis</h2>

      <EmojiPicker value={selectedEmojis} onChange={setSelectedEmojis} />

      <button
        type="button"
        onClick={generate}
        disabled={selectedEmojis.length !== 3}
        style={{
          marginTop: 24,
          padding: "14px 28px",
          background: selectedEmojis.length === 3 ? "#111" : "#444",
          color: "white",
          borderRadius: 14,
          fontSize: 18,
          cursor: selectedEmojis.length === 3 ? "pointer" : "not-allowed",
          display: "inline-block",
          userSelect: "none",
          border: "none",
          opacity: selectedEmojis.length === 3 ? 1 : 0.7,
        }}
      >
        Entrer
      </button>

      <pre style={{ marginTop: 12 }}>
        {JSON.stringify(selectedEmojis)}
      </pre>
    </form>
  );
}
