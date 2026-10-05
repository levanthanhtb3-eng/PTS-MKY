import React, { useState } from 'react';
import {
  Sparkles,
  Eye,
  Smile,
  Scissors,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Layers,
  ChevronDown,
  ChevronRight,
  EyeOff,
  Flame,
  FileCode,
  RotateCcw
} from 'lucide-react';
import { MaskTarget, MaskingState, LocalMaskSettings } from '../types/retouch';

interface MaskingToolsPanelProps {
  maskingState: MaskingState;
  onMaskingStateChange: (state: MaskingState) => void;
  onDetectAllMasks: () => void;
  isDetecting?: boolean;
  onOpenScripts?: (scriptId?: string) => void;
}

export const MaskingToolsPanel: React.FC<MaskingToolsPanelProps> = ({
  maskingState,
  onMaskingStateChange,
  onDetectAllMasks,
  isDetecting = false,
  onOpenScripts,
}) => {
  const { activeMask, showOverlay, overlayColor, masks } = maskingState;

  const setActiveMask = (target: MaskTarget | null) => {
    onMaskingStateChange({
      ...maskingState,
      activeMask: activeMask === target ? null : target,
      showOverlay: activeMask === target ? false : true,
    });
  };

  const toggleOverlay = () => {
    onMaskingStateChange({
      ...maskingState,
      showOverlay: !showOverlay,
    });
  };

  const setOverlayColor = (color: 'ruby' | 'emerald') => {
    onMaskingStateChange({
      ...maskingState,
      overlayColor: color,
    });
  };

  const updateMaskSettings = (target: MaskTarget, updates: Partial<LocalMaskSettings>) => {
    onMaskingStateChange({
      ...maskingState,
      masks: {
        ...masks,
        [target]: {
          ...masks[target],
          settings: {
            ...masks[target].settings,
            ...updates,
          },
        },
      },
    });
  };

  const toggleMaskEnabled = (target: MaskTarget, e: React.MouseEvent) => {
    e.stopPropagation();
    updateMaskSettings(target, { enabled: !masks[target].settings.enabled });
  };

  const toggleMaskInverted = (target: MaskTarget) => {
    updateMaskSettings(target, { inverted: !masks[target].settings.inverted });
  };

  const resetMaskAdjustments = (target: MaskTarget) => {
    if (target === 'skin') {
      updateMaskSettings('skin', {
        skinSmoothness: 35,
        skinWarmth: 6,
        skinTint: 4,
        skinLuminance: 8,
        skinBlemishes: 40,
        opacity: 100,
        feather: 8,
        inverted: false,
      });
    } else if (target === 'eyes') {
      updateMaskSettings('eyes', {
        eyeClarity: 45,
        eyeBrightness: 35,
        eyeCatchlight: 40,
        eyeWhiten: 30,
        opacity: 100,
        feather: 4,
        inverted: false,
      });
    } else if (target === 'hair') {
      updateMaskSettings('hair', {
        hairGloss: 35,
        hairContrast: 25,
        hairTint: 0,
        hairLuminance: -5,
        opacity: 100,
        feather: 6,
        inverted: false,
      });
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header & Auto-Detect Banner */}
      <div className="bg-[#1b1b22] p-3 rounded-lg border border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-200">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Mặt Nạ Vùng Chọn AI (AI Masking)</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded font-mono">
            Semantic Seg
          </span>
        </div>
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          Tự động nhận diện cấu trúc đối tượng chân dung (Da, Mắt, Tóc) để tạo mặt nạ vùng chọn chính xác và chỉnh sửa độc lập.
        </p>

        {/* Global Action: Detect All */}
        <div className="pt-1 flex gap-2">
          <button
            onClick={onDetectAllMasks}
            disabled={isDetecting}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 disabled:opacity-50 text-white font-semibold rounded-md text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isDetecting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>AI Đang Phân Vùng Chân Dung...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>⚡ Tự Động Quét AI (Da, Mắt, Tóc)</span>
              </>
            )}
          </button>
        </div>

        {/* Mask Overlay Controls */}
        <div className="pt-1 flex items-center justify-between text-[11px] border-t border-neutral-800/80">
          <button
            onClick={toggleOverlay}
            className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
              showOverlay
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-medium'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            {showOverlay ? <Eye className="w-3 h-3 text-rose-400" /> : <EyeOff className="w-3 h-3" />}
            <span>Hiển thị Mặt nạ [O]</span>
          </button>

          {showOverlay && (
            <div className="flex items-center gap-1 bg-[#141418] p-0.5 rounded border border-neutral-800">
              <button
                onClick={() => setOverlayColor('ruby')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  overlayColor === 'ruby' ? 'bg-rose-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Đỏ Ruby
              </button>
              <button
                onClick={() => setOverlayColor('emerald')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  overlayColor === 'emerald' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Xanh Ngọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3 Mask Cards List */}
      <div className="space-y-2">
        {/* ================= MASK 1: SKIN ================= */}
        <div className={`rounded-lg border transition-all overflow-hidden ${
          activeMask === 'skin' ? 'bg-[#22222a] border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30' : 'bg-[#1a1a20] border-neutral-800'
        }`}>
          {/* Card Header */}
          <div
            onClick={() => setActiveMask('skin')}
            className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-neutral-800/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Smile className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <span>Mặt Nạ Làn Da (Skin Mask)</span>
                  {masks.skin.hasSelection && (
                    <span className="text-[10px] text-emerald-400 font-mono font-normal">
                      ({masks.skin.coverage}%)
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-neutral-400">
                  {masks.skin.hasSelection ? 'Đã tạo vùng chọn chuẩn tone da' : 'Chưa quét vùng da'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => toggleMaskEnabled('skin', e)}
                title={masks.skin.settings.enabled ? 'Đang kích hoạt' : 'Đang tắt'}
                className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                  masks.skin.settings.enabled ? 'bg-emerald-500 text-white' : 'bg-neutral-700 text-neutral-400'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
              </button>
              {activeMask === 'skin' ? (
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              )}
            </div>
          </div>

          {/* Expanded Local Adjustments for Skin */}
          {activeMask === 'skin' && (
            <div className="p-3 border-t border-neutral-800 space-y-3 bg-[#1e1e26]">
              {/* Mask Properties */}
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-neutral-800/80">
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Độ mờ đục (Opacity)</span>
                    <span className="font-mono text-neutral-300">{masks.skin.settings.opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={masks.skin.settings.opacity}
                    onChange={(e) => updateMaskSettings('skin', { opacity: parseInt(e.target.value) })}
                    className="w-full h-1 bg-neutral-700 rounded appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Mềm biên (Feather)</span>
                    <span className="font-mono text-neutral-300">{masks.skin.settings.feather}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={masks.skin.settings.feather}
                    onChange={(e) => updateMaskSettings('skin', { feather: parseInt(e.target.value) })}
                    className="w-full h-1 bg-neutral-700 rounded appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>

              {/* Localized Retouch Sliders for Skin */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-semibold text-amber-300 flex items-center justify-between">
                  <span>Thông số chỉnh sửa trên vùng da:</span>
                  <button
                    onClick={() => resetMaskAdjustments('skin')}
                    title="Đặt lại thông số da"
                    className="text-neutral-400 hover:text-white p-0.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>

                {/* Skin Smoothness */}
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Làm mịn da cục bộ (Local Smooth)</span>
                    <span className="font-mono text-neutral-300">{masks.skin.settings.skinSmoothness}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={masks.skin.settings.skinSmoothness}
                    onChange={(e) => updateMaskSettings('skin', { skinSmoothness: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-700 rounded appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Skin Warmth */}
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Độ ấm màu da (Warmth)</span>
                    <span className="font-mono text-neutral-300">{masks.skin.settings.skinWarmth > 0 ? `+${masks.skin.settings.skinWarmth}` : masks.skin.settings.skinWarmth}</span>
                  </div>
                  <input
                    type="range"
                    min={-40}
                    max={40}
                    value={masks.skin.settings.skinWarmth}
                    onChange={(e) => updateMaskSettings('skin', { skinWarmth: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-700 rounded appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Skin Luminance */}
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Nâng sáng khối da (Skin Lift)</span>
                    <span className="font-mono text-neutral-300">{masks.skin.settings.skinLuminance > 0 ? `+${masks.skin.settings.skinLuminance}` : masks.skin.settings.skinLuminance}</span>
                  </div>
                  <input
                    type="range"
                    min={-30}
                    max={30}
                    value={masks.skin.settings.skinLuminance}
                    onChange={(e) => updateMaskSettings('skin', { skinLuminance: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-700 rounded appearance-none cursor-pointer accent-sky-400"
                  />
                </div>

                {/* Blemish Reduction */}
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Khử thâm & đốm tàn nhang (Blemish Fade)</span>
                    <span className="font-mono text-neutral-300">{masks.skin.settings.skinBlemishes}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={masks.skin.settings.skinBlemishes}
                    onChange={(e) => updateMaskSettings('skin', { skinBlemishes: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-700 rounded appearance-none cursor-pointer accent-rose-400"
                  />
                </div>
              </div>

              {/* Actions row */}
              <div className="pt-2 flex items-center justify-between border-t border-neutral-800">
                <button
                  onClick={() => toggleMaskInverted('skin')}
                  className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                    masks.skin.settings.inverted
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                      : 'border-neutral-700 text-neutral-400 hover:text-white'
                  }`}
                >
                  Đảo ngược vùng chọn (Invert)
                </button>

                {onOpenScripts && (
                  <button
                    onClick={() => onOpenScripts('asian_skin_tone')}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <FileCode className="w-3 h-3" />
                    <span>Lấy Layer Mask (.jsx)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================= MASK 2: EYES ================= */}
        <div className={`rounded-lg border transition-all overflow-hidden ${
          activeMask === 'eyes' ? 'bg-[#22222a] border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30' : 'bg-[#1a1a20] border-neutral-800'
        }`}>
          {/* Card Header */}
          <div
            onClick={() => setActiveMask('eyes')}
            className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-neutral-800/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <span>Mặt Nạ Đôi Mắt (Eyes &amp; Iris)</span>
                  {masks.eyes.hasSelection && (
                    <span className="text-[10px] text-emerald-400 font-mono font-normal">
                      ({masks.eyes.coverage}%)
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-neutral-400">
                  {masks.eyes.hasSelection ? 'Đã cô lập 2 tròng mắt & củng mạc' : 'Chưa quét vùng mắt'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => toggleMaskEnabled('eyes', e)}
                title={masks.eyes.settings.enabled ? 'Đang kích hoạt' : 'Đang tắt'}
                className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                  masks.eyes.settings.enabled ? 'bg-emerald-500 text-white' : 'bg-neutral-700 text-neutral-400'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
              </button>
              {activeMask === 'eyes' ? (
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              )}
            </div>
          </div>

          {/* Expanded Local Adjustments for Eyes */}
          {activeMask === 'eyes' && (
            <div className="p-3 border-t border-neutral-800 space-y-3 bg-[#1e1e26]">
              {/* Mask Properties */}
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-neutral-800/80">
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Độ mờ đục (Opacity)</span>
                    <span className="font-mono text-neutral-300">{masks.eyes.settings.opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={masks.eyes.settings.opacity}
                    onChange={(e) => updateMaskSettings('eyes', { opacity: parseInt(e.target.value) })}
                    className="w-full h-1 bg-neutral-700 rounded appearance-none cursor-pointer accent-sky-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Mềm biên (Feather)</span>
                    <span className="font-mono text-neutral-300">{masks.eyes.settings.feather}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={15}
                    value={masks.eyes.settings.feather}
                    onChange={(e) => updateMaskSettings('eyes', { feather: parseInt(e.target.value) })}
                    className="w-full h-1 bg-neutral-700 rounded appearance-none cursor-pointer accent-sky-400"
                  />
                </div>
              </div>

              {/* Localized Retouch Sliders for Eyes */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-semibold text-sky-300 flex items-center justify-between">
                  <span>Thông số tinh chỉnh mắt:</span>
                  <button
                    onClick={() => resetMaskAdjustments('eyes')}
                    title="Đặt lại thông số mắt"
                    className="text-neutral-400 hover:text-white p-0.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>

                {/* Eye Brightness */}
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Tăng sáng ánh nhìn (Eye Brightness)</span>
                    <span className="font-mono text-neutral-300">{masks.eyes.settings.eyeBrightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={masks.eyes.settings.eyeBrightness}
                    onChange={(e) => updateMaskSettings('eyes', { eyeBrightness: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-700 rounded appearance-none cursor-pointer accent-sky-400"
                  />
                </div>

                {/* Iris Clarity */}
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Độ trong & sắc nét tròng mắt (Iris Clarity)</span>
                    <span className="font-mono text-neutral-300">{masks.eyes.settings.eyeClarity}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={masks.eyes.settings.eyeClarity}
                    onChange={(e) => updateMaskSettings('eyes', { eyeClarity: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-700 rounded appearance-none cursor-pointer accent-indigo-400"
                  />
                </div>

                {/* Catchlight */}
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Bắt sáng điểm catchlight (Catchlight Boost)</span>
                    <span className="font-mono text-neutral-300">{masks.eyes.settings.eyeCatchlight}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={masks.eyes.settings.eyeCatchlight}
                    onChange={(e) => updateMaskSettings('eyes', { eyeCatchlight: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-700 rounded appearance-none cursor-pointer accent-amber-300"
                  />
                </div>

                {/* Sclera Whiten */}
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Khử vàng tròng trắng (Sclera Whitening)</span>
                    <span className="font-mono text-neutral-300">{masks.eyes.settings.eyeWhiten}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={masks.eyes.settings.eyeWhiten}
                    onChange={(e) => updateMaskSettings('eyes', { eyeWhiten: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-700 rounded appearance-none cursor-pointer accent-sky-300"
                  />
                </div>
              </div>

              {/* Actions row */}
              <div className="pt-2 flex items-center justify-between border-t border-neutral-800">
                <button
                  onClick={() => toggleMaskInverted('eyes')}
                  className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                    masks.eyes.settings.inverted
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                      : 'border-neutral-700 text-neutral-400 hover:text-white'
                  }`}
                >
                  Đảo ngược vùng chọn (Invert)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================= MASK 3: HAIR ================= */}
        <div className={`rounded-lg border transition-all overflow-hidden ${
          activeMask === 'hair' ? 'bg-[#22222a] border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30' : 'bg-[#1a1a20] border-neutral-800'
        }`}>
          {/* Card Header */}
          <div
            onClick={() => setActiveMask('hair')}
            className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-neutral-800/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <span>Mặt Nạ Mái Tóc (Hair Mask)</span>
                  {masks.hair.hasSelection && (
                    <span className="text-[10px] text-emerald-400 font-mono font-normal">
                      ({masks.hair.coverage}%)
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-neutral-400">
                  {masks.hair.hasSelection ? 'Đã cô lập sợi tóc & viền trán' : 'Chưa quét vùng tóc'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => toggleMaskEnabled('hair', e)}
                title={masks.hair.settings.enabled ? 'Đang kích hoạt' : 'Đang tắt'}
                className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                  masks.hair.settings.enabled ? 'bg-emerald-500 text-white' : 'bg-neutral-700 text-neutral-400'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
              </button>
              {activeMask === 'hair' ? (
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              )}
            </div>
          </div>

          {/* Expanded Local Adjustments for Hair */}
          {activeMask === 'hair' && (
            <div className="p-3 border-t border-neutral-800 space-y-3 bg-[#1e1e26]">
              {/* Mask Properties */}
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-neutral-800/80">
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Độ mờ đục (Opacity)</span>
                    <span className="font-mono text-neutral-300">{masks.hair.settings.opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={masks.hair.settings.opacity}
                    onChange={(e) => updateMaskSettings('hair', { opacity: parseInt(e.target.value) })}
                    className="w-full h-1 bg-neutral-700 rounded appearance-none cursor-pointer accent-purple-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Mềm biên (Feather)</span>
                    <span className="font-mono text-neutral-300">{masks.hair.settings.feather}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={masks.hair.settings.feather}
                    onChange={(e) => updateMaskSettings('hair', { feather: parseInt(e.target.value) })}
                    className="w-full h-1 bg-neutral-700 rounded appearance-none cursor-pointer accent-purple-400"
                  />
                </div>
              </div>

              {/* Localized Retouch Sliders for Hair */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-semibold text-purple-300 flex items-center justify-between">
                  <span>Thông số sợi tóc:</span>
                  <button
                    onClick={() => resetMaskAdjustments('hair')}
                    title="Đặt lại thông số tóc"
                    className="text-neutral-400 hover:text-white p-0.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>

                {/* Hair Gloss */}
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Độ bóng mượt sợi tóc (Hair Specular Gloss)</span>
                    <span className="font-mono text-neutral-300">{masks.hair.settings.hairGloss}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={masks.hair.settings.hairGloss}
                    onChange={(e) => updateMaskSettings('hair', { hairGloss: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-700 rounded appearance-none cursor-pointer accent-purple-400"
                  />
                </div>

                {/* Hair Contrast Depth */}
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Khối sâu chân tóc & Đậm màu (Hair Depth)</span>
                    <span className="font-mono text-neutral-300">{masks.hair.settings.hairContrast}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={masks.hair.settings.hairContrast}
                    onChange={(e) => updateMaskSettings('hair', { hairContrast: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-700 rounded appearance-none cursor-pointer accent-neutral-400"
                  />
                </div>

                {/* Hair Luminance */}
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Tăng / Giảm sáng tóc (Hair Lift)</span>
                    <span className="font-mono text-neutral-300">{masks.hair.settings.hairLuminance > 0 ? `+${masks.hair.settings.hairLuminance}` : masks.hair.settings.hairLuminance}</span>
                  </div>
                  <input
                    type="range"
                    min={-40}
                    max={40}
                    value={masks.hair.settings.hairLuminance}
                    onChange={(e) => updateMaskSettings('hair', { hairLuminance: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-700 rounded appearance-none cursor-pointer accent-purple-400"
                  />
                </div>

                {/* Hair Tint */}
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Ám màu nhuộm tóc (Hair Color Tint)</span>
                    <span className="font-mono text-neutral-300">{masks.hair.settings.hairTint > 0 ? `+${masks.hair.settings.hairTint}` : masks.hair.settings.hairTint}</span>
                  </div>
                  <input
                    type="range"
                    min={-40}
                    max={40}
                    value={masks.hair.settings.hairTint}
                    onChange={(e) => updateMaskSettings('hair', { hairTint: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-700 rounded appearance-none cursor-pointer accent-rose-400"
                  />
                </div>
              </div>

              {/* Actions row */}
              <div className="pt-2 flex items-center justify-between border-t border-neutral-800">
                <button
                  onClick={() => toggleMaskInverted('hair')}
                  className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                    masks.hair.settings.inverted
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                      : 'border-neutral-700 text-neutral-400 hover:text-white'
                  }`}
                >
                  Đảo ngược vùng chọn (Invert)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
