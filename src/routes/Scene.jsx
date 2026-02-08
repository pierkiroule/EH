import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import * as THREE from "three";
import { supabase } from "../lib/supabase";

/* ================== CONFIG ================== */

const BUCKET = "scenes-media";
const BASE_URL = import.meta.env.VITE_SUPABASE_URL;
const DEBUG_MEDIA = true;

function publicUrl(path) {
  return `${BASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

/* ================== SHADERS ================== */

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FRAG_FALLBACK = `
precision mediump float;
uniform float uTime;
uniform float uIntensity;
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float d = distance(uv, vec2(0.5));
  float glow = smoothstep(0.6, 0.2, d);
  float pulse = 0.04 * sin(uTime * 0.8) * uIntensity;
  vec3 col = vec3(0.03,0.04,0.07) + glow * vec3(0.1 + pulse);
  gl_FragColor = vec4(col,1.0);
}
`;

/* ================== SCENE ================== */

export default function Scene() {
  const { id } = useParams();
  const mountRef = useRef(null);

  const [descriptor, setDescriptor] = useState(null);
  const [started, setStarted] = useState(false);
  const [activeText, setActiveText] = useState(null);
  const [error, setError] = useState(null);

  const [debug, setDebug] = useState({
    shader: "fallback",
    music: null,
    voices: 0,
    texts: 0,
  });

  const rafRef = useRef(null);
  const videoRef = useRef(null);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const freqRef = useRef(null);
  const sourcesRef = useRef([]);
  const timersRef = useRef([]);

  /* ================== LOAD DESCRIPTOR ================== */

  useEffect(() => {
    supabase
      .from("scenes")
      .select("scene_descriptor")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setDescriptor(data.scene_descriptor);
      });
  }, [id]);

  /* ================== THREE INIT ================== */

  useEffect(() => {
    if (!descriptor || !mountRef.current) return;

    const mount = mountRef.current;
    // 🔥 FIX ABSOLU : le conteneur Three ne capte JAMAIS les events
mount.style.pointerEvents = "none";
    let disposed = false;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 1);

    // 🔥 FIX CRITIQUE : laisse passer les clics vers React
    renderer.domElement.style.pointerEvents = "none";

    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.z = 5;

    /* ---------- SHADER BACKGROUND ---------- */

    const uniforms = {
      uTime: { value: 0 },
      uIntensity: { value: descriptor.fx?.[0]?.intensity ?? 0.6 },
      uResolution: {
        value: new THREE.Vector2(mount.clientWidth, mount.clientHeight),
      },
    };

    const bgMat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG_FALLBACK,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });

    const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
    bg.position.z = -2;
    scene.add(bg);

    /* ---------- LOAD SHADER FROM DESCRIPTOR ---------- */

    const shaderPath = descriptor?.fx?.[0]?.shader || null;
    if (shaderPath) {
      fetch(publicUrl(shaderPath))
        .then((r) => r.text())
        .then((frag) => {
          if (disposed) return;
          bgMat.fragmentShader = frag;
          bgMat.needsUpdate = true;
          setDebug((d) => ({ ...d, shader: shaderPath }));
        })
        .catch((e) => console.error("Shader load error:", shaderPath, e));
    }

    /* ---------- VIDEO ---------- */

    const videoPath = descriptor.videos?.[0]?.path;
    const video = document.createElement("video");
    video.src = videoPath ? publicUrl(videoPath) : "";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    videoRef.current = video;

    const videoTex = new THREE.VideoTexture(video);
    const videoMesh = new THREE.Mesh(
      new THREE.CircleGeometry(1.6, 96),
      new THREE.MeshBasicMaterial({ map: videoTex })
    );
    videoMesh.position.z = -0.2;
    scene.add(videoMesh);

    /* ---------- PARTICLES ---------- */

    const count = 2000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.02,
      opacity: 0.6,
      transparent: true,
      depthWrite: false,
    });

    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    /* ---------- RESIZE ---------- */

    const onResize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w, h);
    };
    window.addEventListener("resize", onResize);

    /* ---------- LOOP ---------- */

    const clock = new THREE.Clock();

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      uniforms.uTime.value = clock.getElapsedTime();

      if (analyserRef.current && freqRef.current) {
        analyserRef.current.getByteFrequencyData(freqRef.current);
        const avg =
          freqRef.current.reduce((a, b) => a + b, 0) /
          (freqRef.current.length * 255);

        uniforms.uIntensity.value = 0.2 + avg * 0.8;
        particles.material.size = 0.015 + avg * 0.05;
        videoMesh.scale.setScalar(1 + avg * 0.05);
      }

      particles.rotation.y += 0.0003;
      renderer.render(scene, camera);
    };
    animate();

    /* ---------- CLEANUP ---------- */

    return () => {
      disposed = true;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);

      timersRef.current.forEach(clearTimeout);
      sourcesRef.current.forEach((s) => s.stop?.());
      audioCtxRef.current?.close();

      video.pause();
      videoTex.dispose();
      pGeo.dispose();
      pMat.dispose();
      bgMat.dispose();
      renderer.dispose();

      renderer.domElement.remove();
    };
  }, [descriptor]);

  /* ================== START EXPERIENCE ================== */

  const start = async () => {
    if (started || !descriptor) return;
    setStarted(true);

    await videoRef.current?.play().catch(() => {});

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.9;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyserRef.current = analyser;
    freqRef.current = new Uint8Array(analyser.frequencyBinCount);

    master.connect(analyser);
    analyser.connect(ctx.destination);

    /* MUSIC */
    try {
      const buf = await fetch(publicUrl(descriptor.music.path))
        .then((r) => r.arrayBuffer())
        .then((b) => ctx.decodeAudioData(b));

      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(master);
      src.start();

      setDebug((d) => ({ ...d, music: descriptor.music.path }));
      sourcesRef.current.push(src);
    } catch {}

    /* VOICES */
    descriptor.voices?.forEach((v, i) => {
      const t = setTimeout(async () => {
        const buf = await fetch(publicUrl(v.path))
          .then((r) => r.arrayBuffer())
          .then((b) => ctx.decodeAudioData(b));

        const src = ctx.createBufferSource();
        const g = ctx.createGain();
        g.gain.value = v.gain ?? 0.8;

        src.buffer = buf;
        src.connect(g);
        g.connect(master);
        src.start();

        setDebug((d) => ({ ...d, voices: d.voices + 1 }));
        sourcesRef.current.push(src);
      }, i * 800);

      timersRef.current.push(t);
    });

    /* TEXTS */
    descriptor.texts?.forEach((t, i) => {
      const show = setTimeout(async () => {
        const txt = await fetch(publicUrl(t.path)).then((r) => r.text());
        setActiveText(txt);
        setDebug((d) => ({ ...d, texts: d.texts + 1 }));
        setTimeout(() => setActiveText(null), 1000);
      }, i * 1200);

      timersRef.current.push(show);
    });
  };

  /* ================== UI ================== */

  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!descriptor) return <div style={{ color: "white" }}>Chargement…</div>;

  return (
    <div style={{ position: "fixed", inset: 0, background: "black" }}>
      <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />

      {!started && (
        <div
          onClick={start}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            background: "rgba(0,0,0,0.85)",
            color: "white",
            fontSize: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          Entrer
        </div>
      )}

      {activeText && (
        <div
          style={{
            position: "absolute",
            bottom: "18%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.6)",
            padding: 16,
            borderRadius: 16,
            color: "white",
          }}
        >
          {activeText}
        </div>
      )}

      {DEBUG_MEDIA && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            background: "rgba(0,0,0,0.7)",
            color: "#0f0",
            fontSize: 12,
            padding: 10,
            borderRadius: 8,
            zIndex: 20,
          }}
        >
          <div>🎨 shader: {debug.shader}</div>
          <div>🎵 music: {debug.music}</div>
          <div>🗣 voices: {debug.voices}</div>
          <div>📝 texts: {debug.texts}</div>
        </div>
      )}
    </div>
  );
}