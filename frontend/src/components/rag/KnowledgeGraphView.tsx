import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Network,
  Loader2,
  Sparkles,
  Database,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import type { KGGraphData, KGGraphNode, KGGraphEdge } from "@/types";

// ---------------------------------------------------------------------------
// Entity type → color mapping
// ---------------------------------------------------------------------------
const TYPE_COLORS: Record<string, string> = {
  person:       "#60a5fa", // blue-400
  organization: "#4ade80", // green-400
  location:     "#fbbf24", // amber-400
  event:        "#fb923c", // orange-400
  concept:      "#c084fc", // purple-400
  product:      "#f472b6", // pink-400
  technology:   "#22d3ee", // cyan-400
  financial_metric: "#a78bfa", // violet-400
  date:         "#f9a8d4", // pink-300
  regulation:   "#fcd34d", // amber-300
};

const TYPE_ICONS: Record<string, string> = {
  person:       "👤",
  organization: "🏢",
  location:     "📍",
  event:        "📅",
  concept:      "💡",
  product:      "📦",
  technology:   "⚙️",
  financial_metric: "💰",
  date:         "📆",
  regulation:   "📋",
};

function getNodeColor(type: string): string {
  return TYPE_COLORS[type.toLowerCase()] ?? "#94a3b8"; // slate-400 fallback
}

function getNodeIcon(type: string): string {
  return TYPE_ICONS[type.toLowerCase()] ?? "🔵";
}

// ---------------------------------------------------------------------------
// Mock data for demo when no real graph exists
// ---------------------------------------------------------------------------
function generateMockData(): KGGraphData {
  const mockNodes: KGGraphNode[] = [
    { id: "n1", label: "Apple Inc.", entity_type: "organization", degree: 5 },
    { id: "n2", label: "Tim Cook", entity_type: "person", degree: 3 },
    { id: "n3", label: "iPhone 16", entity_type: "product", degree: 4 },
    { id: "n4", label: "Cupertino", entity_type: "location", degree: 2 },
    { id: "n5", label: "WWDC 2025", entity_type: "event", degree: 3 },
    { id: "n6", label: "AI Chip", entity_type: "technology", degree: 3 },
    { id: "n7", label: "Revenue $391B", entity_type: "financial_metric", degree: 2 },
    { id: "n8", label: "Neural Engine", entity_type: "technology", degree: 2 },
    { id: "n9", label: "MacBook Pro", entity_type: "product", degree: 2 },
    { id: "n10", label: "GDPR", entity_type: "regulation", degree: 1 },
    { id: "n11", label: "Craig Federighi", entity_type: "person", degree: 2 },
    { id: "n12", label: "Q4 2025", entity_type: "date", degree: 1 },
  ];
  const mockEdges: KGGraphEdge[] = [
    { source: "n1", target: "n2", label: "CEO", weight: 1.0 },
    { source: "n1", target: "n3", label: "produces", weight: 0.9 },
    { source: "n1", target: "n4", label: "headquartered", weight: 0.7 },
    { source: "n1", target: "n7", label: "reports", weight: 0.8 },
    { source: "n2", target: "n5", label: "keynote", weight: 0.6 },
    { source: "n3", target: "n6", label: "powered by", weight: 0.8 },
    { source: "n5", target: "n6", label: "announced", weight: 0.7 },
    { source: "n5", target: "n11", label: "presented by", weight: 0.5 },
    { source: "n6", target: "n8", label: "includes", weight: 0.6 },
    { source: "n1", target: "n9", label: "produces", weight: 0.9 },
    { source: "n9", target: "n8", label: "powered by", weight: 0.7 },
    { source: "n1", target: "n10", label: "complies with", weight: 0.4 },
    { source: "n7", target: "n12", label: "period", weight: 0.5 },
  ];
  return { nodes: mockNodes, edges: mockEdges, is_truncated: false };
}

// ---------------------------------------------------------------------------
// Force simulation types
// ---------------------------------------------------------------------------
interface SimNode extends KGGraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null; // fixed position (dragging)
  fy: number | null;
}

