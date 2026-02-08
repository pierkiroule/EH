import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * EmojiGraph3D
 * - graph 3D stable
 * - positions fixes (pas de saut)
 * - emojis visibles
 * - liens visibles
 * - clic sélection
 */
export default function EmojiGraph3D({
  nodes = [],
  links = [],
  selected = [],
  onSelect = () => {},
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    /* ---------- SCENE ---------- */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 18;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    /* ---------- LIGHT ---------- */
    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    /* ---------- GROUP ---------- */
    const group = new THREE.Group();
    scene.add(group);

    /* ---------- POSITION LAYOUT (FIXE) ---------- */
    const radius = 8;
    const angleStep = (Math.PI * 2) / Math.max(nodes.length, 1);

    const nodeMeshes = {};
    const positions = {};

    nodes.forEach((node, i) => {
      const angle = i * angleStep;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (Math.random() - 0.5) * 2;

      positions[node.id] = new THREE.Vector3(x, y, z);

      /* sphere */
      const geo = new THREE.SphereGeometry(0.9, 32, 32);
      const mat = new THREE.MeshBasicMaterial({
        color: selected.includes(node.id) ? 0xffffff : 0x444444,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.userData = { id: node.id };

      group.add(mesh);
      nodeMeshes[node.id] = mesh;

      /* emoji sprite */
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      ctx.font = "96px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.id, 64, 64);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(3, 3, 1);
      sprite.position.set(x, y + 1.6, z);

      group.add(sprite);
    });

    /* ---------- LINKS ---------- */
    links.forEach((l) => {
      const a = positions[l.source];
      const b = positions[l.target];
      if (!a || !b) return;

      const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
      const mat = new THREE.LineBasicMaterial({
        color: 0x666666,
        transparent: true,
        opacity: Math.min(0.2 + (l.value || 1) * 0.05, 0.8),
      });

      const line = new THREE.Line(geo, mat);
      group.add(line);
    });

    /* ---------- RAYCAST (CLICK) ---------- */
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onClick(e) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(group.children);

      if (hits.length > 0) {
        const id = hits[0].object.userData?.id;
        if (id) onSelect(id);
      }
    }

    window.addEventListener("click", onClick);

    /* ---------- LOOP ---------- */
    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    /* ---------- RESIZE ---------- */
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onResize);

    /* ---------- CLEANUP ---------- */
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mountRef.current.removeChild(renderer.domElement);
    };
  }, [nodes, links, selected, onSelect]);

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
      }}
    />
  );
}
