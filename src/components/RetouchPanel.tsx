import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Palette,
  Eye,
  Smile,
  SunMedium,
  Layers,
  Wand2,
  Check,
  FileCode,
  Contrast,
  Zap,
  RotateCcw
} from 'lucide-react';
import { RetouchSettings, MaskingState } from '../types/retouch';
import { SKIN_TONE_PRESETS, PHOTOSHOP_SCRIPTS } from '../data/photoshopScripts';
import { MaskingToolsPanel } from './MaskingToolsPanel';

interface RetouchPanelProps {
  settings: RetouchSettings;
  onChange: (settings: RetouchSettings) => void;
  maskingState?: MaskingState;
  onMaskingStateChange?: (state: MaskingState) => void;
  onDetectAllMasks?: () => void;
  isDetectingMasks?: boolean;
  onOpenScripts: (scriptId?: string) => void;
  onOpenAnalysis: () => void;
  onOpenBatch?: () => void;
  onAutoSharpen?: () => void;
  onOpenAiEdit?: () => void;
  compactMode?: boolean;
}

export const RetouchPanel: React.FC<RetouchPanelProps> = ({
  settings,
  onChange,
  maskingState,
  onMaskingStateChange,
  onDetectAllMasks,
  isDetectingMasks = false,
  onOpenScripts,
  onOpenAnalysis,
  onOpenBatch,
  onAutoSharpen,
  onOpenAiEdit,
  compactMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<'skin' | 'color' | 'masking' | 'details' | 'scripts'>('skin');

  const updateSetting = <K extends keyof RetouchSettings>(key: K, value: RetouchSettings[K]) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  const applySkinTone = (preset: typeof SKIN_TONE_PRESETS[0]) => {
    onChange({
      ...settings,
      skinTonePreset: preset.id,
      warmth: preset.warmth,
      tint: preset.tint,
      skinLuminance: preset.skinLuminance,
      skinSaturation: preset.skinSaturation,
      contrastPunch: preset.contrastPunch,
      highlightGlow: preset.highlightGlow,
    });
  };

  const quickActionApply = (type: 'smooth_natural' | 'glam_glow' | 'editorial_clean' | 'reset') => {
    if (type === 'smooth_natural') {
      onChange({
        ...settings,
        fsEnabled: true,
        fsRadius: 8.5,
        fsSmoothness: 65,
        fsTextureSharpness: 80,
        fsBlemishRemoval: 40,
        dbEnabled: true,
        dbIntensity: 45,
        dbContourTZone: 40,
        dbContourCheek: 35,
        antiRedness: 30,
        eyeBrighten: 35,
        teethWhiten: 40,
        warmth: 8,
        tint: 12,
        skinLuminance: 10,
        highPassSharpen: 40,
      });
    } else if (type === 'glam_glow') {
      onChange({
        ...settings,
        fsEnabled: true,
        fsRadius: 11.0,
        fsSmoothness: 85,
        fsTextureSharpness: 70,
        fsBlemishRemoval: 60,
        dbEnabled: true,
        dbIntensity: 65,
        dbContourTZone: 60,
        dbContourCheek: 55,
        highlightGlow: 35,
        antiRedness: 45,
        eyeBrighten: 50,
        teethWhiten: 60,
        warmth: 12,
        tint: 16,
        skinLuminance: 18,
        highPassSharpen: 55,
      });
    } else if (type === 'editorial_clean') {
      onChange({
        ...settings,
        fsEnabled: true,
        fsRadius: 7.0,
        fsSmoothness: 45,
        fsTextureSharpness: 95,
        fsBlemishRemoval: 30,
        dbEnabled: true,
        dbIntensity: 50,
        dbContourTZone: 35,
        dbContourCheek: 50,
        antiRedness: 20,
        eyeBrighten: 25,
        teethWhiten: 30,
        contrastPunch: 15,
        highPassSharpen: 65,
      });
    } else {
      // Reset
      onChange({
        fsEnabled: true,
        fsRadius: 8.0,
        fsSmoothness: 40,
        fsTextureSharpness: 60,
        fsBlemishRemoval: 20,
        dbEnabled: false,
        dbIntensity: 40,
        dbContourTZone: 30,
        dbContourCheek: 30,
        dbVisualAid: false,
        eyeBrighten: 0,
        teethWhiten: 0,
        lipSaturation: 0,
        lipTone: 'natural',
        antiRedness: 0,
        skinTonePreset: 'asian_glow',
        warmth: 0,
        tint: 0,
        skinLuminance: 0,
        skinSaturation: 0,
        contrastPunch: 0,
        highlightGlow: 0,
        grain: 0,
        highPassSharpen: 20,
        vignette: 0,
      });
    }
  };

  return (
    <aside className="w-full h-full flex flex-col bg-[#222228] text-neutral-200 border-l border-neutral-800 select-none overflow-hidden font-sans">
      {/* Panel Top Title (Photoshop Panel Tab Header) */}
      <div className="h-9 px-3 bg-[#1a1a20] border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" />
          <span className="text-xs font-semibold tracking-wider uppercase text-neutral-300">
            Lumina Retouch Studio
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onOpenScripts('fs_8bit')}
            title="Mở mã script Photoshop (.jsx)"
            className="p-1 text-neutral-400 hover:text-sky-400 hover:bg-neutral-800 rounded transition-colors"
          >
            <FileCode className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => quickActionApply('reset')}
            title="Khôi phục mặc định"
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1-Click Fast Workflows Banner */}
      <div className="p-2.5 bg-[#1e1e24] border-b border-neutral-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-medium text-neutral-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Retouch 1-Chạm Siêu Nhanh</span>
          </div>
          {onOpenAiEdit && (
            <button
              onClick={onOpenAiEdit}
              className="text-[10px] font-semibold text-rose-300 hover:text-white flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-rose-600/30 to-indigo-600/30 border border-rose-500/40 rounded transition-colors"
            >
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              <span>Sửa Ảnh Bằng AI</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => quickActionApply('smooth_natural')}
            className="px-2 py-1.5 bg-[#2b2b34] hover:bg-[#34343f] border border-neutral-700/60 rounded text-[11px] font-medium text-neutral-200 hover:text-white transition-colors text-center"
          >
            Mịn Da Tự Nhiên
          </button>
          <button
            onClick={() => quickActionApply('glam_glow')}
            className="px-2 py-1.5 bg-[#2b2b34] hover:bg-[#34343f] border border-neutral-700/60 rounded text-[11px] font-medium text-indigo-300 hover:text-indigo-200 transition-colors text-center"
          >
            Căng Bóng Glam
          </button>
          <button
            onClick={() => quickActionApply('editorial_clean')}
            className="px-2 py-1.5 bg-[#2b2b34] hover:bg-[#34343f] border border-neutral-700/60 rounded text-[11px] font-medium text-neutral-200 hover:text-white transition-colors text-center"
          >
            Thời Trang Tạp Chí
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-neutral-800 bg-[#19191f] px-2 pt-1 gap-1">
        <button
          onClick={() => setActiveTab('skin')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'skin'
              ? 'border-indigo-500 text-white bg-[#222228]'
              : 'border-transparent text-neutral-400 hover:text-neutral-300'
          } rounded-t`}
        >
          <Layers className="w-3 h-3 text-indigo-400" />
          <span>Da & Khối</span>
        </button>
        <button
          onClick={() => setActiveTab('color')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'color'
              ? 'border-indigo-500 text-white bg-[#222228]'
              : 'border-transparent text-neutral-400 hover:text-neutral-300'
          } rounded-t`}
        >
          <Palette className="w-3 h-3 text-rose-400" />
          <span>Tone Màu</span>
        </button>
        <button
          onClick={() => setActiveTab('masking')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'masking'
              ? 'border-indigo-500 text-white bg-[#222228]'
              : 'border-transparent text-neutral-400 hover:text-neutral-300'
          } rounded-t`}
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Mặt Nạ AI</span>
        </button>
        <button
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'details'
              ? 'border-indigo-500 text-white bg-[#222228]'
              : 'border-transparent text-neutral-400 hover:text-neutral-300'
          } rounded-t`}
        >
          <Eye className="w-3 h-3 text-sky-400" />
          <span>Mắt & Răng</span>
        </button>
        <button
          onClick={() => setActiveTab('scripts')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'scripts'
              ? 'border-indigo-500 text-white bg-[#222228]'
              : 'border-transparent text-neutral-400 hover:text-neutral-300'
          } rounded-t`}
        >
          <FileCode className="w-3 h-3 text-emerald-400" />
          <span>Photoshop .JSX</span>
        </button>
      </div>

      {/* Tab Contents - Scrollable */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
        {/* ================= TAB 1: SKIN & DODGE/BURN ================= */}
        {activeTab === 'skin' && (
          <div className="space-y-4">
            {/* Section: Frequency Separation */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                  Tách Tần Số (Frequency Separation)
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.fsEnabled}
                    onChange={(e) => updateSetting('fsEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {settings.fsEnabled ? (
                <div className="space-y-3 bg-[#1c1c22] p-2.5 rounded border border-neutral-800">
                  {/* FS Radius */}
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                      <span>Bán kính tách tần số (Radius)</span>
                      <span className="font-mono text-neutral-300">{settings.fsRadius.toFixed(1)} px</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={20}
                      step={0.5}
                      value={settings.fsRadius}
                      onChange={(e) => updateSetting('fsRadius', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-500 mt-0.5">
                      <span>Chi tiết nhỏ (4px)</span>
                      <span>Chân dung chuẩn (8px)</span>
                      <span>Toàn thân (16px)</span>
                    </div>
                  </div>

                  {/* FS Smoothness */}
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                      <span>Độ mịn khối da (Low Frequency)</span>
                      <span className="font-mono text-neutral-300">{settings.fsSmoothness}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={settings.fsSmoothness}
                      onChange={(e) => updateSetting('fsSmoothness', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* FS Texture Sharpness */}
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                      <span>Giữ vân da & Lỗ chân lông (High Frequency)</span>
                      <span className="font-mono text-neutral-300">{settings.fsTextureSharpness}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={settings.fsTextureSharpness}
                      onChange={(e) => updateSetting('fsTextureSharpness', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* FS Blemish Removal */}
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                      <span>Khử mụn & Đốm da li ti (Blemish Clean)</span>
                      <span className="font-mono text-neutral-300">{settings.fsBlemishRemoval}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={settings.fsBlemishRemoval}
                      onChange={(e) => updateSetting('fsBlemishRemoval', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div className="pt-1 flex gap-2">
                    <button
                      onClick={() => onOpenScripts('fs_8bit')}
                      className="flex-1 py-1 px-2 text-[11px] bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded flex items-center justify-center gap-1 transition-colors"
                    >
                      <FileCode className="w-3 h-3" />
                      <span>Script FS 8-Bit</span>
                    </button>
                    <button
                      onClick={() => onOpenScripts('fs_16bit')}
                      className="flex-1 py-1 px-2 text-[11px] bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 rounded flex items-center justify-center gap-1 transition-colors"
                    >
                      <FileCode className="w-3 h-3" />
                      <span>Script FS 16-Bit</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-neutral-500 italic p-2 bg-[#1b1b20] rounded border border-neutral-800">
                  Gạt công tắc để kích hoạt tách tần số và làm mịn da.
                </div>
              )}
            </div>

            {/* Section: Dodge & Burn */}
            <div className="space-y-2.5 pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <SunMedium className="w-3.5 h-3.5 text-amber-400" />
                  Đánh Khối Ánh Sáng (Dodge & Burn)
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.dbEnabled}
                    onChange={(e) => updateSetting('dbEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {settings.dbEnabled && (
                <div className="space-y-3 bg-[#1c1c22] p-2.5 rounded border border-neutral-800">
                  {/* Visual Aid Button */}
                  <div className="flex items-center justify-between p-2 bg-neutral-900/60 rounded border border-neutral-800">
                    <div className="flex items-center gap-1.5">
                      <Contrast className="w-3.5 h-3.5 text-neutral-300" />
                      <span className="text-[11px] font-medium text-neutral-300">
                        Lớp Hỗ Trợ Soi Da (Solar Check)
                      </span>
                    </div>
                    <button
                      onClick={() => updateSetting('dbVisualAid', !settings.dbVisualAid)}
                      className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${
                        settings.dbVisualAid
                          ? 'bg-amber-500 text-black'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {settings.dbVisualAid ? 'ĐANG BẬT' : 'BẬT SOI'}
                    </button>
                  </div>

                  {/* D&B Intensity */}
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                      <span>Cường độ đánh khối tổng</span>
                      <span className="font-mono text-neutral-300">{settings.dbIntensity}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={settings.dbIntensity}
                      onChange={(e) => updateSetting('dbIntensity', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  {/* Dodge T-Zone */}
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                      <span>Bắt sáng vùng T & Sống mũi (Dodge)</span>
                      <span className="font-mono text-neutral-300">{settings.dbContourTZone}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={settings.dbContourTZone}
                      onChange={(e) => updateSetting('dbContourTZone', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  {/* Burn Cheeks */}
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                      <span>Tạo khối viền hàm & Gò má (Burn)</span>
                      <span className="font-mono text-neutral-300">{settings.dbContourCheek}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={settings.dbContourCheek}
                      onChange={(e) => updateSetting('dbContourCheek', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  <button
                    onClick={() => onOpenScripts('db_curves')}
                    className="w-full py-1 px-2 text-[11px] bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded flex items-center justify-center gap-1 transition-colors"
                  >
                    <FileCode className="w-3 h-3" />
                    <span>Lấy Script Dodge & Burn Curves (.jsx)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: COLOR GRADING & SKIN TONE ================= */}
        {activeTab === 'color' && (
          <div className="space-y-4">
            {/* CMYK Check Button & Header */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-rose-400" />
                Cân Tone Da Chuyên Nghiệp
              </span>
              <button
                onClick={onOpenAnalysis}
                className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-semibold rounded flex items-center gap-1 transition-colors"
              >
                <span>Kiểm tra CMYK</span>
              </button>
            </div>

            {/* Presets Grid */}
            <div>
              <div className="text-[11px] font-medium text-neutral-400 mb-2">
                Bộ Tone Da Phổ Biến (1-Click Presets):
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SKIN_TONE_PRESETS.map((preset) => {
                  const isSelected = settings.skinTonePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => applySkinTone(preset)}
                      className={`p-2 rounded border text-left flex items-start gap-2 transition-all ${
                        isSelected
                          ? 'bg-[#2b2b36] border-indigo-500 ring-1 ring-indigo-500/50'
                          : 'bg-[#1b1b22] border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full shrink-0 mt-0.5 border border-white/20 shadow-sm"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <div className="overflow-hidden">
                        <div className="text-[11px] font-semibold text-neutral-200 truncate">
                          {preset.name}
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate">
                          {preset.nameEn}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fine-Tuning Sliders */}
            <div className="space-y-3 bg-[#1c1c22] p-3 rounded border border-neutral-800">
              <div className="text-[11px] font-semibold text-neutral-300 pb-1 border-b border-neutral-800/80">
                Tinh chỉnh màu da chi tiết:
              </div>

              {/* Warmth */}
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Nhiệt độ da (Lạnh / Ấm)</span>
                  <span className="font-mono text-neutral-300">
                    {settings.warmth > 0 ? `+${settings.warmth}` : settings.warmth}
                  </span>
                </div>
                <input
                  type="range"
                  min={-40}
                  max={40}
                  value={settings.warmth}
                  onChange={(e) => updateSetting('warmth', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              {/* Tint */}
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Ám màu da Tint (Xanh lá / Đào hồng)</span>
                  <span className="font-mono text-neutral-300">
                    {settings.tint > 0 ? `+${settings.tint}` : settings.tint}
                  </span>
                </div>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  value={settings.tint}
                  onChange={(e) => updateSetting('tint', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                />
              </div>

              {/* Skin Luminance */}
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Độ sáng khối da (Skin Luminance)</span>
                  <span className="font-mono text-neutral-300">
                    {settings.skinLuminance > 0 ? `+${settings.skinLuminance}` : settings.skinLuminance}
                  </span>
                </div>
                <input
                  type="range"
                  min={-25}
                  max={30}
                  value={settings.skinLuminance}
                  onChange={(e) => updateSetting('skinLuminance', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>

              {/* Skin Saturation */}
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Độ tươi màu da (Saturation)</span>
                  <span className="font-mono text-neutral-300">
                    {settings.skinSaturation > 0 ? `+${settings.skinSaturation}` : settings.skinSaturation}
                  </span>
                </div>
                <input
                  type="range"
                  min={-40}
                  max={40}
                  value={settings.skinSaturation}
                  onChange={(e) => updateSetting('skinSaturation', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Highlight Glow */}
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Bóng da Glass-Skin (Highlight Glow)</span>
                  <span className="font-mono text-neutral-300">{settings.highlightGlow}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={settings.highlightGlow}
                  onChange={(e) => updateSetting('highlightGlow', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Độ tương phản ảnh (Punch Contrast)</span>
                  <span className="font-mono text-neutral-300">{settings.contrastPunch}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={35}
                  value={settings.contrastPunch}
                  onChange={(e) => updateSetting('contrastPunch', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-neutral-400"
                />
              </div>

              {/* High pass sharpen */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Sắc nét High Pass (Web / FB)</span>
                  <div className="flex items-center gap-2">
                    {onAutoSharpen && (
                      <button
                        onClick={onAutoSharpen}
                        title="Tự động phân tích độ sắc nét ảnh và đề xuất thông số High Pass tối ưu (Phím A)"
                        className="px-2 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                        <span>Auto-Sharpen</span>
                      </button>
                    )}
                    <span className="font-mono text-neutral-200 font-semibold">{settings.highPassSharpen}%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.highPassSharpen}
                  onChange={(e) => updateSetting('highPassSharpen', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
              </div>

              <button
                onClick={() => onOpenScripts('asian_skin_tone')}
                className="w-full py-1 px-2 text-[11px] bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded flex items-center justify-center gap-1 transition-colors"
              >
                <FileCode className="w-3 h-3" />
                <span>Script Tone Da Châu Á (.jsx)</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 3: MASKING TOOLS (AI OBJECT DETECTION) ================= */}
        {activeTab === 'masking' && maskingState && onMaskingStateChange && onDetectAllMasks && (
          <MaskingToolsPanel
            maskingState={maskingState}
            onMaskingStateChange={onMaskingStateChange}
            onDetectAllMasks={onDetectAllMasks}
            isDetecting={isDetectingMasks}
            onOpenScripts={onOpenScripts}
          />
        )}

        {/* ================= TAB 4: DETAILS (EYES & TEETH) ================= */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div className="font-semibold text-neutral-200 pb-2 border-b border-neutral-800 flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-sky-400" />
              Chi Tiết Chân Dung & Khuyết Điểm
            </div>

            <div className="space-y-3 bg-[#1c1c22] p-3 rounded border border-neutral-800">
              {/* Teeth Whitener */}
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Tẩy trắng răng tự nhiên (Khử ố vàng)</span>
                  <span className="font-mono text-neutral-300">{settings.teethWhiten}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.teethWhiten}
                  onChange={(e) => updateSetting('teethWhiten', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
                <div className="text-[10px] text-neutral-500 mt-0.5">
                  Tự động giảm sắc vàng và tăng sáng nhẹ không làm răng bị xám xịt.
                </div>
              </div>

              {/* Eye Brighten */}
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Bắt sáng tròng mắt (Catchlight Pop)</span>
                  <span className="font-mono text-neutral-300">{settings.eyeBrighten}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.eyeBrighten}
                  onChange={(e) => updateSetting('eyeBrighten', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                />
              </div>

              {/* Anti-Redness */}
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Khử đỏ da mặt, tai, cổ (Anti-Redness)</span>
                  <span className="font-mono text-neutral-300">{settings.antiRedness}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.antiRedness}
                  onChange={(e) => updateSetting('antiRedness', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="text-[10px] text-neutral-500 mt-0.5">
                  Khắc phục hiệu quả tình trạng da bị dị ứng, ửng đỏ quanh mũi hoặc tai.
                </div>
              </div>

              {/* Vignette */}
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Tối góc nhẹ (Focus Vignette)</span>
                  <span className="font-mono text-neutral-300">{settings.vignette}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={settings.vignette}
                  onChange={(e) => updateSetting('vignette', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-neutral-400"
                />
              </div>

              <button
                onClick={() => onOpenScripts('teeth_eyes')}
                className="w-full py-1 px-2 text-[11px] bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 rounded flex items-center justify-center gap-1 transition-colors"
              >
                <FileCode className="w-3 h-3" />
                <span>Script Mắt & Răng Trắng Tự Nhiên (.jsx)</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 4: PHOTOSHOP SCRIPTS & ACTIONS ================= */}
        {activeTab === 'scripts' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                Kho Script Photoshop Tự Động
              </span>
              <span className="text-[10px] text-neutral-400">Photoshop CC 2020-2026</span>
            </div>

            <div className="text-[11px] text-neutral-400">
              Bấm vào từng tính năng bên dưới để xem mã ExtendScript (.jsx), tải file về hoặc sao chép để chạy ngay trong Photoshop:
            </div>

            <div className="space-y-2">
              {PHOTOSHOP_SCRIPTS.map((script) => (
                <div
                  key={script.id}
                  className="p-2.5 bg-[#1b1b22] hover:bg-[#202028] border border-neutral-800 rounded transition-colors group cursor-pointer"
                  onClick={() => onOpenScripts(script.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-200 group-hover:text-indigo-300 text-[11px]">
                      {script.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded font-mono">
                      .jsx
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1 line-clamp-2">
                    {script.description}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 p-2.5 bg-indigo-950/30 border border-indigo-500/30 rounded text-[11px] text-indigo-200 space-y-1">
              <div className="font-semibold">💡 Hướng dẫn cài đặt nhanh vào Photoshop:</div>
              <ol className="list-decimal pl-4 space-y-0.5 text-[10px] text-neutral-300">
                <li>Tải file script <code className="text-sky-300">.jsx</code> về máy</li>
                <li>Mở Photoshop, chọn <code className="text-sky-300">File &gt; Scripts &gt; Browse...</code> và chọn file</li>
                <li>Hoặc copy vào thư mục <code className="text-sky-300">Presets/Scripts</code> để gán phím tắt F1-F12</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Panel Bottom Action Bar */}
      <div className="h-10 px-3 bg-[#1c1c22] border-t border-neutral-800 flex items-center justify-between text-[11px]">
        {onOpenBatch ? (
          <button
            onClick={onOpenBatch}
            className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Xử Lý Hàng Loạt (Batch)</span>
          </button>
        ) : (
          <span className="text-neutral-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Ready to Retouch
          </span>
        )}
        <button
          onClick={() => onOpenScripts()}
          className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
        >
          <span>Xuất Bộ Action (.JSX)</span>
        </button>
      </div>
    </aside>
  );
};
