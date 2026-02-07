import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function EmojiTriadInjector() {
  const [emojis, setEmojis] = useState([]);
  const [allEmojis, setAllEmojis] = useState([]);
  const [count, setCount] = useState(10);
  const [status, setStatus] = useState("");

  useEffect(() => {
    supabase
      .from("emoji_poles")
      .select("emoji")
      .eq("active", true)
      .then(({ data }) => setAllEmojis(data || []));
  }, []);

  const toggle = (emoji) => {
    if (emojis.includes(emoji)) {
      setEmojis(emojis.filter((e) => e !== emoji));
      return;
    }
    if (emojis.length >= 3) return;
    setEmojis([...emojis, emoji]);
  };

  async function inject() {
    if (emojis.length !== 3) return;

    setStatus("⏳ injection…");

    const pairs = [
      [emojis[0], emojis[1]],
      [emojis[0], emojis[2]],
      [emojis[1], emojis[2]],
    ];

    try {
      for (let i = 0; i < count; i++) {
        // occurrences
        for (const e of emojis) {
          await supabase.from("emoji_collective_stats").upsert(
            { emoji: e, occurrences: 1 },
            { onConflict: "emoji" }
          );
        }

        // cooccurrences
        for (const [a, b] of pairs) {
          await supabase.from("emoji_cooccurrences").upsert(
            {
              emoji_source: a,
              emoji_target: b,
              occurrences: 1,
            },
            { onConflict: "emoji_source,emoji_target" }
          );
        }
      }

      setStatus(`✅ ${count} passages injectés`);
      setEmojis([]);
    } catch (e) {
      console.error(e);
      setStatus("❌ erreur injection");
    }
  }

  return (
    <div
      style={{
        marginTop: 20,
        padding: 14,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.2)",
      }}
    >
      <div style={{ fontSize: 16, marginBottom: 8 }}>
        🧠 Nourrir le paysage collectif
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {allEmojis.map(({ emoji }) => {
          const active = emojis.includes(emoji);
          return (
            <button
              key={emoji}
              onClick={() => toggle(emoji)}
              style={{
                fontSize: 22,
                padding: 8,
                borderRadius: 10,
                background: active ? "#fff" : "#222",
                color: active ? "#000" : "#fff",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              {emoji}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 12 }}>
        <label>
          Passages :
          <input
            type="number"
            min="1"
            max="100"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            style={{
              marginLeft: 8,
              width: 80,
              background: "#111",
              color: "white",
              border: "1px solid #333",
            }}
          />
        </label>
      </div>

      <button
        onClick={inject}
        disabled={emojis.length !== 3}
        style={{
          marginTop: 12,
          padding: "10px 20px",
          borderRadius: 12,
          background: emojis.length === 3 ? "#fff" : "#555",
          color: "#000",
          border: "none",
          cursor: emojis.length === 3 ? "pointer" : "not-allowed",
        }}
      >
        Injecter
      </button>

      {status && (
        <div style={{ marginTop: 8, fontSize: 13 }}>{status}</div>
      )}
    </div>
  );
}
