'use client';

/**
 * IntelligenceGraph Component
 * Sprint S60: Intelligence Graph
 *
 * Visualizes entity relationships and intelligence network connections.
 * Displays personas, journeys, signals, and evidence as connected nodes.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import type { GraphVisualizationData } from '@/lib/intelligence-suite/transformers';

// Local types for UI display
type DisplayNode = GraphVisualizationData['nodes'][number];
type DisplayEdge = GraphVisualizationData['edges'][number];
type NodeType = 'persona' | 'journey' | 'signal' | 'evidence' | 'object' | 'company' | 'pattern' | string;

interface IntelligenceGraphProps {
  graph: GraphVisualizationData;
  onNodeClick?: (node: DisplayNode) => void;
  onEdgeClick?: (edge: DisplayEdge) => void;
  className?: string;
}

export function IntelligenceGraph({
  graph,
  onNodeClick,
  onEdgeClick,
  className,
}: IntelligenceGraphProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [filter, setFilter] = useState<NodeType | 'all'>('all');

  // Filter nodes
  const filteredNodes = useMemo(() => {
    if (filter === 'all') return graph.nodes;
    return graph.nodes.filter((n) => n.type === filter);
  }, [graph.nodes, filter]);

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

  // Filter edges to only show connections between visible nodes
  const filteredEdges = useMemo(() => {
    return graph.edges.filter(
      (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
    );
  }, [graph.edges, filteredNodeIds]);

  // Get connected nodes for highlighting
  const connectedNodes = useMemo(() => {
    if (!selectedNode && !hoveredNode) return new Set<string>();
    const focusNode = hoveredNode || selectedNode;
    const connected = new Set<string>();
    graph.edges.forEach((edge) => {
      if (edge.source === focusNode) connected.add(edge.target);
      if (edge.target === focusNode) connected.add(edge.source);
    });
    return connected;
  }, [graph.edges, selectedNode, hoveredNode]);

  const handleNodeClick = useCallback(
    (node: DisplayNode) => {
      setSelectedNode(selectedNode === node.id ? null : node.id);
      onNodeClick?.(node);
    },
    [selectedNode, onNodeClick]
  );

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'persona':
        return 'bg-blue-500';
      case 'journey':
        return 'bg-green-500';
      case 'signal':
        return 'bg-yellow-500';
      case 'evidence':
        return 'bg-purple-500';
      case 'object':
      case 'company':
        return 'bg-orange-500';
      case 'pattern':
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'persona':
        return '👤';
      case 'journey':
        return '🛤';
      case 'signal':
        return '📡';
      case 'evidence':
        return '📋';
      case 'object':
      case 'company':
        return '📦';
      case 'pattern':
        return '🔮';
      default:
        return '○';
    }
  };

  const getEdgeColor = (label?: string) => {
    switch (label) {
      case 'triggers':
        return 'stroke-yellow-400';
      case 'generates':
        return 'stroke-green-400';
      case 'supports':
        return 'stroke-blue-400';
      case 'correlates':
        return 'stroke-purple-400';
      case 'contains':
        return 'stroke-orange-400';
      default:
        return 'stroke-gray-400';
    }
  };

  // Simple force-directed layout approximation
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    // Group nodes by type
    const nodesByType: Record<string, DisplayNode[]> = {};
    filteredNodes.forEach((node) => {
      if (!nodesByType[node.type]) nodesByType[node.type] = [];
      nodesByType[node.type].push(node);
    });

    // Position each type in a radial pattern
    const types = Object.keys(nodesByType);
    types.forEach((type, typeIndex) => {
      const typeNodes = nodesByType[type];
      const typeAngle = (typeIndex / types.length) * 2 * Math.PI;
      const typeRadius = 180;
      const typeCenterX = centerX + Math.cos(typeAngle) * typeRadius;
      const typeCenterY = centerY + Math.sin(typeAngle) * typeRadius;

      typeNodes.forEach((node, nodeIndex) => {
        const nodeAngle = (nodeIndex / typeNodes.length) * 2 * Math.PI;
        const nodeRadius = Math.min(60, typeNodes.length * 15);
        positions[node.id] = {
          x: typeCenterX + Math.cos(nodeAngle) * nodeRadius,
          y: typeCenterY + Math.sin(nodeAngle) * nodeRadius,
        };
      });
    });

    return positions;
  }, [filteredNodes]);

  const stats = useMemo(() => {
    const typeCount: Record<string, number> = {};
    graph.nodes.forEach((n) => {
      typeCount[n.type] = (typeCount[n.type] || 0) + 1;
    });
    return typeCount;
  }, [graph.nodes]);

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Intelligence Graph
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {graph.nodes.length} nodes, {graph.edges.length} connections
            </p>
          </div>

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as NodeType | 'all')}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">All Types</option>
            <option value="persona">Personas ({stats.persona || 0})</option>
            <option value="journey">Journeys ({stats.journey || 0})</option>
            <option value="signal">Signals ({stats.signal || 0})</option>
            <option value="evidence">Evidence ({stats.evidence || 0})</option>
            <option value="company">Companies ({stats.company || 0})</option>
          </select>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4">
          {(['persona', 'journey', 'signal', 'evidence', 'company'] as const).map((type) => (
            <div key={type} className="flex items-center gap-2 text-sm">
              <span className={cn('w-3 h-3 rounded-full', getNodeColor(type))} />
              <span className="text-gray-600 dark:text-gray-400 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="relative overflow-hidden" style={{ height: 500 }}>
        <svg width="100%" height="100%" className="absolute inset-0">
          {/* Edges */}
          {filteredEdges.map((edge) => {
            const sourcePos = nodePositions[edge.source];
            const targetPos = nodePositions[edge.target];
            if (!sourcePos || !targetPos) return null;

            const isHighlighted =
              hoveredNode === edge.source ||
              hoveredNode === edge.target ||
              selectedNode === edge.source ||
              selectedNode === edge.target;

            return (
              <line
                key={edge.id}
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={targetPos.x}
                y2={targetPos.y}
                className={cn(
                  'transition-all',
                  getEdgeColor(edge.label),
                  isHighlighted ? 'stroke-2 opacity-100' : 'stroke-1 opacity-40'
                )}
                onClick={() => onEdgeClick?.(edge)}
                style={{ cursor: 'pointer' }}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {filteredNodes.map((node) => {
          const pos = nodePositions[node.id];
          if (!pos) return null;

          const isSelected = selectedNode === node.id;
          const isHovered = hoveredNode === node.id;
          const isConnected = connectedNodes.has(node.id);
          const isFaded =
            (selectedNode || hoveredNode) && !isSelected && !isHovered && !isConnected;

          return (
            <div
              key={node.id}
              className={cn(
                'absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all',
                isFaded && 'opacity-30'
              )}
              style={{ left: pos.x, top: pos.y }}
              onClick={() => handleNodeClick(node)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div
                className={cn(
                  'flex items-center justify-center rounded-full transition-all',
                  getNodeColor(node.type),
                  isSelected
                    ? 'w-12 h-12 ring-4 ring-blue-300 dark:ring-blue-600'
                    : isHovered
                      ? 'w-11 h-11 ring-2 ring-gray-300'
                      : 'w-10 h-10'
                )}
              >
                <span className="text-lg">{getNodeIcon(node.type)}</span>
              </div>
              {(isHovered || isSelected) && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                  {node.label}
                </div>
              )}
            </div>
          );
        })}

        {filteredNodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            No nodes to display
          </div>
        )}
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <NodeDetailPanel
          node={graph.nodes.find((n) => n.id === selectedNode)!}
          edges={graph.edges.filter(
            (e) => e.source === selectedNode || e.target === selectedNode
          )}
          allNodes={graph.nodes}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}

interface NodeDetailPanelProps {
  node: DisplayNode;
  edges: DisplayEdge[];
  allNodes: DisplayNode[];
  onClose: () => void;
}

function NodeDetailPanel({ node, edges, allNodes, onClose }: NodeDetailPanelProps) {
  const nodeMap = useMemo(() => {
    const map: Record<string, DisplayNode> = {};
    allNodes.forEach((n) => (map[n.id] = n));
    return map;
  }, [allNodes]);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 dark:text-white">{node.label}</h4>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Type:</span>{' '}
          <span className="capitalize text-gray-900 dark:text-white">{node.type}</span>
        </div>
        <div>
          <span className="text-gray-500">Connections:</span>{' '}
          <span className="text-gray-900 dark:text-white">{edges.length}</span>
        </div>
      </div>

      {edges.length > 0 && (
        <div className="mt-4">
          <h5 className="text-xs font-medium text-gray-500 mb-2">Connected Entities</h5>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {edges.map((edge) => {
              const connectedId = edge.source === node.id ? edge.target : edge.source;
              const connectedNode = nodeMap[connectedId];
              if (!connectedNode) return null;

              return (
                <div
                  key={edge.id}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  {edge.label && (
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                      {edge.label}
                    </span>
                  )}
                  <span className="capitalize">{connectedNode.type}:</span>
                  <span className="truncate">{connectedNode.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default IntelligenceGraph;
