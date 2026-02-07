import { useEffect, useRef } from "react";
import * as d3 from "d3";

/**
 * EmojiGraph
 * - fond symbolique collectif
 * - toujours visible
 * - non intrusif
 * - draggable (ludique)
 */
export default function EmojiGraph({ nodes = [], links = [] }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || nodes.length === 0) return;

    const width = ref.current.clientWidth || 360;
    const height = ref.current.clientHeight || 520;

    d3.select(ref.current).selectAll("*").remove();

    const svg = d3
      .select(ref.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("background", "#000")
      .style("opacity", 0.5); // 🌫 fond respirant

    const safeNodes = nodes.map((n) => ({
      ...n,
      size: n.size || 14,
    }));

    const safeLinks = links.map((l) => ({
      ...l,
      value: l.value || 1,
    }));

    const simulation = d3
      .forceSimulation(safeNodes)
      .force(
        "link",
        d3
          .forceLink(safeLinks)
          .id((d) => d.id)
          .distance(120)
          .strength((d) => Math.min((d.value || 1) / 12, 0.5))
      )
      .force("charge", d3.forceManyBody().strength(-220))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d) => d.size + 12)
      );

    const link = svg
      .append("g")
      .attr("stroke", "#8b8f9a")
      .attr("stroke-opacity", 0.5)
      .attr("stroke-linecap", "round")
      .selectAll("line")
      .data(safeLinks)
      .join("line")
      .attr("stroke-width", (d) =>
        Math.max(1, Math.sqrt(d.value || 1))
      );

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
      );

    node
      .append("circle")
      .attr("r", (d) => d.size)
      .attr("fill", "#222")
      .attr("stroke", "#aaa")
      .attr("stroke-width", 1);

    node
      .append("text")
      .text((d) => d.id)
      .attr("font-size", (d) => d.size + 8)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("pointer-events", "none")
      .attr("fill", "#eee");

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
  }, [nodes, links]);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height: "100%",
        margin: "0 auto",
        pointerEvents: "auto", // 🌌 graph vivant
      }}
    />
  );
}
