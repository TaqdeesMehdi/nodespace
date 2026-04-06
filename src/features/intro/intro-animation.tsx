"use client";
import { motion, useAnimate } from "framer-motion";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const NODES = [
  {
    id: 1,
    x: 20,
    y: 134,
    label: "WEBHOOK",
    sublabel: "New order",
    icon: "⚡",
    color: "#7c73e6",
    accent: "#a5b4fc",
  },
  {
    id: 2,
    x: 190,
    y: 64,
    label: "IF",
    sublabel: "High value?",
    icon: "⚙︎",
    color: "#7c73e6",
    accent: "#a5b4fc",
  },
  {
    id: 3,
    x: 190,
    y: 204,
    label: "HTTP",
    sublabel: "Enrich data",
    icon: "🌐",
    color: "#7c73e6",
    accent: "#a5b4fc",
  },
  {
    id: 4,
    x: 370,
    y: 64,
    label: "SLACK",
    sublabel: "Notify team",
    icon: "💬",
    color: "#22d3ee",
    accent: "#67e8f9",
  },
  {
    id: 5,
    x: 370,
    y: 204,
    label: "Discord",
    sublabel: "Get Notified",
    icon: "🗄️",
    color: "#22d3ee",
    accent: "#67e8f9",
  },
  {
    id: 6,
    x: 560,
    y: 134,
    label: "RESPOND",
    sublabel: "200 OK",
    icon: "✅",
    color: "#4ade80",
    accent: "#86efac",
  },
];

const NODE_W = 96;
const NODE_H = 82;

const outPort = (node: (typeof NODES)[0]) => ({
  x: node.x + NODE_W,
  y: node.y + NODE_H / 2,
});
const inPort = (node: (typeof NODES)[0]) => ({
  x: node.x,
  y: node.y + NODE_H / 2,
});

function bezier(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.abs(x2 - x1) * 0.55;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

const EDGES = [
  { from: 0, to: 1, color: "#7c73e6", markerId: "arr-purple", delay: 0.6 },
  { from: 0, to: 2, color: "#7c73e6", markerId: "arr-purple", delay: 0.7 },
  { from: 1, to: 3, color: "#22d3ee", markerId: "arr-cyan", delay: 2.3 },
  { from: 2, to: 4, color: "#22d3ee", markerId: "arr-cyan", delay: 2.4 },
  { from: 3, to: 5, color: "#4ade80", markerId: "arr-green", delay: 3.8 },
  { from: 4, to: 5, color: "#4ade80", markerId: "arr-green", delay: 3.9 },
];

const NODE_DELAYS = [0, 1.5, 1.6, 3.0, 3.1, 4.8];
const GRID_Y = [57, 114, 171, 228, 285];
const GRID_X = [78, 156, 234, 312, 390, 468, 546, 624, 702];

function Node({ node, delay }: { node: (typeof NODES)[0]; delay: number }) {
  const cx = node.x + NODE_W / 2;
  const cy = node.y + NODE_H / 2;
  const hasInput = node.id !== 1;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, type: "spring", bounce: 0.5 }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      <rect
        x={node.x + 1}
        y={node.y + 1}
        width={NODE_W}
        height={NODE_H}
        rx={14}
        fill={node.color}
        opacity={0.15}
      />
      <rect
        x={node.x}
        y={node.y}
        width={NODE_W}
        height={NODE_H}
        rx={14}
        fill="#1a1a2e"
        stroke={node.color}
        strokeWidth={1.5}
      />
      <rect
        x={node.x}
        y={node.y}
        width={NODE_W}
        height={26}
        rx={14}
        fill={`${node.color}20`}
      />
      <rect
        x={node.x}
        y={node.y + 14}
        width={NODE_W}
        height={12}
        fill={`${node.color}20`}
      />
      <line
        x1={node.x}
        y1={node.y + 26}
        x2={node.x + NODE_W}
        y2={node.y + 26}
        stroke={`${node.color}40`}
        strokeWidth={0.5}
      />
      <text
        x={cx}
        y={node.y + 17}
        textAnchor="middle"
        fill={node.accent}
        fontSize={10}
        fontFamily="monospace"
        fontWeight={700}
        letterSpacing={0.5}
      >
        {node.label}
      </text>
      <text
        x={cx}
        y={node.y + 55}
        textAnchor="middle"
        fontSize={22}
        fill={node.accent}
      >
        {node.icon}
      </text>
      <circle
        cx={node.x + NODE_W}
        cy={cy}
        r={5}
        fill="#1a1a2e"
        stroke={node.color}
        strokeWidth={1.5}
      />
      {hasInput && (
        <circle
          cx={node.x}
          cy={cy}
          r={5}
          fill="#1a1a2e"
          stroke={node.color}
          strokeWidth={1.5}
        />
      )}
      <circle cx={node.x + NODE_W - 12} cy={node.y + 6} r={4} fill="#4ade80" />
    </motion.g>
  );
}

