import { useEffect, useRef } from "react";
import * as d3 from "d3";

/**
 * EmojiGraph — Inconscient collectif
 * - occ  → taille / opacité des noeuds
 * - cooc → épaisseur / opacité des liens
 * - stable (pas de resimulation à la sélection)
 * - draggable
 */
export default function EmojiGraph({
  nodes = [],
  links = [],
  selected = [],
  onToggle = () => {},
}) {
  const ref = useRef(null);
  const simRef = useRef(null);

  useEffect(() => {
    if (!ref.current || nodes.length === 0) return;

    const width = ref.current.clientWidth || 360;
    const height = 420;

    d3.select(ref.current).selectAll("*").remove();

    /* ---------- SVG ---------- */
    const svg = d3
      .select(ref.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background", "#000");

    /* ---------- NORMALISATION ---------- */
    const maxOcc =
      d3.max(nodes, (d) => d.occurrences || 1) || 1;
    const maxCooc =
      d3.max(links, (d) => d.value || 1) || 1;

    const safeNodes = nodes.map((n) => ({
      ...n,
      occ: n.occurrences || 1,
      r: 10 + (n.occurrences || 1) / maxOcc * 16,
    }));

    const safeLinks = links.map((l) => ({
      ...l,
      w: l.value || 1,
    }));

    /* ---------- SIMULATION (1 fois) ---------- */
    const simulation = d3
      .forceSimulation(safeNodes)
      .force(
        "link",
        d3
          .forceLink(safeLinks)
          .id((d) => d.id)
          .distance(90)
          .strength((d) => Math.min(d.w / maxCooc, 0.6))
      )
      .force("charge", d3.forceManyBody().strength(-220))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d) => d.r + 10)
      );

    simRef.current = simulation;

    /* ---------- LIENS ---------- */
    const link = svg
      .append("g")
      .selectAll("line")
      .data(safeLinks)
      .join("line")
      .attr("stroke", "#888")
      .attr("stroke-width", (d) =>
        0.5 + (d.w / maxCooc) * 4
      )
      .attr("stroke-opacity", (d) =>
        0.15 + (d.w / maxCooc) * 0.45
      );

    /* ---------- NOEUDS ---------- */
    const node = svg
      .append("g")
      .selectAll("g")
      .data(safeNodes)
      .join("g")
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      )
      .on("click", (_, d) => onToggle(d.id));

    node
      .append("circle")
      .attr("r", (d) => d.r)
      .attr("fill", "#111")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.2)
      .attr("opacity", (d) =>
        0.4 + (d.occ / maxOcc) * 0.6
      );

    node
      .append("text")
      .text((d) => d.id)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", (d) => d.r + 6)
      .attr("fill", "#fff")
      .attr("pointer-events", "none");

    /* ---------- TICK ---------- */
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr(
        "transform",
        (d) => `translate(${d.x},${d.y})`
      );
    });

    /* ---------- DRAG ---------- */
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [nodes, links, onToggle]);

  /* ---------- SELECTION VISUELLE (SANS RELANCER SIM) ---------- */
  useEffect(() => {
    if (!ref.current) return;

    d3.select(ref.current)
      .selectAll("circle")
      .attr("stroke", (d) =>
        selected.includes(d.id) ? "#00ffd5" : "#fff"
      )
      .attr("stroke-width", (d) =>
        selected.includes(d.id) ? 3 : 1.2
      );
  }, [selected]);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        maxWidth: 720,
        height: 420,
        margin: "0 auto",
        touchAction: "none",
      }}
    />
  );
}