// ---------------------------------------------------------------------------
// Simple force-directed layout
// ---------------------------------------------------------------------------
function initializeNodes(nodes: KGGraphNode[], width: number, height: number): SimNode[] {
  return nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    const radius = Math.min(width, height) * 0.3;
    return {
      ...n,
      x: width / 2 + radius * Math.cos(angle) + (Math.random() - 0.5) * 40,
      y: height / 2 + radius * Math.sin(angle) + (Math.random() - 0.5) * 40,
      vx: 0,
      vy: 0,
      fx: null,
      fy: null,
    };
  });
}

function simulateForces(
  nodes: SimNode[],
  edges: KGGraphEdge[],
  width: number,
  height: number,
  alpha: number
): void {
  const centerX = width / 2;
  const centerY = height / 2;

  // Repulsion between all nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = (800 * alpha) / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      nodes[i].vx -= fx;
      nodes[i].vy -= fy;
      nodes[j].vx += fx;
      nodes[j].vy += fy;
    }
  }

  // Spring force for edges
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  for (const edge of edges) {
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) continue;
    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
    const targetDist = 120;
    const force = (dist - targetDist) * 0.01 * alpha;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    src.vx += fx;
    src.vy += fy;
    tgt.vx -= fx;
    tgt.vy -= fy;
  }

  // Center gravity
  for (const node of nodes) {
    node.vx += (centerX - node.x) * 0.001 * alpha;
    node.vy += (centerY - node.y) * 0.001 * alpha;
  }

  // Apply velocities with damping
  for (const node of nodes) {
    if (node.fx !== null) {
      node.x = node.fx;
      node.vx = 0;
    } else {
      node.vx *= 0.6;
      node.x += node.vx;
      node.x = Math.max(20, Math.min(width - 20, node.x));
    }
    if (node.fy !== null) {
      node.y = node.fy;
      node.vy = 0;
    } else {
      node.vy *= 0.6;
      node.y += node.vy;
      node.y = Math.max(20, Math.min(height - 20, node.y));
    }
  }
}

// ---------------------------------------------------------------------------
// GraphCanvas — SVG rendering
// ---------------------------------------------------------------------------
interface GraphCanvasProps {
  data: KGGraphData;
  width: number;
  height: number;
  highlightEntities?: string[];
}

