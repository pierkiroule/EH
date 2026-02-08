export default function EmojiSelector({ value = [], onRemove }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        justifyContent: "center",
        marginTop: 8,
      }}
    >
      {[0, 1, 2].map((i) => {
        const emoji = value[i];
        return (
          <div
            key={i}
            onClick={() => emoji && onRemove(emoji)}
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              border: emoji
                ? "2px solid #fff"
                : "1px dashed rgba(255,255,255,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              cursor: emoji ? "pointer" : "default",
              opacity: emoji ? 1 : 0.4,
            }}
          >
            {emoji || "·"}
          </div>
        );
      })}
    </div>
  );
}
