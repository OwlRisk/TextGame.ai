"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";

interface MapRoom {
  id: string;
  name: string;
  icon: string;
  roomType: string;
  connections: string[];
}

interface WorldMapProps {
  rooms: MapRoom[];
  currentRoomId?: string;
  visitedRoomIds?: Set<string>;
  onRoomClick?: (roomId: string) => void;
  className?: string;
}

const ROOM_TYPE_FILL: Record<string, string> = {
  hub: "#22c55e",
  combat: "#ef4444",
  quest: "#3b82f6",
  shop: "#f59e0b",
  boss: "#a855f7",
  mystery: "#06b6d4",
};

const ROOM_TYPE_BG: Record<string, string> = {
  hub: "#14532d",
  combat: "#450a0a",
  quest: "#172554",
  shop: "#451a03",
  boss: "#3b0764",
  mystery: "#083344",
};

interface NodePosition {
  x: number;
  y: number;
}

function layoutRooms(rooms: MapRoom[]): Map<string, NodePosition> {
  if (rooms.length === 0) return new Map();

  const positions = new Map<string, NodePosition>();
  const visited = new Set<string>();
  const queue: { id: string; depth: number; order: number }[] = [];

  const connectionMap = new Map<string, string[]>();
  for (const room of rooms) {
    connectionMap.set(room.id, room.connections);
  }

  queue.push({ id: rooms[0].id, depth: 0, order: 0 });
  visited.add(rooms[0].id);

  const depthBuckets: string[][] = [];

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (!depthBuckets[depth]) depthBuckets[depth] = [];
    depthBuckets[depth].push(id);

    const conns = connectionMap.get(id) || [];
    let childOrder = 0;
    for (const connId of conns) {
      if (!visited.has(connId) && rooms.some((r) => r.id === connId)) {
        visited.add(connId);
        queue.push({ id: connId, depth: depth + 1, order: childOrder++ });
      }
    }
  }

  for (const room of rooms) {
    if (!visited.has(room.id)) {
      const lastDepth = depthBuckets.length;
      if (!depthBuckets[lastDepth]) depthBuckets[lastDepth] = [];
      depthBuckets[lastDepth].push(room.id);
    }
  }

  const nodeRadius = 28;
  const horizontalSpacing = 90;
  const verticalSpacing = 80;
  const maxWidth = Math.max(...depthBuckets.map((b) => b.length)) * horizontalSpacing;

  for (let depth = 0; depth < depthBuckets.length; depth++) {
    const bucket = depthBuckets[depth];
    const totalWidth = bucket.length * horizontalSpacing;
    const startX = (maxWidth - totalWidth) / 2 + horizontalSpacing / 2;

    for (let i = 0; i < bucket.length; i++) {
      positions.set(bucket[i], {
        x: startX + i * horizontalSpacing + nodeRadius,
        y: depth * verticalSpacing + nodeRadius + 10,
      });
    }
  }

  return positions;
}

