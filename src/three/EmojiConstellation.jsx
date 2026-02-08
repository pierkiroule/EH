import * as THREE from "three";
import { useEffect, useRef } from "react";

export default function EmojiConstellation({
  nodes = [],
  links = [],
  selected = [],
  onSelect,
}) {
  const mountRef = useRef(null);
  const meshesRef = useRef([]);
  const linesRef = useRef([]);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current || nodes.length === 0) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 10;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));

    /* ---------- NODES ---------- */
    meshesRef.current = [];
    nodes.forEach((n) => {
      const geo = new THREE.CircleGeometry(0.35, 32);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x777777,
        transparent: true,
        opacity: 0.5,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(n.x, n.y, n.z);
      mesh.userData.id = n.id;

      scene.add(mesh);
      meshesRef.current.push(mesh);
    });

    /* ---------- LINKS ---------- */
    linesRef.current = [];
    links.forEach((l) => {
      const a = nodes.find((n) => n.id === l.source);
      const b = nodes.find((n) => n.id === l.target);
      if (!a || !b) return;

      const points = [
        new THREE.Vector3(a.x, a.y, a.z),
        new THREE.Vector3(b.x, b.y, b.z),
      ];

      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: Math.min(0.15 + l.value * 0.05, 0.4),
      });

      const line = new THREE.Line(geo, mat);
      scene.add(line);
      linesRef.current.push(line);
    });

    /* ---------- RENDER ---------- */
    const render = () => {
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    };
    render();

    /* ---------- PICKING ---------- */
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handleClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(meshesRef.current);
      if (hits.length && onSelect) {
        onSelect(hits[0].object.userData.id);
      }
    };

    renderer.domElement.addEventListener("pointerdown", handleClick);

    return () => {
      renderer.domElement.removeEventListener("pointerdown", handleClick);
      renderer.dispose();
      mountRef.current.innerHTML = "";
      meshesRef.current = [];
      linesRef.current = [];
    };
  }, [nodes, links]);

  /* ---------- SELECTION (NO MOVE) ---------- */
  useEffect(() => {
    meshesRef.current.forEach((m) => {
      const active = selected.includes(m.userData.id);
      m.material.opacity = active ? 0.95 : 0.45;
      m.material.color.set(active ? 0xffffff : 0x666666);
      m.scale.setScalar(active ? 1.25 : 1);
    });
  }, [selected]);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100%", touchAction: "none" }}
    />
  );
}
