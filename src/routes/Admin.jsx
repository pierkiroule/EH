import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const CLIMATES = ["calm", "deep", "luminous", "tense", "contrast"];
const ROLES = ["background", "support", "accent", "punctuation"];

export default function Admin() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase
      .from("media_assets")
      .select("*")
      .order("category")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setAssets(data || []);
        setLoading(false);
      });
  }, []);

  const update = async (id, patch) => {
    const { error } = await supabase
      .from("media_assets")
      .update(patch)
      .eq("id", id);

    if (error) {
      alert("UPDATE ERROR: " + error.message);
      return;
    }

    setAssets((list) =>
      list.map((a) => (a.id === id ? { ...a, ...patch } : a))
    );
  };

  if (loading) {
    return (
      <div style={{ background: "black", color: "white", padding: 20 }}>
        Chargement catalogue…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: "black", color: "red", padding: 20 }}>
        ❌ {error}
      </div>
    );
  }

  return (
    <div
      style={{
        background: "black",
        color: "white",
        padding: 16,
        fontFamily: "monospace",
      }}
    >
      <h2>ADMIN · Media Catalogue</h2>
      <p style={{ opacity: 0.7 }}>
        Ajuste les potentiels. Le système compose.
      </p>

      <div style={{ marginTop: 16 }}>
        {assets.map((a) => (
          <div
            key={a.id}
            style={{
              display: "grid",
              gridTemplateColumns:
                "40px 90px 1fr 110px 110px 80px 1fr",
              gap: 8,
              marginBottom: 6,
              alignItems: "center",
              fontSize: 12,
            }}
          >
            {/* enabled */}
            <input
              type="checkbox"
              checked={a.enabled}
              onChange={(e) =>
                update(a.id, { enabled: e.target.checked })
              }
            />

            {/* category */}
            <small>{a.category}</small>

            {/* path */}
            <small style={{ opacity: 0.7 }}>{a.path}</small>

            {/* climate */}
            <select
              value={a.climate}
              onChange={(e) =>
                update(a.id, { climate: e.target.value })
              }
            >
              {CLIMATES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* role */}
            <select
              value={a.role}
              onChange={(e) =>
                update(a.id, { role: e.target.value })
              }
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* energy */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={a.energy}
              onChange={(e) =>
                update(a.id, { energy: Number(e.target.value) })
              }
            />

            {/* tags */}
            <input
              defaultValue={(a.tags || []).join(", ")}
              placeholder="tags"
              onBlur={(e) =>
                update(a.id, {
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}