function Packet({
  path,
  color,
  delay,
}: {
  path: string;
  color: string;
  delay: number;
}) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    const run = async () => {
      await new Promise((r) => setTimeout(r, delay * 1000));
      if (!scope.current) return;

      // reset
      scope.current.style.offsetPath = `path('${path}')`;
      scope.current.style.offsetDistance = "0%";
      scope.current.style.opacity = "0";

      await animate(scope.current, { opacity: 1 }, { duration: 0.05 });
      await animate(scope.current, { offsetDistance: "100%" } as any, {
        duration: 0.85,
        ease: "easeInOut",
      });
      await animate(scope.current, { opacity: 0 }, { duration: 0.1 });
    };
    run();
  }, [path, delay]);

  return (
    <circle
      ref={scope}
      r={5}
      fill={color}
      style={
        {
          offsetPath: `path('${path}')`,
          offsetDistance: "0%",
          opacity: 0,
        } as React.CSSProperties
      }
    />
  );
}

export default function IntroPage() {
  const router = useRouter();

  const edgePaths = EDGES.map((e) => {
    const o = outPort(NODES[e.from]);
    const i = inPort(NODES[e.to]);
    return bezier(o.x, o.y, i.x, i.y);
  });

  const packetColor = (edgeColor: string) => {
    if (edgeColor === "#7c73e6") return "#a5b4fc";
    if (edgeColor === "#22d3ee") return "#67e8f9";
    return "#86efac";
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#0f0f13]">
      <svg width="780" height="340" viewBox="0 0 780 340">
        <defs>
          {[
            { id: "arr-purple", color: "#7c73e6" },
            { id: "arr-cyan", color: "#22d3ee" },
            { id: "arr-green", color: "#4ade80" },
          ].map(({ id, color }) => (
            <marker
              key={id}
              id={id}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path
                d="M2 1L8 5L2 9"
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </marker>
          ))}
        </defs>

        {/* Grid */}
        <g opacity={0.03} stroke="#ffffff">
          {GRID_Y.map((y) => (
            <line key={y} x1="0" x2="780" y1={y} y2={y} strokeWidth={1} />
          ))}
          {GRID_X.map((x) => (
            <line key={x} x1={x} x2={x} y1="0" y2="340" strokeWidth={1} />
          ))}
        </g>

        {/* Edges */}
        {EDGES.map((e, i) => (
          <motion.path
            key={i}
            d={edgePaths[i]}
            stroke={e.color}
            strokeWidth={2}
            fill="none"
            markerEnd={`url(#${e.markerId})`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { delay: e.delay, duration: 0.6, ease: "easeInOut" },
              opacity: { delay: e.delay, duration: 0.01 },
            }}
            onAnimationComplete={() => {
              if (i === EDGES.length - 1) router.push("/workflows");
            }}
          />
        ))}

        {/* Packets */}
        {EDGES.map((e, i) => (
          <Packet
            key={i}
            path={edgePaths[i]}
            color={packetColor(e.color)}
            delay={e.delay + 0.5}
          />
        ))}

        {/* Nodes */}
        {NODES.map((node, i) => (
          <Node key={node.id} node={node} delay={NODE_DELAYS[i]} />
        ))}
      </svg>
    </div>
  );
}
