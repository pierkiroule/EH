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
        alignItems: "center",
        gap: 20,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 560, display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 40, letterSpacing: 1 }}>
          EchoHypno
        </h1>
        <p style={{ margin: 0, fontSize: 18, color: "#cfcfcf" }}>
          Découvrez un paysage émotionnel généré à partir de vos choix. Sélectionnez
          trois émojis pour lancer le tirage et traverser la scène qui en résulte.
        </p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <Link
          to="/experience"
          style={{
            padding: "12px 24px",
            borderRadius: 999,
            background: "#fff",
            color: "#000",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Commencer le tirage
        </Link>
        <Link
          to="/admin"
          style={{
            padding: "12px 24px",
            borderRadius: 999,
            border: "1px solid #fff",
            color: "#fff",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Accéder à l'administration
        </Link>
      </div>
    </div>
  );
}
