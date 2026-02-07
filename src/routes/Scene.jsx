import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import * as THREE from "three";
import { supabase } from "../lib/supabase";

/* ------------------ CONFIG ------------------ */

const BUCKET = "scenes-media";
const BASE_URL = import.meta.env.VITE_SUPABASE_URL;

function publicUrl(path) {
  return `${BASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

/* ------------------ SCENE ------------------ */

export default function Scene() {
  const { id } = useParams();
  const mountRef = useRef(null);

  const [descriptor, setDescriptor] = useState(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(null);

  /* -------- refs -------- */
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rafRef = useRef(null);

  const videoRef = useRef(null);
  const videoTexRef = useRef(null);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const freqRef = useRef(null);
  const masterRef = useRef(null);
  const sourcesRef = useRef([]);
  const timersRef = useRef([]);

  const particlesRef = useRef(null);

  /* ------------------ LOAD SCENE ------------------ */

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

  /* ------------------ THREE INIT ------------------ */

  useEffect(() => {
    if (!descriptor || !mountRef.current) return;

    if (!descriptor.videos || descriptor.videos.length === 0) {
      setError("Aucune vidéo disponible pour cette scène.");
      return;
    }

    if (!descriptor.music?.path) {
      setError("Musique manquante pour cette scène.");
      return;
    }

    const mount = mountRef.current;

    /* --- renderer --- */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.domElement.style.pointerEvents = "auto";
    mount.appendChild(renderer.domElement);

    /* --- scene & camera --- */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      200
    );
    camera.position.z = 5;

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;

    /* --- VIDEO (disque) --- */
    const video = document.createElement("video");
    video.src = publicUrl(descriptor.videos[0].path);
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.preload = "auto";

    videoRef.current = video;

    const videoTex = new THREE.VideoTexture(video);
    videoTex.minFilter = THREE.LinearFilter;
    videoTex.magFilter = THREE.LinearFilter;
    videoTexRef.current = videoTex;

    const disk = new THREE.Mesh(
      new THREE.CircleGeometry(1.4, 96),
      new THREE.MeshBasicMaterial({ map: videoTex })
    );
    scene.add(disk);

    /* --- PARTICULES --- */
    const count = 3000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.03,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);
    particlesRef.current = particles;

    /* --- resize --- */
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    /* --- loop --- */
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      const analyser = analyserRef.current;
      const freq = freqRef.current;

      if (analyser && freq) {
        analyser.getByteFrequencyData(freq);
        const avg =
          freq.reduce((a, b) => a + b, 0) / (freq.length * 255);

        particles.material.size = 0.02 + avg * 0.08;
        particles.material.opacity = 0.5 + avg * 0.5;
        disk.scale.setScalar(1 + avg * 0.08);
      }

      particles.rotation.y += 0.0004;
      renderer.render(scene, camera);
    };
    animate();

    /* --- cleanup (CRITIQUE) --- */
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);

      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      sourcesRef.current.forEach((s) => {
        try {
          s.stop();
        } catch {}
      });
      sourcesRef.current = [];

      if (audioCtxRef.current) audioCtxRef.current.close();

      try {
        video.pause();
        video.src = "";
      } catch {}

      geo.dispose();
      mat.dispose();
      disk.geometry.dispose();
      disk.material.dispose();
      videoTex.dispose();

      renderer.dispose();

      /* 🔥 FIX DÉFINITIF : retirer le canvas */
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [descriptor]);

  /* ------------------ START AUDIO ------------------ */

  const start = async () => {
    if (started || !descriptor) return;
    setStarted(true);

    try {
      await videoRef.current.play();
    } catch {}

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.9;
    masterRef.current = master;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyserRef.current = analyser;
    freqRef.current = new Uint8Array(analyser.frequencyBinCount);

    master.connect(analyser);
    analyser.connect(ctx.destination);

    const musicRes = await fetch(publicUrl(descriptor.music.path));
    const musicBuf = await ctx.decodeAudioData(await musicRes.arrayBuffer());

    const music = ctx.createBufferSource();
    music.buffer = musicBuf;
    music.loop = true;
    music.connect(master);
    music.start();

    sourcesRef.current.push(music);

    descriptor.voices.forEach((v) => {
      const t = setTimeout(async () => {
        const res = await fetch(publicUrl(v.path));
        const buf = await ctx.decodeAudioData(await res.arrayBuffer());
        const src = ctx.createBufferSource();
        const g = ctx.createGain();
        g.gain.value = v.gain || 0.6;

        src.buffer = buf;
        src.connect(g);
        g.connect(master);
        src.start();

        sourcesRef.current.push(src);
      }, v.start * 1000);

      timersRef.current.push(t);
    });
  };

  /* ------------------ UI ------------------ */

  if (error) {
    return (
      <div style={{ background: "black", color: "red", padding: 20 }}>
        ❌ {error}
      </div>
    );
  }

  if (!descriptor) {
    return (
      <div style={{ background: "black", color: "white", padding: 20 }}>
        Chargement…
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "black" }}>
      <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />

      {!started && (
        <div
          onClick={start}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && start()}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            color: "white",
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          Entrer
        </div>
      )}
    </div>
  );
}
