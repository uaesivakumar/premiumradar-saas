'use client';

/**
 * Object Container - Sprint S27
 * Draggable, pinnable container for output objects
 */

import { useState, useRef } from 'react';
import { motion, useDragControls, PanInfo } from 'framer-motion';
import {
  GripVertical,
  Pin,
  X,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  MoreHorizontal,
} from 'lucide-react';
import { OutputObject, useSIVAStore } from '@/lib/stores/siva-store';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';

interface ObjectContainerProps {
  object: OutputObject;
  children: React.ReactNode;
  onDragEnd?: (info: PanInfo) => void;
}

const TYPE_CONFIG = {
  discovery: { label: 'Discovery', gradient: 'from-blue-500 to-cyan-500' },
  scoring: { label: 'Q/T/L/E Score', gradient: 'from-purple-500 to-pink-500' },
  ranking: { label: 'Rankings', gradient: 'from-amber-500 to-orange-500' },
  outreach: { label: 'Outreach', gradient: 'from-green-500 to-emerald-500' },
  insight: { label: 'Insight', gradient: 'from-indigo-500 to-purple-500' },
  message: { label: 'Message', gradient: 'from-teal-500 to-cyan-500' },
};

export function ObjectContainer({ object, children, onDragEnd }: ObjectContainerProps) {
  const { togglePinObject, toggleExpandObject, removeOutputObject } = useSIVAStore();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  const dragControls = useDragControls();
  const containerRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const typeConfig = TYPE_CONFIG[object.type];

  const handleExport = () => {
    // Export object data as JSON
    const dataStr = JSON.stringify(object.data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${object.type}-${object.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: object.title,
        text: `Check out this ${typeConfig.label}`,
        url: window.location.href,
      });
    } catch {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(JSON.stringify(object.data));
    }
  };

  return (
    <motion.div
      ref={containerRef}
      layout
      drag={!isFullscreen}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.1}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        onDragEnd?.(info);
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: 1,
        zIndex: isDragging ? 50 : object.pinned ? 10 : 1,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative bg-slate-800/80 backdrop-blur-xl rounded-2xl border overflow-hidden transition-shadow ${
        object.pinned
          ? 'border-yellow-500/30 shadow-lg shadow-yellow-500/10'
          : isDragging
          ? 'border-blue-500/50 shadow-2xl shadow-blue-500/20'
          : 'border-white/10 hover:border-white/20'
      } ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-3 border-b border-white/5 bg-gradient-to-r ${typeConfig.gradient} bg-opacity-10`}
        style={{
          background: `linear-gradient(90deg, ${industryConfig.primaryColor}10, transparent)`,
        }}
      >
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              dragControls.start(e);
            }}
            className="p-1 rounded cursor-grab active:cursor-grabbing text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Type Badge */}
          <div
            className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${typeConfig.gradient} text-white`}
          >
            {typeConfig.label}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-white text-sm truncate">{object.title}</h3>
        </div>

        <div className="flex items-center gap-1">
          {/* Timestamp */}
          <span className="text-xs text-gray-500 mr-2 hidden sm:inline">
            {new Date(object.timestamp).toLocaleTimeString()}
          </span>

          {/* Pin */}
          <button
            onClick={() => togglePinObject(object.id)}
            className={`p-1.5 rounded-lg transition-all ${
              object.pinned
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
            title={object.pinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="w-4 h-4" />
          </button>

          {/* Expand/Collapse */}
          <button
            onClick={() => toggleExpandObject(object.id)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            title={object.expanded ? 'Collapse' : 'Expand'}
          >
            {object.expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute right-0 top-full mt-1 w-40 bg-slate-800 rounded-lg border border-white/10 shadow-xl z-50 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      handleExport();
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button
                    onClick={() => {
                      handleShare();
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <div className="border-t border-white/5" />
                  <button
                    onClick={() => {
                      removeOutputObject(object.id);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </button>
                </motion.div>
              </>
            )}
          </div>

          {/* Close */}
          <button
            onClick={() => removeOutputObject(object.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
            title="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={false}
        animate={{
          height: object.expanded ? 'auto' : 0,
          opacity: object.expanded ? 1 : 0,
        }}
        className="overflow-hidden"
      >
        <div className={`p-4 ${isFullscreen ? 'overflow-auto max-h-[calc(100vh-120px)]' : ''}`}>
          {children}
        </div>
      </motion.div>

      {/* Collapsed Preview */}
      {!object.expanded && (
        <div className="px-4 py-2 text-sm text-gray-500">
          Click to expand...
        </div>
      )}

      {/* Drag Overlay */}
      {isDragging && (
        <motion.div
          className="absolute inset-0 bg-blue-500/5 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
    </motion.div>
  );
}

export default ObjectContainer;
