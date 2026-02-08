import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 24,
        padding: 24,
        textAlign: "center",
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 36 }}>EchoHypno</h1>
        <p style={{ margin: 0, fontSize: 18, opacity: 0.8 }}>
          Un portail sensible pour explorer les constellations d&apos;émotions et
          traverser un paysage d&apos;émojis.
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Link
          to="/experience"
          style={{
            padding: "14px 24px",
            borderRadius: 999,
            background: "#fff",
            color: "#000",
            fontSize: 18,
            textDecoration: "none",
          }}
        >
          Démarrer le tirage
        </Link>

        <Link
          to="/admin"
          style={{
            fontSize: 14,
            color: "#fff",
            opacity: 0.7,
            textDecoration: "underline",
          }}
        >
          Accéder à la page admin
        </Link>
      </div>
    </div>
  );
}
