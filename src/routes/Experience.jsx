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
  const isReady = emojis.length === 3 && status === "idle";

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
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        color: "#fff",
      }}
    >
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
          gap: 14,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.2), transparent)",
        }}
      >
        {/* 🃏 CARTE EMOJIS — zone consciente, compacte et lisible */}
        <div
          style={{
            width: "min(420px, 100%)",
            background: "rgba(10,10,12,0.72)",
            backdropFilter: "blur(10px)",
            borderRadius: 22,
            padding: "18px 22px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.08)",
            transition: "transform 350ms ease, box-shadow 350ms ease",
            transform: status === "loading" ? "scale(0.99)" : "scale(1)",
          }}
        >
          <EmojiPicker value={emojis} onChange={setEmojis} />

          {/* Feedback clair : progression douce et rassurante */}
          <div
            style={{
              marginTop: 10,
              fontSize: 13.5,
              opacity: 0.8,
              textAlign: "center",
              color: "rgba(255,255,255,0.9)",
              letterSpacing: 0.2,
            }}
          >
            {emojis.length} / 3 émojis choisis
          </div>
        </div>

        {/* 🌱 FEEDBACK — confirmation légère, sans rupture */}
        {status === "informed" && info && (
          <div
            style={{
              width: "min(420px, 100%)",
              padding: "14px 16px",
              borderRadius: 16,
              background: "rgba(255,255,255,0.08)",
              fontSize: 14.5,
              textAlign: "center",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
              transition: "opacity 350ms ease, transform 350ms ease",
              opacity: 1,
              transform: "translateY(0)",
            }}
          >
            🌱 Ton tirage nourrit l’inconscient collectif
            <div style={{ marginTop: 6, fontSize: 24 }}>
              {info.emojis.join(" ")}
            </div>
          </div>
        )}

        {/* 🚪 ENTRER — passage clair, état lisible */}
        <button
          onClick={handleEnter}
          disabled={!isReady}
          style={{
            marginTop: 6,
            minWidth: 220,
            padding: "14px 40px",
            borderRadius: 30,
            fontSize: 18,
            background: isReady
              ? "linear-gradient(135deg, #ffffff, #d7e0ff)"
              : "rgba(255,255,255,0.18)",
            color: isReady ? "#0a0a0a" : "rgba(255,255,255,0.7)",
            border: "none",
            cursor: isReady ? "pointer" : "not-allowed",
            opacity: status === "loading" ? 0.6 : 1,
            transition:
              "transform 200ms ease, box-shadow 200ms ease, opacity 200ms ease",
            boxShadow: isReady
              ? "0 12px 30px rgba(120,140,255,0.35)"
              : "none",
            transform: isReady ? "translateY(0)" : "translateY(1px)",
          }}
        >
          {status === "loading" ? "…" : "Entrer"}
        </button>
      </div>
    </div>
  );
}
