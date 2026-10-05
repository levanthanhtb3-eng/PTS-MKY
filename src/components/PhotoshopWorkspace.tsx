import React, { useState } from 'react';
import {
  MousePointer,
  Crop,
  Pipette,
  Bandage,
  Stamp,
  Brush,
  Eraser,
  Sun,
  Moon,
  Layers,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Folder,
  FileImage,
  Maximize2
} from 'lucide-react';
import { CanvasViewport } from './CanvasViewport';
import { RetouchPanel } from './RetouchPanel';
import { RetouchSettings, SampleImage, MaskingState } from '../types/retouch';
import { analyzeSkinToneMetrics } from '../utils/canvasFilters';

interface PhotoshopWorkspaceProps {
  settings: RetouchSettings;
  onSettingsChange: (settings: RetouchSettings) => void;
  sampleImages: SampleImage[];
  selectedSampleId: string;
  maskingState?: MaskingState;
  onMaskingStateChange?: (state: MaskingState) => void;
  onDetectAllMasks?: () => void;
  isDetectingMasks?: boolean;
  onSelectSample: (id: string) => void;
  onCustomImageUploaded: (url: string) => void;
  onOpenScripts: (scriptId?: string) => void;
  onOpenAnalysis: () => void;
  onOpenBatch?: () => void;
  onAutoSharpen?: () => void;
  onOpenAiEdit?: () => void;
  onSampleColorPicked: (info: ReturnType<typeof analyzeSkinToneMetrics>) => void;
}

