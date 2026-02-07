import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function DreamBubble() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    mount.appendChild(renderer.domElement);

    // Scene + camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 2;

    // ---- VIDEO ----
    const video = document.createElement("video");
    video.src =
      "https://csfaomneqzberrbvntvq.supabase.co/storage/v1/object/public/scenes-media/video/loop-01.mp4";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.crossOrigin = "anonymous";

    let texture = null;

    // ---- GEOMETRY ----
    const geometry = new THREE.PlaneGeometry(1.6, 0.9);
    const material = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // ---- START OVERLAY ----
    const overlay = document.createElement("div");
    overlay.innerText = "Tap to start video";
    Object.assign(overlay.style, {
      position: "fixed",
      inset: 0,
      background: "black",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      zIndex: 9999,
    });

    overlay.onclick = async () => {
      overlay.remove();

      // ⚠️ CRITIQUE : play AVANT texture
      await video.play();

      texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBFormat;
      texture.needsUpdate = true;

      material.map = texture;
      material.needsUpdate = true;
    };

    document.body.appendChild(overlay);

    // ---- LOOP ----
    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (texture) texture.needsUpdate = true;
      renderer.render(scene, camera);
    };
    animate();

    // ---- CLEANUP ----
    return () => {
      cancelAnimationFrame(raf);
      video.pause();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        inset: 0,
        background: "black",
      }}
    />
  );
}