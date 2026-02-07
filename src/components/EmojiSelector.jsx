import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function EmojiSelector({ value = [], onChange }) {
  const [emojis, setEmojis] = useState([]);

  useEffect(() => {
    supabase
      .from("emoji_poles")
      .select("emoji")
      .eq("active", true)
      .then(({ data, error }) => {
        if (error) {
          console.error("EMOJI LOAD ERROR", error);
          return;
        }
        setEmojis(data || []);
      });
  }, []);

  const toggle = (emoji) => {
    if (value.includes(emoji)) {
      onChange(value.filter((e) => e !== emoji));
      return;
    }
    if (value.length >= 3) return;
    onChange([...value, emoji]);
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {emojis.map(({ emoji }) => {
        const active = value.includes(emoji);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => toggle(emoji)}
            style={{
              fontSize: 26,
              padding: 10,
              borderRadius: 10,
              border: "1px solid #444",
              background: active ? "#000" : "#eee",
              color: active ? "#fff" : "#000",
              cursor: "pointer",
            }}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}