export const PhotoshopWorkspace: React.FC<PhotoshopWorkspaceProps> = ({
  settings,
  onSettingsChange,
  sampleImages,
  selectedSampleId,
  maskingState,
  onMaskingStateChange,
  onDetectAllMasks,
  isDetectingMasks = false,
  onSelectSample,
  onCustomImageUploaded,
  onOpenScripts,
  onOpenAnalysis,
  onOpenBatch,
  onAutoSharpen,
  onOpenAiEdit,
  onSampleColorPicked,
}) => {
  const [activeTool, setActiveTool] = useState<string>('mixer');
  const [fsGroupOpen, setFsGroupOpen] = useState<boolean>(true);
  const [dbGroupOpen, setDbGroupOpen] = useState<boolean>(true);

  // Photoshop Menu items
  const menuItems = ['File', 'Edit', 'Image', 'Layer', 'Type', 'Select', 'Filter', 'View', 'Window', 'Plugins', 'Help'];

  // Photoshop Toolbar tools
  const tools = [
    { id: 'move', icon: MousePointer, name: 'Move Tool (V)' },
    { id: 'crop', icon: Crop, name: 'Crop Tool (C)' },
    { id: 'eyedropper', icon: Pipette, name: 'Eyedropper (I)' },
    { id: 'healing', icon: Bandage, name: 'Spot Healing Brush (J)' },
    { id: 'clone', icon: Stamp, name: 'Clone Stamp Tool (S)' },
    { id: 'mixer', icon: Brush, name: 'Mixer Brush Tool (B) - Chuyên mịn da FS' },
    { id: 'eraser', icon: Eraser, name: 'Eraser Tool (E)' },
    { id: 'dodge', icon: Sun, name: 'Dodge Tool (O) - Làm sáng' },
    { id: 'burn', icon: Moon, name: 'Burn Tool (O) - Tạo tối' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#18181b] overflow-hidden select-none">
      {/* 1. Photoshop Classic Menu Bar */}
      <div className="h-7 bg-[#232328] px-3 flex items-center border-b border-neutral-800 text-neutral-300 text-xs gap-3">
        <div className="font-semibold text-white tracking-wide pr-2 border-r border-neutral-700">
          Photoshop 2026
        </div>
        <div className="flex items-center gap-4 text-[11px] overflow-x-auto">
          {menuItems.map((item) => (
            <span
              key={item}
              className="hover:text-white cursor-pointer transition-colors whitespace-nowrap"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* 2. Photoshop Options / Tool Property Bar */}
      <div className="h-8 bg-[#1f1f24] px-4 flex items-center justify-between border-b border-neutral-800 text-[11px] text-neutral-300">
        <div className="flex items-center gap-4 overflow-x-auto py-1">
          <span className="font-semibold text-sky-400 flex items-center gap-1.5 whitespace-nowrap">
            <Brush className="w-3.5 h-3.5" />
            <span>Mixer Brush:</span>
          </span>
          <span className="text-neutral-400 whitespace-nowrap">Cọ mềm tròn (Soft Round)</span>
          <span className="text-neutral-500">|</span>
          <span className="whitespace-nowrap">Wet: <strong className="text-neutral-200">20%</strong></span>
          <span className="whitespace-nowrap">Load: <strong className="text-neutral-200">35%</strong></span>
          <span className="whitespace-nowrap">Mix: <strong className="text-neutral-200">40%</strong></span>
          <span className="whitespace-nowrap">Flow: <strong className="text-neutral-200">30%</strong></span>
          <span className="text-neutral-500">|</span>
          <span className="text-indigo-400 font-medium whitespace-nowrap">
            Lấy mẫu: Current &amp; Below (Chuẩn Tách Tần Số)
          </span>
        </div>
      </div>

      {/* 3. Main Body: Left Toolbar + Canvas + Right Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-11 bg-[#202026] border-r border-neutral-800 flex flex-col items-center py-2 gap-1 shrink-0 z-10">
          {tools.map((t) => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id)}
                title={t.name}
                className={`w-8 h-8 rounded flex items-center justify-center transition-colors relative ${
                  isActive
                    ? 'bg-neutral-700 text-white shadow-inner'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {isActive && (
                  <span className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-sky-400"></span>
                )}
              </button>
            );
          })}

          {/* Color Swatches (Foreground / Background) */}
          <div className="mt-auto mb-2 relative w-6 h-6">
            <div className="absolute top-0 left-0 w-4 h-4 bg-white border border-black shadow-sm z-10" />
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-black border border-neutral-600" />
          </div>
        </div>

        {/* Center: Canvas Viewport */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <CanvasViewport
            settings={settings}
            sampleImages={sampleImages}
            selectedSampleId={selectedSampleId}
            maskingState={maskingState}
            onSelectSample={onSelectSample}
            onCustomImageUploaded={onCustomImageUploaded}
            onSampleColorPicked={onSampleColorPicked}
          />
        </div>

        {/* Right: Photoshop Panel Dock (Lumina Retouch Pro + Layers Mockup) */}
        <div className="w-80 md:w-96 flex flex-col bg-[#222228] border-l border-neutral-800 shrink-0 overflow-hidden">
          {/* Top Half: Lumina Retouch Pro Panel */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-[420px]">
            <RetouchPanel
              settings={settings}
              onChange={onSettingsChange}
              maskingState={maskingState}
              onMaskingStateChange={onMaskingStateChange}
              onDetectAllMasks={onDetectAllMasks}
              isDetectingMasks={isDetectingMasks}
              onOpenScripts={onOpenScripts}
              onOpenAnalysis={onOpenAnalysis}
              onOpenBatch={onOpenBatch}
              onAutoSharpen={onAutoSharpen}
              onOpenAiEdit={onOpenAiEdit}
            />
          </div>

          {/* Bottom Half: Simulated Photoshop Layer Stack */}
          <div className="h-56 bg-[#1a1a20] border-t border-neutral-800 flex flex-col text-neutral-300 text-xs">
            <div className="h-7 px-3 bg-[#1e1e24] border-b border-neutral-800 flex items-center justify-between font-semibold text-neutral-300 text-[11px]">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Layers (Lớp Layer Photoshop)</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-normal">Normal / 100%</span>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 space-y-1 font-mono text-[10px]">
              {/* Dodge & Burn Group */}
              <div className="space-y-0.5">
                <div
                  onClick={() => setDbGroupOpen(!dbGroupOpen)}
                  className="flex items-center gap-1 px-1.5 py-1 bg-neutral-800/60 rounded cursor-pointer hover:bg-neutral-800 text-neutral-200"
                >
                  <Eye className="w-3 h-3 text-neutral-400 shrink-0" />
                  {dbGroupOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <Folder className="w-3 h-3 text-amber-400" />
                  <span className="truncate">[Lumina] Dodge &amp; Burn</span>
                </div>
                {dbGroupOpen && (
                  <div className="pl-6 space-y-0.5 border-l border-neutral-800 ml-2">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 text-neutral-300 hover:bg-neutral-800/40 rounded">
                      <Eye className="w-2.5 h-2.5 text-neutral-500" />
                      <span>Curves (DODGE - Sáng T-Zone)</span>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 text-neutral-300 hover:bg-neutral-800/40 rounded">
                      <Eye className="w-2.5 h-2.5 text-neutral-500" />
                      <span>Curves (BURN - Chiều Sâu Má)</span>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 text-amber-300/80 hover:bg-neutral-800/40 rounded">
                      {settings.dbVisualAid ? (
                        <Eye className="w-2.5 h-2.5 text-amber-400" />
                      ) : (
                        <EyeOff className="w-2.5 h-2.5 text-neutral-600" />
                      )}
                      <span>👁 Visual Aid (High Contrast B&amp;W)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Frequency Separation Group */}
              <div className="space-y-0.5">
                <div
                  onClick={() => setFsGroupOpen(!fsGroupOpen)}
                  className="flex items-center gap-1 px-1.5 py-1 bg-neutral-800/60 rounded cursor-pointer hover:bg-neutral-800 text-neutral-200"
                >
                  <Eye className="w-3 h-3 text-neutral-400 shrink-0" />
                  {fsGroupOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <Folder className="w-3 h-3 text-indigo-400" />
                  <span className="truncate">[Lumina] Frequency Separation</span>
                </div>
                {fsGroupOpen && (
                  <div className="pl-6 space-y-0.5 border-l border-neutral-800 ml-2">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 text-indigo-300 hover:bg-neutral-800/40 rounded">
                      <Eye className="w-2.5 h-2.5 text-neutral-500" />
                      <span>High Frequency (Linear Light)</span>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 text-emerald-300 bg-neutral-800/70 rounded border border-neutral-700">
                      <Eye className="w-2.5 h-2.5 text-emerald-400" />
                      <span>&gt;&gt; Retouch Tone (Mixer Brush) &lt;&lt;</span>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 text-neutral-300 hover:bg-neutral-800/40 rounded">
                      <Eye className="w-2.5 h-2.5 text-neutral-500" />
                      <span>Low Frequency (Blur {settings.fsRadius}px)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Background / Original Layer */}
              <div className="flex items-center gap-1 px-1.5 py-1 bg-neutral-900/60 rounded text-neutral-400">
                <Eye className="w-3 h-3 text-neutral-500" />
                <FileImage className="w-3 h-3 text-neutral-500" />
                <span>Background (Ảnh gốc nguyên bản)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