const GraphCanvas = memo(function GraphCanvas({ data, width, height, highlightEntities = [], isDemo = false }: GraphCanvasProps & { isDemo?: boolean }) {
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [panning, setPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const frameRef = useRef<number>(0);
  const alphaRef = useRef(1);
  const animFrameRef = useRef<number>(0);
  const particleOffsetRef = useRef(0);

  // Initialize nodes
  useEffect(() => {
    setNodes(initializeNodes(data.nodes, width, height));
    alphaRef.current = 1;
  }, [data.nodes, width, height]);

  // Run force simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const tick = () => {
      if (alphaRef.current > 0.01) {
        setNodes((prev) => {
          const next = prev.map((n) => ({ ...n }));
          simulateForces(next, data.edges, width, height, alphaRef.current);
          return next;
        });
        alphaRef.current *= 0.99;
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [nodes.length, data.edges, width, height]);

  // Continuous particle animation along edges
  useEffect(() => {
    const animate = () => {
      particleOffsetRef.current = (particleOffsetRef.current + 0.003) % 1;
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Force re-render for particle animation
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 50);
    return () => clearInterval(interval);
  }, []);

  // Node map for edge rendering
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Connected edges for hover highlight
  const connectedEdges = useMemo(() => {
    if (!hoveredNode && !selectedNode) return new Set<number>();
    const target = selectedNode || hoveredNode;
    const set = new Set<number>();
    data.edges.forEach((e, i) => {
      if (e.source === target || e.target === target) set.add(i);
    });
    return set;
  }, [hoveredNode, selectedNode, data.edges]);

  const connectedNodes = useMemo(() => {
    const target = selectedNode || hoveredNode;
    if (!target) return new Set<string>();
    const set = new Set<string>([target]);
    data.edges.forEach((e) => {
      if (e.source === target) set.add(e.target);
      if (e.target === target) set.add(e.source);
    });
    return set;
  }, [hoveredNode, selectedNode, data.edges]);

  // Drag handlers
  const handleNodeMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDragging(nodeId);
    alphaRef.current = 0.3;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      const svgRect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
      const x = (e.clientX - svgRect.left - pan.x) / zoom;
      const y = (e.clientY - svgRect.top - pan.y) / zoom;
      setNodes((prev) =>
        prev.map((n) => (n.id === dragging ? { ...n, fx: x, fy: y, x, y } : n))
      );
    } else if (panning) {
      setPan({
        x: panStart.current.panX + (e.clientX - panStart.current.x),
        y: panStart.current.panY + (e.clientY - panStart.current.y),
      });
    }
  }, [dragging, panning, pan.x, pan.y, zoom]);

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      setNodes((prev) =>
        prev.map((n) => (n.id === dragging ? { ...n, fx: null, fy: null } : n))
      );
      setDragging(null);
    }
    setPanning(false);
  }, [dragging]);

  const handleSvgMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as Element).tagName === "rect") {
      setPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      setSelectedNode(null);
    }
  }, [pan]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)));
  }, []);

  // Node radius based on degree
  const getRadius = useCallback((degree: number) => {
    return Math.max(8, Math.min(22, 8 + degree * 2));
  }, []);

  const offset = particleOffsetRef.current;

  return (
    <div className="relative w-full h-full">
      {/* Demo badge */}
      {isDemo && (
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">DEMO DATA</span>
        </div>
      )}

      {/* DB badge */}
      <div className={`absolute z-10 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm border rounded-full px-3 py-1 ${isDemo ? 'top-2 left-[140px]' : 'top-2 left-2'}`}>
        <Database className="w-3 h-3 text-emerald-500" />
        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Neo4j</span>
        <span className="text-[10px] text-muted-foreground">{data.nodes.length} nodes · {data.edges.length} edges</span>
      </div>

      {/* Zoom controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        <button
          onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
          className="p-1.5 rounded-md border bg-background/80 backdrop-blur-sm hover:bg-muted transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}
          className="p-1.5 rounded-md border bg-background/80 backdrop-blur-sm hover:bg-muted transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="p-1.5 rounded-md border bg-background/80 backdrop-blur-sm hover:bg-muted transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 z-10 flex gap-2 flex-wrap bg-background/60 backdrop-blur-sm rounded-lg px-2 py-1.5 border">
        {Object.entries(TYPE_COLORS).filter(([t]) =>
          data.nodes.some((n) => n.entity_type.toLowerCase() === t)
        ).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-muted-foreground capitalize">{type.replace("_", " ")}</span>
          </div>
        ))}
      </div>

      {/* SVG Canvas */}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="rounded-lg border bg-card/30 cursor-grab active:cursor-grabbing"
        onMouseDown={handleSvgMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Strong glow for selected */}
          <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {/* Edges with animated particles */}
          {data.edges.map((edge, i) => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return null;
            const highlighted = connectedEdges.has(i);
            const dimmed = (hoveredNode || selectedNode) && !highlighted;
            const edgeColor = highlighted ? getNodeColor(src.entity_type) : "#475569";
            const midX = (src.x + tgt.x) / 2;
            const midY = (src.y + tgt.y) / 2;

            // Particle positions along edge
            const particleCount = highlighted ? 3 : 1;
            const particles = Array.from({ length: particleCount }, (_, pi) => {
              const t = (offset + pi / particleCount) % 1;
              const px = src.x + (tgt.x - src.x) * t;
              const py = src.y + (tgt.y - src.y) * t;
              return { px, py, t };
            });

            return (
              <g key={`edge-${edge.source}-${edge.target}-${i}`}>
                {/* Edge line */}
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={edgeColor}
                  strokeWidth={highlighted ? 2.5 : 1}
                  strokeOpacity={dimmed ? 0.05 : highlighted ? 0.6 : 0.15}
                  strokeDasharray={highlighted ? undefined : "4 4"}
                />
                {/* Animated particles flowing along edge */}
                {particles.map((p, pi) => (
                  <circle
                    key={pi}
                    cx={p.px}
                    cy={p.py}
                    r={highlighted ? 2.5 : 1.5}
                    fill={edgeColor}
                    fillOpacity={dimmed ? 0.05 : highlighted ? 0.9 : 0.4}
                    filter={highlighted ? "url(#glow)" : undefined}
                  />
                ))}
                {/* Edge label on hover */}
                {highlighted && edge.label && zoom > 0.6 && (
                  <text
                    x={midX}
                    y={midY - 6}
                    textAnchor="middle"
                    fontSize={9}
                    fill={edgeColor}
                    fillOpacity={0.8}
                    className="pointer-events-none select-none font-medium"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const r = getRadius(node.degree);
            const color = getNodeColor(node.entity_type);
            const icon = getNodeIcon(node.entity_type);
            const isHovered = hoveredNode === node.id;
            const isSelected = selectedNode === node.id;
            const isHighlighted = highlightEntities.length > 0 &&
              highlightEntities.some((e) => e.toLowerCase() === node.label.toLowerCase());
            const dimmed = highlightEntities.length > 0
              ? !isHighlighted && !isHovered && !isSelected
              : (hoveredNode || selectedNode) && !connectedNodes.has(node.id);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
                className="cursor-pointer"
              >
                {/* Outer pulse ring - always animating */}
                <circle
                  r={r + 4}
                  fill="none"
                  stroke={color}
                  strokeWidth={1}
                  strokeOpacity={0.15}
                >
                  <animate
                    attributeName="r"
                    values={`${r + 2};${r + 8};${r + 2}`}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-opacity"
                    values="0.2;0.05;0.2"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Glow ring for hover/select/highlight */}
                {(isHovered || isSelected || isHighlighted) && (
                  <circle
                    r={r + (isHighlighted ? 8 : 5)}
                    fill="none"
                    stroke={isHighlighted ? "#fbbf24" : color}
                    strokeWidth={isHighlighted ? 3 : 2}
                    strokeOpacity={0.6}
                    filter="url(#glow-strong)"
                  >
                    <animate
                      attributeName="stroke-opacity"
                      values="0.7;0.3;0.7"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Node circle with gradient feel */}
                <circle
                  r={r}
                  fill={color}
                  fillOpacity={dimmed ? 0.1 : 0.9}
                  stroke={color}
                  strokeWidth={isSelected ? 2.5 : 1}
                  strokeOpacity={dimmed ? 0.15 : 1}
                  filter={isHovered || isSelected ? "url(#glow)" : undefined}
                />
                {/* Inner highlight for 3D effect */}
                <circle
                  r={r * 0.6}
                  cx={-r * 0.15}
                  cy={-r * 0.15}
                  fill="white"
                  fillOpacity={dimmed ? 0 : 0.15}
                  className="pointer-events-none"
                />

                {/* Icon inside node */}
                {zoom > 0.6 && r >= 12 && (
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={r > 16 ? 12 : 9}
                    className="pointer-events-none select-none"
                  >
                    {icon}
                  </text>
                )}

                {/* Label below node */}
                {zoom > 0.5 && (
                  <text
                    y={r + 14}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={isHovered || isSelected ? 600 : 400}
                    fill="currentColor"
                    fillOpacity={dimmed ? 0.1 : 0.8}
                    className="pointer-events-none select-none"
                  >
                    {node.label.length > 18 ? node.label.slice(0, 16) + "…" : node.label}
                  </text>
                )}

                {/* Degree badge */}
                {(isHovered || isSelected) && (
                  <g transform={`translate(${r + 4}, ${-r - 4})`}>
                    <rect
                      x={-8}
                      y={-6}
                      width={16}
                      height={12}
                      rx={6}
                      fill={color}
                      fillOpacity={0.9}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={7}
                      fill="white"
                      fontWeight={700}
                      className="pointer-events-none select-none"
                    >
                      {node.degree}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Selected node detail panel */}
      {selectedNode && (() => {
        const node = nodes.find((n) => n.id === selectedNode);
        if (!node) return null;
        const nodeEdges = data.edges.filter(
          (e) => e.source === selectedNode || e.target === selectedNode
        );
        const color = getNodeColor(node.entity_type);
        return (
          <div className="absolute top-10 left-2 z-10 bg-background/95 backdrop-blur-md border rounded-xl p-4 shadow-xl max-w-[260px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: color + "20" }}>
                {getNodeIcon(node.entity_type)}
              </div>
              <div>
                <p className="text-sm font-bold truncate">{node.label}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{node.entity_type.replace("_", " ")}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 mb-2">
              <Zap className="w-3 h-3 text-amber-500" />
              <span className="text-xs text-muted-foreground">{node.degree} connection{node.degree !== 1 ? "s" : ""}</span>
            </div>
            {nodeEdges.length > 0 && (
              <div className="border-t pt-2 mt-1">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1">RELATIONSHIPS</p>
                <div className="space-y-1 max-h-[120px] overflow-y-auto">
                  {nodeEdges.map((e, i) => {
                    const otherId = e.source === selectedNode ? e.target : e.source;
                    const other = data.nodes.find((n) => n.id === otherId);
                    const isSource = e.source === selectedNode;
                    return (
                      <div key={i} className="flex items-center gap-1 text-[10px]">
                        <span className="text-muted-foreground">{isSource ? "→" : "←"}</span>
                        <span className="font-medium" style={{ color: getNodeColor(other?.entity_type ?? "") }}>
                          {other?.label ?? otherId}
                        </span>
                        {e.label && <span className="text-muted-foreground italic">({e.label})</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {data.is_truncated && (
        <div className="absolute bottom-2 right-2 z-10 text-[10px] text-amber-400 bg-background/80 backdrop-blur-sm border border-amber-400/30 rounded px-2 py-1">
          Graph truncated (too many nodes)
        </div>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// KnowledgeGraphView — main export
// ---------------------------------------------------------------------------
interface KnowledgeGraphViewProps {
  projectId: string;
  highlightEntities?: string[];
}

export const KnowledgeGraphView = memo(function KnowledgeGraphView({ projectId, highlightEntities = [] }: KnowledgeGraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [demoMode, setDemoMode] = useState(false);

  // Observe container size — fill available space
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 50 && h > 50) {
          setDimensions({ width: w, height: h });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["kg-graph", projectId],
    queryFn: () => api.get<KGGraphData>(`/rag/graph/${projectId}?max_nodes=150&max_depth=3`),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">Loading knowledge graph...</span>
      </div>
    );
  }

  const hasRealData = data && data.nodes.length > 0;
  const graphData = demoMode ? generateMockData() : data;

  if (!hasRealData && !demoMode) {
    return (
      <div className="flex flex-col items-center py-10 text-center gap-4">
        <div className="relative">
          <Network className="w-16 h-16 text-muted-foreground/20" />
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-emerald-500" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">No graph data available</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Process documents with OmilosRAG to build the knowledge graph
          </p>
        </div>
        <button
          onClick={() => setDemoMode(true)}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Preview Demo Graph
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <GraphCanvas
        data={graphData!}
        width={dimensions.width}
        height={dimensions.height}
        highlightEntities={highlightEntities}
        isDemo={demoMode}
      />
      {demoMode && (
        <button
          onClick={() => setDemoMode(false)}
          className="absolute bottom-2 right-2 z-20 text-[10px] text-muted-foreground bg-background/80 backdrop-blur-sm border rounded px-2 py-1 hover:bg-muted transition-colors"
        >
          Exit Demo
        </button>
      )}
    </div>
  );
});