export function WorldMap({ rooms, currentRoomId, visitedRoomIds = new Set(), onRoomClick, className = "" }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const mapRooms = useMemo(() => rooms.map((r) => ({
    ...r,
    connections: r.connections.filter((cId) => rooms.some((room) => room.id === cId)),
  })), [rooms]);

  const positions = useMemo(() => layoutRooms(mapRooms), [mapRooms]);

  const edges = useMemo(() => {
    const seen = new Set<string>();
    const result: { from: string; to: string; fromPos: NodePosition; toPos: NodePosition }[] = [];

    for (const room of mapRooms) {
      const fromPos = positions.get(room.id);
      if (!fromPos) continue;

      for (const connId of room.connections) {
        const edgeKey = [room.id, connId].sort().join(":");
        if (seen.has(edgeKey)) continue;
        seen.add(edgeKey);

        const toPos = positions.get(connId);
        if (!toPos) continue;
        result.push({ from: room.id, to: connId, fromPos, toPos });
      }
    }
    return result;
  }, [mapRooms, positions]);

  const svgWidth = useMemo(() => {
    let maxX = 0;
    positions.forEach((pos) => { maxX = Math.max(maxX, pos.x); });
    return maxX + 60;
  }, [positions]);

  const svgHeight = useMemo(() => {
    let maxY = 0;
    positions.forEach((pos) => { maxY = Math.max(maxY, pos.y); });
    return maxY + 50;
  }, [positions]);

  const handleRoomHover = useCallback((roomId: string | null, e?: React.MouseEvent) => {
    setHoveredRoom(roomId);
    if (e && roomId) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 40 });
      }
    } else {
      setTooltipPos(null);
    }
  }, []);

  const hoveredRoomData = hoveredRoom ? rooms.find((r) => r.id === hoveredRoom) : null;

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto"
        style={{ maxHeight: "400px" }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {edges.map(({ from, to, fromPos, toPos }) => {
          const isConnectedToHovered = hoveredRoom === from || hoveredRoom === to;
          const bothVisited = visitedRoomIds.has(from) && visitedRoomIds.has(to);
          return (
            <line
              key={`${from}:${to}`}
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              stroke={isConnectedToHovered ? "#fbbf24" : bothVisited ? "#52525b" : "#27272a"}
              strokeWidth={isConnectedToHovered ? 2 : 1.5}
              strokeDasharray={bothVisited ? undefined : "4 4"}
              opacity={isConnectedToHovered ? 1 : 0.6}
              className="transition-all duration-200"
            />
          );
        })}

        {/* Nodes */}
        {mapRooms.map((room) => {
          const pos = positions.get(room.id);
          if (!pos) return null;
          const isCurrent = room.id === currentRoomId;
          const isVisited = visitedRoomIds.has(room.id);
          const isHovered = room.id === hoveredRoom;
          const fill = ROOM_TYPE_FILL[room.roomType] || "#71717a";
          const bg = ROOM_TYPE_BG[room.roomType] || "#18181b";
          const radius = isCurrent ? 24 : 20;

          return (
            <g
              key={room.id}
              className="cursor-pointer"
              onClick={() => onRoomClick?.(room.id)}
              onMouseEnter={(e) => handleRoomHover(room.id, e)}
              onMouseLeave={() => handleRoomHover(null)}
            >
              {/* Glow ring for current room */}
              {isCurrent && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius + 4}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  filter="url(#glow)"
                  opacity={0.8}
                >
                  <animate attributeName="r" values={`${radius + 2};${radius + 6};${radius + 2}`} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Node circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius}
                fill={bg}
                stroke={isHovered ? "#fbbf24" : isCurrent ? "#fbbf24" : isVisited ? fill : "#3f3f46"}
                strokeWidth={isCurrent ? 2.5 : isHovered ? 2 : 1.5}
                opacity={isVisited || isCurrent ? 1 : 0.5}
                className="transition-all duration-200"
              />

              {/* Room icon */}
              <text
                x={pos.x}
                y={pos.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={isCurrent ? 16 : 14}
                className="pointer-events-none select-none"
              >
                {room.icon}
              </text>

              {/* Room name (truncated) */}
              <text
                x={pos.x}
                y={pos.y + radius + 12}
                textAnchor="middle"
                dominantBaseline="hanging"
                fontSize={8}
                fill={isCurrent ? "#fbbf24" : isVisited ? "#a1a1aa" : "#52525b"}
                className="pointer-events-none select-none font-medium"
              >
                {room.name.length > 14 ? room.name.slice(0, 12) + "…" : room.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredRoomData && tooltipPos && (
        <div
          className="absolute z-10 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl pointer-events-none transform -translate-x-1/2"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="flex items-center gap-2">
            <span>{hoveredRoomData.icon}</span>
            <span className="text-sm font-semibold text-white">{hoveredRoomData.name}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{
                color: ROOM_TYPE_FILL[hoveredRoomData.roomType] || "#71717a",
                backgroundColor: ROOM_TYPE_BG[hoveredRoomData.roomType] || "#18181b",
              }}
            >
              {hoveredRoomData.roomType}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
