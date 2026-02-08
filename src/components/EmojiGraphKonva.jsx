import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Text, Line, Circle, Group } from "react-konva";

/**
 * EmojiGraphKonva — SAFE VERSION
 */

export default function EmojiGraphKonva({
  nodes = [],
  links = [],
  selected = [],
  onToggle = () => {},
  width = 360,
  height = 420,
}) {
  if (!width || !height) {
    return (
      <div style={{ color: "red", padding: 20 }}>
        ❌ Graph size undefined
      </div>
    );
  }

  const safeNodes = useMemo(() => {
    if (!nodes.length) {
      return [
        { id: "🌊", x: width / 2 - 60, y: height / 2, occurrences: 1 },
        { id: "🔥", x: width / 2 + 60, y: height / 2, occurrences: 1 },
      ];
    }

    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) * 0.28;

    return nodes.map((n, i) => {
      const a = (i / nodes.length) * Math.PI * 2;
      return {
        ...n,
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r,
        occurrences: n.occurrences || 1,
      };
    });
  }, [nodes, width, height]);

  const posMap = Object.fromEntries(
    safeNodes.map((n) => [n.id, n])
  );

  return (
    <Stage
      width={width}
      height={height}
      style={{
        background: "#000",
        borderRadius: 18,
      }}
    >
      {/* LINKS */}
      <Layer listening={false}>
        {links.map((l, i) => {
          const a = posMap[l.source];
          const b = posMap[l.target];
          if (!a || !b) return null;

          return (
            <Line
              key={i}
              points={[a.x, a.y, b.x, b.y]}
              stroke="#5f7cff"
              strokeWidth={1 + Math.sqrt(l.weight || 1)}
              opacity={0.25}
            />
          );
        })}
      </Layer>

      {/* NODES */}
      <Layer>
        {safeNodes.map((n) => {
          const r = 14 + Math.min(24, n.occurrences * 2);
          const active = selected.includes(n.id);

          return (
            <Group
              key={n.id}
              x={n.x}
              y={n.y}
              onClick={() => onToggle(n.id)}
              onTap={() => onToggle(n.id)}
            >
              {active && (
                <Circle
                  radius={r + 6}
                  stroke="#fff"
                  strokeWidth={2}
                  opacity={0.9}
                />
              )}

              <Circle
                radius={r}
                fill="#111"
                stroke="#aaa"
                strokeWidth={1}
              />

              <Text
                text={n.id}
                fontSize={r * 1.4}
                offsetX={(r * 1.4) / 2}
                offsetY={(r * 1.4) / 2}
                fill="#fff"
              />
            </Group>
          );
        })}
      </Layer>
    </Stage>
  );
}
