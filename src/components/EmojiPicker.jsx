import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function EmojiPicker({ value = [], onChange }) {
  const [emojis, setEmojis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase
      .from("emoji_poles")
      .select("emoji")
      .eq("active", true)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error("EmojiPicker load error", error);
          setEmojis([]);
        } else {
          setEmojis((data || []).map((e) => e.emoji));
        }
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const toggle = (emoji) => {
    if (value.includes(emoji)) {
      onChange(value.filter((e) => e !== emoji));
      return;
    }
    if (value.length >= 3) return;
    onChange([...value, emoji]);
  };

  if (loading) {
    return (
      <div style={{ opacity: 0.6, fontSize: 14 }}>
        Chargement des symboles…
      </div>
    );
  }

  if (emojis.length === 0) {
    return (
      <div style={{ color: "red", fontSize: 14 }}>
        ❌ Aucun émoji actif en base
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {emojis.map((emoji) => {
        const active = value.includes(emoji);

        return (
          <button
            key={emoji}
            type="button"
            onClick={() => toggle(emoji)}
            style={{
              fontSize: 24,
              padding: 10,
              borderRadius: 10,
              border: active ? "2px solid #000" : "1px solid #ccc",
              background: active ? "#eee" : "#fff",
              cursor: "pointer",
              transition: "transform 0.1s ease",
            }}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}