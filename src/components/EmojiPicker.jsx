export default function EmojiPicker({ value = [], onChange }) {
  const EMOJIS = ["🌊", "🌑", "🕯️", "🔥", "🌬️"];

  const toggle = (emoji) => {
    console.log("TOGGLE", emoji, value);

    if (value.includes(emoji)) {
      onChange(value.filter((e) => e !== emoji));
      return;
    }

    if (value.length >= 3) return;
    onChange([...value, emoji]);
  };

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {EMOJIS.map((emoji) => {
        const active = value.includes(emoji);

        return (
          <button
            key={emoji}
            type="button"
            onClick={() => toggle(emoji)}
            style={{
              fontSize: 24,
              padding: 10,
              borderRadius: 8,
              border: active ? "2px solid black" : "1px solid #ccc",
              background: active ? "#eee" : "white",
            }}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}