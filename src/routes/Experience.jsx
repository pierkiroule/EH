import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import EmojiGraph from "../components/EmojiGraph";
import EmojiSelector from "../components/EmojiSelector";
import ResoMeteo from "../components/ResoMeteo";
import { createScene } from "../services/createScene";

export default function Experience() {
  const navigate = useNavigate();

  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selected, setSelected] = useState([]);
  const [meteo, setMeteo] = useState(null);
  const [isEntering, setIsEntering] = useState(false);

  /* ---------- LOAD GRAPH ---------- */
  useEffect(() => {
    async function load() {
      const { data: emojis } = await supabase
        .from("emoji_poles")
        .select("emoji");

      const { data: cooc } = await supabase
        .from("emoji_cooccurrences")
        .select("emoji_source, emoji_target, weight");

      setNodes(
        (emojis || []).map((e) => ({
          id: e.emoji,
          size: 14,
        }))
      );

      setLinks(
        (cooc || []).map((c) => ({
          source: c.emoji_source,
          target: c.emoji_target,
          value: c.weight || 1,
        }))
      );

      setMeteo({
        climate: "calm",
        density: "faible",
        tension: "diffuse",
      });
    }
    load();
  }, []);

  /* ---------- SELECTION ---------- */
  function toggleEmoji(emoji) {
    setSelected((prev) => {
      if (prev.includes(emoji)) {
        return prev.filter((e) => e !== emoji);
      }
      if (prev.length >= 3) return prev;
      return [...prev, emoji];
    });
  }

  function removeEmoji(emoji) {
    setSelected((prev) => prev.filter((e) => e !== emoji));
  }

  async function enter() {
    if (selected.length !== 3 || isEntering) return;
    setIsEntering(true);
    try {
      const scene = await createScene({ emojis: selected });
      navigate(`/scene/${scene.id}`);
    } catch (error) {
      console.error("Impossible de traverser le paysage:", error);
    } finally {
      setIsEntering(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 16,
      }}
    >
      {/* 🌌 GRAPH */}
      <EmojiGraph
        nodes={nodes}
        links={links}
        selected={selected}
        onToggle={toggleEmoji}
      />

      {/* 🎯 SELECTEUR */}
      <EmojiSelector value={selected} onRemove={removeEmoji} />

      {/* 🌦 METEO */}
      <ResoMeteo stats={meteo} />

      {/* 🚪 ACTION */}
      <button
        onClick={enter}
        disabled={selected.length !== 3 || isEntering}
        style={{
          marginTop: 8,
          padding: "14px",
          borderRadius: 28,
          fontSize: 18,
          border: "none",
          background:
            selected.length === 3 && !isEntering ? "#fff" : "#333",
          color: selected.length === 3 ? "#000" : "#999",
          cursor:
            selected.length === 3 && !isEntering
              ? "pointer"
              : "not-allowed",
          opacity: selected.length === 3 && !isEntering ? 1 : 0.7,
        }}
      >
        {isEntering ? "Traversée en cours..." : "Traverser le paysage"}
      </button>
    </div>
  );
}
