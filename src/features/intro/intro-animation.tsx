"use client";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const NODES = [
  {
    id: 1,
    x: 48,
    y: 168,
    label: "trigger",
    color: "#6366f1",
    accent: "#a5b4fc",
  },
  {
    id: 2,
    x: 238,
    y: 68,
    label: "process",
    color: "#6366f1",
    accent: "#a5b4fc",
  },
  {
    id: 3,
    x: 238,
    y: 268,
    label: "process",
    color: "#6366f1",
    accent: "#a5b4fc",
  },
  {
    id: 4,
    x: 428,
    y: 68,
    label: "action",
    color: "#22d3ee",
    accent: "#67e8f9",
  },
  {
    id: 5,
    x: 548,
    y: 238,
    label: "output",
    color: "#22d3ee",
    accent: "#67e8f9",
  },
];

const NODE_DELAYS = [0.3, 1.1, 1.1, 2.4, 3.6];

// n8n-style bezier: exit right from source, enter left into target
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.abs(x2 - x1) * 0.6;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

const EDGES = [
  { path: cubicBezier(132, 210, 238, 110), color: "#6366f1", delay: 1.65 },
  { path: cubicBezier(132, 210, 238, 310), color: "#6366f1", delay: 1.65 },
  { path: cubicBezier(322, 110, 428, 110), color: "#22d3ee", delay: 2.95 },
  { path: cubicBezier(512, 110, 548, 280), color: "#22d3ee", delay: 4.1 },
];

function Node({ node, delay }: { node: (typeof NODES)[0]; delay: number }) {
  const W = 84,
    H = 84,
    R = 16;
  const cx = node.x + W / 2;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.45, type: "spring", bounce: 0.45 }}
      style={{ transformOrigin: `${cx}px ${node.y + H / 2}px` }}
    >
      <rect
        x={node.x}
        y={node.y}
        width={W}
        height={H}
        rx={R}
        fill="#1e1e2e"
        stroke={node.color}
        strokeWidth="2"
      />
      <rect
        x={node.x}
        y={node.y}
        width={W}
        height={28}
        rx={0}
        fill={`${node.color}33`}
      />
      <line
        x1={node.x}
        y1={node.y + 28}
        x2={node.x + W}
        y2={node.y + 28}
        stroke={`${node.color}30`}
        strokeWidth="0.5"
      />
      <text
        x={cx}
        y={node.y + 18}
        textAnchor="middle"
        fill={node.accent}
        fontSize="11"
        fontFamily="monospace"
        fontWeight="600"
      >
        {node.label}
      </text>
      <text
        x={cx}
        y={node.y + 56}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize="22"
        fontWeight="700"
        fontFamily="monospace"
      >
        {node.id}
      </text>
      {/* Output port */}
      <circle
        cx={node.x + W}
        cy={node.y + H / 2}
        r={5}
        fill="#1e1e2e"
        stroke={node.color}
        strokeWidth="1.5"
      />
      {/* Input port (not on node 1) */}
      {node.id !== 1 && (
        <circle
          cx={node.x}
          cy={node.y + H / 2}
          r={5}
          fill="#1e1e2e"
          stroke={node.color}
          strokeWidth="1.5"
        />
      )}
    </motion.g>
  );
}

export default function IntroPage() {
  const router = useRouter();

  return (
    <div className="h-screen flex items-center justify-center bg-[#0f0f13]">
      <svg width="680" height="420" viewBox="0 0 680 420">
        <defs>
          {["#6366f1", "#22d3ee"].map((color, i) => (
            <marker
              key={i}
              id={`arrow-${i}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path
                d="M2 2L8 5L2 8"
                fill="none"
                stroke={color}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </marker>
          ))}
        </defs>

        {/* Grid */}
        {[70, 140, 210, 280, 350].map((y) => (
          <line
            key={y}
            x1="20"
            x2="660"
            y1={y}
            y2={y}
            stroke="#ffffff05"
            strokeWidth="1"
          />
        ))}
        {[113, 226, 339, 452, 565].map((x) => (
          <line
            key={x}
            x1={x}
            y1="20"
            x2={x}
            y2="400"
            stroke="#ffffff05"
            strokeWidth="1"
          />
        ))}

        {/* Edges */}
        {EDGES.map((e, i) => (
          <motion.path
            key={i}
            d={e.path}
            stroke={e.color}
            strokeWidth="2"
            fill="none"
            markerEnd={`url(#arrow-${e.color === "#6366f1" ? 0 : 1})`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { delay: e.delay, duration: 0.55, ease: "easeInOut" },
              opacity: { delay: e.delay, duration: 0.01 },
            }}
            onAnimationComplete={() => {
              if (i === EDGES.length - 1) {
                router.push("/workflows");
              }
            }}
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
