export default function ResoMeteo({ stats }) {
  if (!stats) return null;

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 16,
        background: "rgba(255,255,255,0.08)",
        color: "#fff",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <strong>Météo Reso•°</strong>
      <div style={{ marginTop: 6 }}>
        Dominante : <strong>{stats.climate}</strong>
      </div>
      <div>Densité relationnelle : {stats.density}</div>
      <div>Tension symbolique : {stats.tension}</div>
    </div>
  );
}
