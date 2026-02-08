import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

/* ================== CONFIG ================== */

const BUCKET = "scenes-media";
const CLIMATES = ["calm", "deep", "luminous", "tense", "contrast"];
const PRESETS = ["Config 1", "Config 2", "Config 3"];

/* ================== HELPERS ================== */

function inferCategory(path) {
  if (path.startsWith("music/")) return "music";
  if (path.startsWith("video/")) return "video";
  if (path.startsWith("voice/")) return "voice";
  if (path.startsWith("text/")) return "text";
  if (path.startsWith("shader/")) return "shader";
  return "text";
}

/* Scan récursif du bucket (OBLIGATOIRE) */
async function listAllFiles(prefix = "") {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(prefix);

  if (error || !data) return [];

  let files = [];

  for (const item of data) {
    if (item.name.endsWith("/")) continue;

    if (item.metadata) {
      files.push(prefix + item.name);
    } else {
      const sub = await listAllFiles(prefix + item.name + "/");
      files.push(...sub);
    }
  }

  return files;
}

/* ================== COMPONENT ================== */

export default function Admin() {
  const [rows, setRows] = useState([]);
  const [bucketFiles, setBucketFiles] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);

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

  async function loadBucket() {
    const files = await listAllFiles();
    setBucketFiles(files);
  }

  useEffect(() => {
    loadAssets();
    loadConfigs();
    loadBucket();
  }, []);

  /* ================= DERIVED ================= */

  const basePaths = useMemo(
    () => new Set(rows.map((r) => r.path)),
    [rows]
  );

  const bucketOrphans = useMemo(
    () => bucketFiles.filter((p) => !basePaths.has(p)),
    [bucketFiles, basePaths]
  );

  const logicalOrphans = useMemo(
    () => rows.filter((r) => !CLIMATES.includes(r.climate)),
    [rows]
  );

  const byClimate = useMemo(() => {
    const map = {};
    CLIMATES.forEach((c) => (map[c] = []));
    rows.forEach((r) => {
      if (CLIMATES.includes(r.climate)) map[r.climate].push(r);
    });
    return map;
  }, [rows]);

  /* ================= ACTIONS ================= */

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

  async function importFromBucket(path) {
  // ignore placeholders Supabase
  if (path.includes(".emptyFolderPlaceholder")) return;

  const { error } = await supabase
    .from("media_assets")
    .insert({
      path,
      category: inferCategory(path),
      climate: "calm",          // valeur par défaut
      energy: 0.5,              // 🔧 FIX NOT NULL
      role: "background",       // 🔧 FIX NOT NULL
      enabled: false,
    });

  if (error) {
    setError(error.message);
    return;
  }

  await loadAssets();
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

  async function loadConfig(id) {
    const { data } = await supabase
      .from("admin_configs")
      .select("snapshot")
      .eq("id", id)
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

  /* ================= UI ================= */

  const AssetRow = ({ a }) => (
    <div
      style={{
        padding: 10,
        borderRadius: 10,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: 12, opacity: 0.7 }}>[{a.category}]</span>
      <span style={{ fontSize: 13, wordBreak: "break-all" }}>{a.path}</span>

      <label style={{ marginLeft: "auto" }}>
        <input
          type="checkbox"
          checked={!!a.enabled}
          onChange={(e) =>
            patchAsset(a.id, { enabled: e.target.checked })
          }
        />{" "}
        actif
      </label>

      <select
        value={a.climate || ""}
        onChange={(e) =>
          patchAsset(a.id, { climate: e.target.value })
        }
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
      <h2>ADMIN · Médias & Bucket</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {PRESETS.map((p) => (
          <button key={p} onClick={() => saveConfig(p)}>
            Sauver {p}
          </button>
        ))}

        <select onChange={(e) => loadConfig(e.target.value)}>
          <option value="">Charger config…</option>
          {configs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div style={{ color: "red" }}>❌ {error}</div>}
      {loading && <div>loading…</div>}

      {/* BUCKET ORPHANS */}
      <h3>🪣 Fichiers dans le bucket non déclarés ({bucketOrphans.length})</h3>
      {bucketOrphans.length === 0 && (
        <div style={{ opacity: 0.6 }}>Aucun</div>
      )}
      {bucketOrphans.map((p) => (
        <div key={p} style={{ display: "flex", gap: 10 }}>
          <span>{p}</span>
          <button onClick={() => importFromBucket(p)}>Importer</button>
        </div>
      ))}

      {/* LOGICAL ORPHANS */}
      <h3>⚠️ Médias sans climat ({logicalOrphans.length})</h3>
      {logicalOrphans.map((a) => (
        <AssetRow key={a.id} a={a} />
      ))}

      {/* CLIMATES */}
      {CLIMATES.map((c) => (
        <div key={c}>
          <h3>{c.toUpperCase()}</h3>
          {byClimate[c].map((a) => (
            <AssetRow key={a.id} a={a} />
          ))}
        </div>
      ))}
    </div>
  );
}