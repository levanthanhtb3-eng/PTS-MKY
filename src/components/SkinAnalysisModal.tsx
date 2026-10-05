import React from 'react';
import { X, CheckCircle2, AlertTriangle, Info, Sparkles, Sliders } from 'lucide-react';
import { analyzeSkinToneMetrics } from '../utils/canvasFilters';

interface SkinAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: ReturnType<typeof analyzeSkinToneMetrics>;
  onApplyPreset?: () => void;
}

export const SkinAnalysisModal: React.FC<SkinAnalysisModalProps> = ({
  isOpen,
  onClose,
  metrics,
  onApplyPreset,
}) => {
  if (!isOpen) return null;

  const { rgb, cmyk, toneStatus, cmykRatioMessage, recommendation } = metrics;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#1f1f26] border border-neutral-700/80 rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#25252e] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">
              Phân Tích Tỷ Lệ Màu Da CMYK (Photoshop Rule of Thumb)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Color Preview & Current Values */}
          <div className="flex items-center gap-4 p-3 bg-[#17171d] rounded-lg border border-neutral-800">
            <div
              className="w-16 h-16 rounded-lg shadow-inner border border-neutral-700 shrink-0"
              style={{ backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }}
            />
            <div className="flex-1 space-y-1">
              <div className="text-[11px] text-neutral-400">Điểm lấy mẫu da trung tâm:</div>
              <div className="font-mono text-sm font-bold text-white">
                RGB: ({rgb.r}, {rgb.g}, {rgb.b})
              </div>
              <div className="font-mono text-xs text-neutral-300">
                CMYK: <span className="text-sky-400">C:{cmyk.c}%</span> ·{' '}
                <span className="text-rose-400">M:{cmyk.m}%</span> ·{' '}
                <span className="text-amber-300">Y:{cmyk.y}%</span> ·{' '}
                <span className="text-neutral-400">K:{cmyk.k}%</span>
              </div>
            </div>
          </div>

          {/* Metric Status Card */}
          <div
            className={`p-3.5 rounded-lg border flex items-start gap-2.5 ${
              toneStatus === 'ideal'
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            }`}
          >
            {toneStatus === 'ideal' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold text-xs text-white">
                {toneStatus === 'ideal' ? 'Tone Da Cân Bằng Chuẩn Đẹp' : 'Phát Hiện Sai Lệch Màu Da'}
              </div>
              <div className="text-[11px] mt-0.5 leading-relaxed">{cmykRatioMessage}</div>
            </div>
          </div>

          {/* Recommendation Box */}
          <div className="p-3 bg-[#191920] border border-neutral-800 rounded-lg space-y-1.5">
            <div className="font-semibold text-neutral-200 flex items-center gap-1.5 text-[11px]">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Gợi ý điều chỉnh nhanh:</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">{recommendation}</p>
          </div>

          {/* Rule explanation */}
          <div className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-lg text-[10px] text-neutral-400 space-y-1">
            <div className="font-semibold text-neutral-300 flex items-center gap-1">
              <Info className="w-3 h-3 text-sky-400" />
              <span>Quy tắc vàng cân màu da trong Photoshop:</span>
            </div>
            <p>
              • <strong>Cyan (C)</strong> luôn bằng 1/5 đến 1/3 giá trị của Magenta (M).<br />
              • <strong>Yellow (Y)</strong> bằng hoặc cao hơn Magenta một chút (tỷ lệ 1 : 1 đến 1 : 1.25) để da có độ ấm tự nhiên không bị nhợt nhạt.<br />
              • <strong>Black (K)</strong> phải ở mức thấp (dưới 10%) ở vùng sáng và trung tính của da mặt.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#1a1a22] border-t border-neutral-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
