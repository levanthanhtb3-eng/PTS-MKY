import React from 'react';
import {
  Sliders,
  Download,
  Code2,
  Eye,
  RefreshCw,
  LayoutGrid,
  Monitor,
  Layers,
  Keyboard,
  Undo2,
  Redo2,
} from 'lucide-react';
import { ViewMode } from '../types/retouch';

interface HeaderBarProps {
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  onOpenScripts: () => void;
  onOpenAnalysis: () => void;
  onOpenBatch: () => void;
  onOpenShortcuts?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onResetSettings: () => void;
  onExportImage: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  viewMode,
  onToggleViewMode,
  onOpenScripts,
  onOpenAnalysis,
  onOpenBatch,
  onOpenShortcuts,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onResetSettings,
  onExportImage,
}) => {
  return (
    <header className="h-14 border-b border-neutral-800 bg-[#1e1e24] px-4 flex items-center justify-between select-none shrink-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center font-bold text-white shadow-sm text-sm">
          Ps
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-tight text-white">
            Lumina Retouch Pro
          </span>
          <span className="text-xs text-neutral-400 hidden sm:inline">
            Photoshop Skin & Color Suite
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation & Quick Views */}
      <nav className="hidden md:flex items-center gap-1 bg-[#16161a] p-1 rounded-lg border border-neutral-800">
        <button
          onClick={() => onToggleViewMode('photoshop-docked')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            viewMode === 'photoshop-docked'
              ? 'bg-[#2a2a32] text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Giao diện Photoshop</span>
        </button>
        <button
          onClick={() => onToggleViewMode('studio-expanded')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            viewMode === 'studio-expanded'
              ? 'bg-[#2a2a32] text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Studio Toàn Màn Hình</span>
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenBatch}
          title="Áp dụng retouch và tone màu cho nhiều ảnh cùng lúc"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm transition-colors whitespace-nowrap"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Xử Lý Hàng Loạt (Batch)</span>
        </button>

        <button
          onClick={onOpenAnalysis}
          title="Kiểm tra tỷ lệ màu da CMYK chuẩn in ấn"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Soi Tone CMYK</span>
        </button>

        <button
          onClick={onOpenScripts}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md transition-colors hidden sm:flex"
        >
          <Code2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Photoshop Scripts</span>
        </button>

        {/* Undo & Redo buttons */}
        <div className="flex items-center bg-neutral-900/80 rounded-md p-0.5 border border-neutral-800">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Hoàn tác (Ctrl+Z)"
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:text-neutral-600 disabled:hover:bg-transparent disabled:cursor-not-allowed rounded transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Làm lại (Ctrl+Shift+Z / Ctrl+Y)"
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:text-neutral-600 disabled:hover:bg-transparent disabled:cursor-not-allowed rounded transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            title="Danh sách phím tắt (Phím ?)"
            className="p-1.5 text-neutral-400 hover:text-indigo-300 hover:bg-neutral-800 rounded-md transition-colors"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={onResetSettings}
          title="Đặt lại thông số mặc định (Phím R)"
          className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onExportImage}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md shadow-sm transition-colors whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Xuất Ảnh</span>
        </button>
      </div>
    </header>
  );
};

