import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import EmojiPicker from "../components/EmojiPicker";
import EmojiGraph from "../components/EmojiGraph";
import { createScene } from "../services/createScene";

/* ---------- helpers ---------- */

function dominantClimateFromVector(vector) {
  if (!vector) return "calm";
  const entries = Object.entries(vector);
  if (!entries.length) return "calm";
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

/* ---------- component ---------- */

export default function Experience() {
  const navigate = useNavigate();

  const [graphNodes, setGraphNodes] = useState([]);
  const [graphLinks, setGraphLinks] = useState([]);

  const [emojis, setEmojis] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | informed
  const [info, setInfo] = useState(null);

  /* ---------- LOAD GRAPH ---------- */

  useEffect(() => {
    async function loadGraph() {
      const { data: emojisData } = await supabase
        .from("emoji_poles")
        .select("emoji")
        .eq("active", true);

      const nodes = (emojisData || []).map((e) => ({
        id: e.emoji,
        size: 16,
      }));

      const { data: linksRaw } = await supabase
        .from("emoji_cooccurrences")
        .select("emoji_source, emoji_target, weight");

      const links = (linksRaw || []).map((l) => ({
        source: l.emoji_source,
        target: l.emoji_target,
        value: l.weight || 1,
      }));

      setGraphNodes(nodes);
      setGraphLinks(links);
    }

    loadGraph();
  }, []);

  /* ---------- ACTION ---------- */

  async function handleEnter() {
    if (emojis.length !== 3 || status !== "idle") return;

    setStatus("loading");

    let scene;
    try {
      scene = await createScene({ emojis });
    } catch (e) {
      console.error("CREATE SCENE ERROR", e);
      setStatus("idle");
      return;
    }

    const climate = dominantClimateFromVector(scene.climate_vector);

    setInfo({ emojis, climate });
    setStatus("informed");

    setTimeout(() => {
      navigate(`/scene/${scene.id}`);
    }, 1200);
  }

  /* ---------- UI ---------- */

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000" }}>
      {/* 🌌 FOND — GRAPH */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <EmojiGraph nodes={graphNodes} links={graphLinks} />
      </div>

      {/* 🧭 UI BAS */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2,
          padding: "20px 16px 28px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.2), transparent)",
        }}
      >
        {/* 🃏 CARTE EMOJIS */}
        <div
          style={{
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(10px)",
            borderRadius: 22,
            padding: "18px 22px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
          }}
        >
          <EmojiPicker value={emojis} onChange={setEmojis} />

          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              opacity: 0.75,
              textAlign: "center",
              color: "#fff",
            }}
          >
            {emojis.length}/3 symboles choisis
          </div>
        </div>

        {/* 🌱 FEEDBACK */}
        {status === "informed" && info && (
          <div
            style={{
              padding: 14,
              borderRadius: 16,
              background: "rgba(255,255,255,0.08)",
              fontSize: 14,
              textAlign: "center",
              color: "#fff",
            }}
          >
            🌱 Ton tirage nourrit l’inconscient collectif
            <div style={{ marginTop: 6, fontSize: 24 }}>
              {info.emojis.join(" ")}
            </div>
          </div>
        )}

        {/* 🚪 ENTRER */}
        <button
          onClick={handleEnter}
          disabled={emojis.length !== 3 || status !== "idle"}
          style={{
            marginTop: 6,
            padding: "14px 40px",
            borderRadius: 30,
            fontSize: 18,
            background:
              emojis.length === 3 && status === "idle"
                ? "#fff"
                : "#333",
            color: "#000",
            border: "none",
            cursor:
              emojis.length === 3 && status === "idle"
                ? "pointer"
                : "not-allowed",
            opacity: status === "loading" ? 0.6 : 1,
          }}
        >
          {status === "loading" ? "…" : "Entrer"}
        </button>
      </div>
    </div>
  );
}