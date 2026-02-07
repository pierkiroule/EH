import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

/* ================= CONSTANTES ================= */

const CLIMATES = ["calm", "deep", "luminous", "tense", "contrast"];
const PRESETS = ["Config 1", "Config 2", "Config 3"];

/* ================= ADMIN ================= */

export default function Admin() {
  const [rows, setRows] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);

  /* ---- nourrissage ---- */
  const [allEmojis, setAllEmojis] = useState([]);
  const [triad, setTriad] = useState([]);
  const [injectCount, setInjectCount] = useState(10);
  const [injectStatus, setInjectStatus] = useState("");

  /* ================= LOAD ================= */

  async function loadAssets() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("media_assets")
      .select("id,path,category,climate,enabled")
      .order("category", { ascending: true })
      .order("path", { ascending: true });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setRows(data || []);
    setLoading(false);
  }

  async function loadConfigs() {
    const { data } = await supabase
      .from("admin_configs")
      .select("id,name,created_at")
      .order("created_at", { ascending: false });

    setConfigs(data || []);
  }

  async function loadEmojis() {
    const { data } = await supabase
      .from("emoji_poles")
      .select("emoji")
      .eq("active", true);

    setAllEmojis(data || []);
  }

  useEffect(() => {
    loadAssets();
    loadConfigs();
    loadEmojis();
  }, []);

  /* ================= DERIVED ================= */

  const byClimate = useMemo(() => {
    const map = {};
    CLIMATES.forEach((c) => (map[c] = []));
    rows.forEach((r) => {
      if (CLIMATES.includes(r.climate)) map[r.climate].push(r);
    });
    return map;
  }, [rows]);

  const orphans = useMemo(
    () => rows.filter((r) => !CLIMATES.includes(r.climate)),
    [rows]
  );

  /* ================= PATCH MEDIA ================= */

  async function patchAsset(id, patch) {
    setSavingId(id);
    setError(null);

    const { error } = await supabase
      .from("media_assets")
      .update(patch)
      .eq("id", id);

    if (error) {
      setError(error.message);
      setSavingId(null);
      return;
    }

    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
    setSavingId(null);
  }

  /* ================= CONFIGS ================= */

  async function saveConfig(name) {
    const snapshot = rows.map((r) => ({
      id: r.id,
      climate: r.climate,
      enabled: r.enabled,
    }));

    await supabase.from("admin_configs").insert({ name, snapshot });
    loadConfigs();
  }

  async function loadConfig(configId) {
    if (!configId) return;

    const { data } = await supabase
      .from("admin_configs")
      .select("snapshot")
      .eq("id", configId)
      .single();

    if (!data?.snapshot) return;

    for (const s of data.snapshot) {
      await supabase
        .from("media_assets")
        .update({ climate: s.climate, enabled: s.enabled })
        .eq("id", s.id);
    }

    loadAssets();
  }

  /* ================= NOURRISSAGE ================= */

  const toggleEmoji = (emoji) => {
    if (triad.includes(emoji)) {
      setTriad(triad.filter((e) => e !== emoji));
      return;
    }
    if (triad.length >= 3) return;
    setTriad([...triad, emoji]);
  };

  async function injectPassages() {
    if (triad.length !== 3) return;

    setInjectStatus("⏳ injection…");

    const pairs = [
      [triad[0], triad[1]],
      [triad[0], triad[2]],
      [triad[1], triad[2]],
    ];

    try {
      for (let i = 0; i < injectCount; i++) {
        for (const e of triad) {
          await supabase.from("emoji_collective_stats").upsert(
            { emoji: e, occurrences: 1 },
            { onConflict: "emoji" }
          );
        }

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

      setInjectStatus(`✅ ${injectCount} passages injectés`);
      setTriad([]);
    } catch (e) {
      console.error(e);
      setInjectStatus("❌ erreur injection");
    }
  }

  /* ================= UI HELPERS ================= */

  const AssetRow = ({ a }) => (
    <div
      style={{
        padding: 10,
        borderRadius: 10,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <span style={{ fontSize: 12, opacity: 0.7 }}>[{a.category}]</span>
      <span style={{ fontSize: 13, wordBreak: "break-all" }}>{a.path}</span>

      <label style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
        <span style={{ fontSize: 12 }}>actif</span>
        <input
          type="checkbox"
          checked={!!a.enabled}
          onChange={(e) =>
            patchAsset(a.id, { enabled: e.target.checked })
          }
        />
      </label>

      <select
        value={a.climate || ""}
        onChange={(e) =>
          patchAsset(a.id, { climate: e.target.value })
        }
        style={{
          background: "rgba(255,255,255,0.06)",
          color: "white",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 8,
          padding: "4px 8px",
          fontSize: 12,
        }}
      >
        <option value="">— climat —</option>
        {CLIMATES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {savingId === a.id && (
        <span style={{ fontSize: 11, opacity: 0.6 }}>saving…</span>
      )}
    </div>
  );

  const ClimateBlock = ({ climate }) => {
    const items = byClimate[climate].filter((a) => a.enabled);

    return (
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 14,
          padding: 12,
        }}
      >
        <div style={{ fontSize: 16, marginBottom: 8 }}>
          {climate.toUpperCase()} · {items.length}
        </div>

        {items.length === 0 ? (
          <div style={{ opacity: 0.6, fontSize: 13 }}>
            Aucun média actif
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {items.map((a) => (
              <AssetRow key={a.id} a={a} />
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ================= RENDER ================= */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        padding: 16,
      }}
    >
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 18 }}>ADMIN · Climats & Nourrissage</div>
        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>
          {loading ? "loading…" : `${rows.length} médias`}
        </div>
      </div>

      {/* PRESETS */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {PRESETS.map((name) => (
          <button
            key={name}
            onClick={() => saveConfig(name)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
            }}
          >
            Sauver {name}
          </button>
        ))}

        <select
          onChange={(e) => loadConfig(e.target.value)}
          defaultValue=""
          style={{
            marginLeft: "auto",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 10,
            padding: "8px 12px",
          }}
        >
          <option value="">Charger config…</option>
          {configs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {new Date(c.created_at).toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      {/* ERROR */}
      {error && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            background: "rgba(255,0,0,0.15)",
            fontSize: 13,
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* CLIMATES */}
      <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
        {CLIMATES.map((c) => (
          <ClimateBlock key={c} climate={c} />
        ))}

        {/* ORPHANS */}
        <div
          style={{
            border: "1px dashed rgba(255,255,255,0.3)",
            borderRadius: 14,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 16, marginBottom: 8 }}>
            ⚠️ ORPHELINS · {orphans.length}
          </div>

          {orphans.length === 0 ? (
            <div style={{ opacity: 0.6, fontSize: 13 }}>
              Aucun média orphelin
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {orphans.map((a) => (
                <AssetRow key={a.id} a={a} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* NOURRISSAGE */}
      <div
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.25)",
        }}
      >
        <div style={{ fontSize: 16, marginBottom: 10 }}>
          🧠 Nourrir le paysage collectif
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {allEmojis.map(({ emoji }) => {
            const active = triad.includes(emoji);
            return (
              <button
                key={emoji}
                onClick={() => toggleEmoji(emoji)}
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
              value={injectCount}
              onChange={(e) => setInjectCount(Number(e.target.value))}
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
          onClick={injectPassages}
          disabled={triad.length !== 3}
          style={{
            marginTop: 12,
            padding: "10px 20px",
            borderRadius: 12,
            background: triad.length === 3 ? "#fff" : "#555",
            color: "#000",
            border: "none",
            cursor:
              triad.length === 3 ? "pointer" : "not-allowed",
          }}
        >
          Injecter
        </button>

        {injectStatus && (
          <div style={{ marginTop: 8, fontSize: 13 }}>
            {injectStatus}
          </div>
        )}
      </div>
    </div>
  );
}