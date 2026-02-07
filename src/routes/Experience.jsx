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

  return (
    <div
      style={{
        position: "relative",
        zIndex: 1000,
        pointerEvents: "auto",
        padding: 20,
      }}
    >
      <h2>Choisis 3 émojis</h2>

      <EmojiPicker value={selectedEmojis} onChange={setSelectedEmojis} />

      {/* CTA SAFE — pas de <button> */}
      <div
        role="button"
        tabIndex={0}
        onClick={generate}
        onKeyDown={(e) => e.key === "Enter" && generate()}
        style={{
          marginTop: 24,
          padding: "14px 28px",
          background: "#111",
          color: "white",
          borderRadius: 14,
          fontSize: 18,
          cursor: "pointer",
          display: "inline-block",
          userSelect: "none",
        }}
      >
        Entrer
      </div>

      <pre style={{ marginTop: 12 }}>
        {JSON.stringify(selectedEmojis)}
      </pre>
    </div>
  );
}