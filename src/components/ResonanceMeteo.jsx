export default function ResonanceMeteo({
  selected = [],
  climate,
  onEnter,
  disabled,
}) {
  return (
    <div
      style={{
        height: "100%",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#050505",
      }}
    >
      <div>
        <div style={{ textAlign: "center", fontSize: 28 }}>
          {selected.length ? selected.join(" ") : "—"}
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            opacity: 0.7,
            textAlign: "center",
          }}
        >
          {selected.length}/3 symboles choisis
        </div>

        {climate && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 14,
              background: "rgba(255,255,255,0.08)",
              textAlign: "center",
              fontSize: 14,
            }}
          >
            🌦 Climat dominant : <strong>{climate}</strong>
          </div>
        )}
      </div>

      <button
        onClick={onEnter}
        disabled={disabled}
        style={{
          padding: "14px 0",
          borderRadius: 28,
          fontSize: 18,
          background: !disabled ? "#fff" : "#333",
          color: "#000",
          border: "none",
          cursor: !disabled ? "pointer" : "not-allowed",
        }}
      >
        Entrer
      </button>
    </div>
  );
}