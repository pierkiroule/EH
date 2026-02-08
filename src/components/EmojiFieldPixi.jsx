import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

/**
 * EmojiFieldPixi — v2
 * - constellation stable (pas de physics)
 * - occurrences → taille + halo
 * - co-occurrences → liens passifs
 * - sélection sans déplacement
 * - responsive / mobile safe
 *
 * props:
 *  - nodes: [{ id, occurrences }]
 *  - links: [{ source, target, weight }]
 *  - selected: [emoji, emoji, emoji]
 *  - onSelect(emoji)
 */

export default function EmojiFieldPixi({
  nodes = [],
  links = [],
  selected = [],
  onSelect = () => {},
}) {
  const containerRef = useRef(null);
  const appRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    /* ---------- CLEAN ---------- */
    if (appRef.current) {
      appRef.current.destroy(true);
      appRef.current = null;
    }

    /* ---------- SIZE ---------- */
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    /* ---------- APP ---------- */
    const app = new PIXI.Application({
      width,
      height,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    appRef.current = app;
    containerRef.current.appendChild(app.view);

    /* ---------- LAYERS ---------- */
    const linkLayer = new PIXI.Container();
    const haloLayer = new PIXI.Container();
    const nodeLayer = new PIXI.Container();
    const selectLayer = new PIXI.Container();

    app.stage.addChild(linkLayer, haloLayer, nodeLayer, selectLayer);

    /* ---------- PREP NODES ---------- */
    const placed = nodes.map((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      const radius =
        Math.min(width, height) * 0.25 +
        Math.sin(i * 1.7) * 40;

      const x =
        width / 2 +
        Math.cos(angle) * radius +
        (Math.random() - 0.5) * 30;

      const y =
        height / 2 +
        Math.sin(angle) * radius +
        (Math.random() - 0.5) * 30;

      const occ = n.occurrences || 1;

      return {
        id: n.id,
        x,
        y,
        occurrences: occ,
        radius: 12 + Math.log(occ + 1) * 6,
      };
    });

    const nodeMap = Object.fromEntries(
      placed.map((n) => [n.id, n])
    );

    /* ---------- LINKS (PASSIVE) ---------- */
    links.forEach((l) => {
      const a = nodeMap[l.source];
      const b = nodeMap[l.target];
      if (!a || !b) return;

      const g = new PIXI.Graphics();
      const alpha = Math.min((l.weight || 1) / 10, 0.35);
      const thickness = Math.max(1, Math.sqrt(l.weight || 1));

      g.lineStyle(thickness, 0x88aaff, alpha);
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);

      linkLayer.addChild(g);
    });

    /* ---------- HALOS ---------- */
    placed.forEach((n) => {
      const g = new PIXI.Graphics();
      const alpha = Math.min(
        0.15 + n.occurrences * 0.02,
        0.5
      );

      g.beginFill(0xffffff, alpha);
      g.drawCircle(0, 0, n.radius * 1.9);
      g.endFill();

      g.x = n.x;
      g.y = n.y;

      haloLayer.addChild(g);
    });

    /* ---------- NODES ---------- */
    placed.forEach((n) => {
      const txt = new PIXI.Text(n.id, {
        fontSize: n.radius * 1.4,
        fill: 0xffffff,
        align: "center",
      });

      txt.anchor.set(0.5);
      txt.x = n.x;
      txt.y = n.y;
      txt.interactive = true;
      txt.buttonMode = true;

      txt.on("pointertap", () => onSelect(n.id));

      nodeLayer.addChild(txt);

      /* selection highlight */
      if (selected.includes(n.id)) {
        const sel = new PIXI.Graphics();
        sel.lineStyle(2, 0xffffff, 0.9);
        sel.drawCircle(0, 0, n.radius * 2.2);
        sel.x = n.x;
        sel.y = n.y;
        selectLayer.addChild(sel);
      }
    });

    /* ---------- BREATH ---------- */
    let t = 0;
    app.ticker.add(() => {
      t += 0.003;
      haloLayer.alpha = 0.85 + Math.sin(t) * 0.1;
    });

    /* ---------- RESIZE ---------- */
    const onResize = () => {
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      app.renderer.resize(w, h);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      app.destroy(true);
    };
  }, [nodes, links, selected, onSelect]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        touchAction: "none",
      }}
    />
  );
}
