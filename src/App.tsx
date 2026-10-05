/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { PhotoshopWorkspace } from './components/PhotoshopWorkspace';
import { CanvasViewport } from './components/CanvasViewport';
import { RetouchPanel } from './components/RetouchPanel';
import { ScriptModal } from './components/ScriptModal';
import { SkinAnalysisModal } from './components/SkinAnalysisModal';
import { BatchProcessModal } from './components/BatchProcessModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { AiImageEditModal } from './components/AiImageEditModal';
import { RetouchSettings, SampleImage, ViewMode, MaskingState } from './types/retouch';
import { analyzeSkinToneMetrics, detectPortraitClarity } from './utils/canvasFilters';
import { INITIAL_MASKING_STATE, detectAllPortraitMasks } from './utils/aiMaskDetection';
import { useRetouchHistory } from './hooks/useRetouchHistory';
import { Zap } from 'lucide-react';

// Import generated portrait image assets
import portraitAsian from './assets/images/portrait_asian_female_1791175124741.jpg';
import portraitEditorial from './assets/images/portrait_editorial_model_1791175137593.jpg';
import portraitMale from './assets/images/portrait_male_studio_1791175149660.jpg';

const INITIAL_SETTINGS: RetouchSettings = {
  // Frequency Separation (Tách tần số)
  fsEnabled: true,
  fsRadius: 8.0,
  fsSmoothness: 55,
  fsTextureSharpness: 75,
  fsBlemishRemoval: 35,

  // Dodge & Burn (Đánh khối)
  dbEnabled: true,
  dbIntensity: 45,
  dbContourTZone: 40,
  dbContourCheek: 35,
  dbVisualAid: false,

  // Face Details
  eyeBrighten: 30,
  teethWhiten: 35,
  lipSaturation: 5,
  lipTone: 'natural',
  antiRedness: 25,

  // Color Grading & Skin Tone
  skinTonePreset: 'asian_glow',
  warmth: 8,
  tint: 14,
  skinLuminance: 12,
  skinSaturation: 8,
  contrastPunch: 6,
  highlightGlow: 15,
  grain: 0,

  // Sharpness & Finish
  highPassSharpen: 40,
  vignette: 10,
};

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('photoshop-docked');
  
  // History-managed RetouchSettings state
  const {
    settings,
    updateSettings: setSettings,
    undo,
    redo,
    canUndo,
    canRedo,
    resetTo,
  } = useRetouchHistory(INITIAL_SETTINGS);

  const [sampleImages, setSampleImages] = useState<SampleImage[]>([
    {
      id: 'sample_asian',
      name: 'Chân Dung Á Đông (Studio)',
      category: 'asian',
      url: portraitAsian,
    },
    {
      id: 'sample_editorial',
      name: 'Mẫu Thời Trang Editorial',
      category: 'editorial',
      url: portraitEditorial,
    },
    {
      id: 'sample_male',
      name: 'Chân Dung Nam Khối Sáng',
      category: 'male',
      url: portraitMale,
    },
  ]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('sample_asian');

  // Modals state
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [activeScriptId, setActiveScriptId] = useState<string | undefined>(undefined);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // AI Masking Tools state
  const [maskingState, setMaskingState] = useState<MaskingState>(INITIAL_MASKING_STATE);
  const [isDetectingMasks, setIsDetectingMasks] = useState<boolean>(false);

  const toastTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 1600);
  };

  const handleDetectAllMasks = async () => {
    const canvases = document.querySelectorAll('canvas');
    if (canvases.length === 0) {
      showToast('Chưa tìm thấy khung hình để quét mặt nạ.');
      return;
    }

    setIsDetectingMasks(true);
    try {
      const activeCanvas = canvases[0];
      const results = await detectAllPortraitMasks(activeCanvas);

      setMaskingState((prev) => ({
        ...prev,
        activeMask: 'skin',
        showOverlay: true,
        masks: {
          ...prev.masks,
          skin: {
            ...prev.masks.skin,
            hasSelection: true,
            coverage: results.skin.coverage,
            isAiDetected: true,
            maskBuffer: results.skin.mask,
            maskWidth: activeCanvas.width,
            maskHeight: activeCanvas.height,
          },
          eyes: {
            ...prev.masks.eyes,
            hasSelection: true,
            coverage: results.eyes.coverage,
            isAiDetected: true,
            maskBuffer: results.eyes.mask,
            maskWidth: activeCanvas.width,
            maskHeight: activeCanvas.height,
          },
          hair: {
            ...prev.masks.hair,
            hasSelection: true,
            coverage: results.hair.coverage,
            isAiDetected: true,
            maskBuffer: results.hair.mask,
            maskWidth: activeCanvas.width,
            maskHeight: activeCanvas.height,
          },
        },
      }));

      showToast(`⚡ AI đã nhận diện: Da (${results.skin.coverage}%), Mắt (${results.eyes.coverage}%), Tóc (${results.hair.coverage}%) [Phím O xem mặt nạ]`);
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi quét vùng chọn AI.');
    } finally {
      setIsDetectingMasks(false);
    }
  };

  const handleUndo = () => {
    const success = undo();
    if (success) {
      showToast('Hoàn tác (Undo) [Ctrl+Z]');
    }
  };

  const handleRedo = () => {
    const success = redo();
    if (success) {
      showToast('Làm lại (Redo) [Ctrl+Shift+Z]');
    }
  };

  const handleApplyAiImage = (newImageUrl: string, name?: string) => {
    const newImage: SampleImage = {
      id: `ai_${Date.now()}`,
      name: name || 'Ảnh AI Retouch',
      category: 'custom',
      url: newImageUrl,
    };
    setSampleImages((prev) => [newImage, ...prev]);
    setSelectedSampleId(newImage.id);
    showToast('⚡ Đã đưa ảnh AI vào Studio Retouch!');
  };

  const currentSample = sampleImages.find((img) => img.id === selectedSampleId) || sampleImages[0];

  const [currentMetrics, setCurrentMetrics] = useState<ReturnType<typeof analyzeSkinToneMetrics>>({
    rgb: { r: 232, g: 182, b: 168 },
    cmyk: { c: 5, m: 28, y: 32, k: 0 },
    toneStatus: 'ideal',
    cmykRatioMessage: 'Tỷ lệ C:M:Y = 5% : 28% : 32% chuẩn tone hồng đào tự nhiên',
    recommendation: 'Tone da đạt chuẩn vàng, độ chuyển mềm mại và khối sáng sống động.',
  });

  const handleOpenScripts = (scriptId?: string) => {
    setActiveScriptId(scriptId);
    setIsScriptModalOpen(true);
  };

  const handleCustomImageUploaded = (url: string) => {
    const newImage: SampleImage = {
      id: `custom_${Date.now()}`,
      name: 'Ảnh Của Bạn',
      category: 'custom',
      url,
    };
    setSampleImages((prev) => [newImage, ...prev]);
    setSelectedSampleId(newImage.id);
  };

  const handleResetSettings = () => {
    resetTo(INITIAL_SETTINGS);
    showToast('Đã khôi phục thông số mặc định [Phím R]');
  };

  const applyPresetNatural = () => {
    setSettings((prev) => ({
      ...prev,
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
    }), true);
    showToast('Áp dụng: Mịn Da Tự Nhiên [Phím 1]');
  };

  const applyPresetGlam = () => {
    setSettings((prev) => ({
      ...prev,
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
    }), true);
    showToast('Áp dụng: Căng Bóng Glam [Phím 2]');
  };

  const applyPresetEditorial = () => {
    setSettings((prev) => ({
      ...prev,
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
    }), true);
    showToast('Áp dụng: Thời Trang Tạp Chí [Phím 3]');
  };

  const handleAutoSharpen = () => {
    const canvases = document.querySelectorAll('canvas');
    if (canvases.length > 0) {
      // Find the first loaded canvas (source image)
      const targetCanvas = canvases[0];
      const clarity = detectPortraitClarity(targetCanvas);

      setSettings((prev) => ({
        ...prev,
        highPassSharpen: clarity.suggestedSharpen,
      }), true);

      const levelText =
        clarity.qualityLevel === 'soft'
          ? 'Ảnh dịu nét'
          : clarity.qualityLevel === 'crisp'
          ? 'Ảnh sắc nét'
          : clarity.qualityLevel === 'ultra_sharp'
          ? 'Ảnh macro siêu nét'
          : 'Chuẩn Studio';

      showToast(`⚡ Auto-Sharpen: Đặt High Pass ${clarity.suggestedSharpen}% (${levelText})`);
    } else {
      showToast('Đang phân tích độ nét...');
    }
  };

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut when active in text inputs, textareas, selects
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Undo / Redo with Ctrl or Cmd
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          return;
        } else if (key === 'y') {
          e.preventDefault();
          handleRedo();
          return;
        }
      }

      // Ignore other single-letter shortcuts if Ctrl / Cmd / Alt are pressed
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      if (key === 'g') {
        e.preventDefault();
        setIsAiModalOpen((prev) => !prev);
      } else if (key === 'o') {
        e.preventDefault();
        setMaskingState((prev) => {
          const next = !prev.showOverlay;
          showToast(`Lớp phủ Mặt Nạ [O]: ${next ? 'BẬT' : 'TẮT'}`);
          return { ...prev, showOverlay: next };
        });
      } else if (key === 'a') {
        e.preventDefault();
        handleAutoSharpen();
      } else if (key === 'f') {
        e.preventDefault();
        setSettings((prev) => {
          const next = !prev.fsEnabled;
          showToast(`Tách Tần Số (FS): ${next ? 'BẬT' : 'TẮT'} [Phím F]`);
          return { ...prev, fsEnabled: next };
        }, true);
      } else if (key === 'd') {
        e.preventDefault();
        setSettings((prev) => {
          const next = !prev.dbEnabled;
          showToast(`Đánh Khối (Dodge & Burn): ${next ? 'BẬT' : 'TẮT'} [Phím D]`);
          return { ...prev, dbEnabled: next };
        }, true);
      } else if (key === 'v') {
        e.preventDefault();
        setSettings((prev) => {
          const next = !prev.dbVisualAid;
          showToast(`Lớp Soi Da (Visual Aid): ${next ? 'BẬT' : 'TẮT'} [Phím V]`);
          return { ...prev, dbVisualAid: next };
        }, true);
      } else if (key === 'b') {
        e.preventDefault();
        setIsBatchModalOpen((prev) => !prev);
      } else if (key === 'c') {
        e.preventDefault();
        setIsAnalysisModalOpen((prev) => !prev);
      } else if (key === 's') {
        e.preventDefault();
        setIsScriptModalOpen((prev) => !prev);
      } else if (key === '1') {
        e.preventDefault();
        applyPresetNatural();
      } else if (key === '2') {
        e.preventDefault();
        applyPresetGlam();
      } else if (key === '3') {
        e.preventDefault();
        applyPresetEditorial();
      } else if (key === 'r') {
        e.preventDefault();
        handleResetSettings();
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setViewMode((prev) => {
          const next = prev === 'photoshop-docked' ? 'studio-expanded' : 'photoshop-docked';
          showToast(next === 'photoshop-docked' ? 'Chế độ Photoshop CC' : 'Chế độ Studio Toàn Màn Hình [Tab]');
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleExportImage = () => {
    // Find canvas and export
    const canvases = document.querySelectorAll('canvas');
    if (canvases.length > 0) {
      // Find the display canvas
      const targetCanvas = canvases[canvases.length - 1];
      const link = document.createElement('a');
      link.download = `Lumina_Retouched_${Date.now()}.png`;
      link.href = targetCanvas.toDataURL('image/png', 0.95);
      link.click();
    }
  };

  const handleSampleColorPicked = (metrics: ReturnType<typeof analyzeSkinToneMetrics>) => {
    setCurrentMetrics(metrics);
    setIsAnalysisModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#141418] text-neutral-200 overflow-hidden font-sans">
      {/* Top Application Header */}
      <HeaderBar
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onOpenScripts={() => handleOpenScripts()}
        onOpenAnalysis={() => setIsAnalysisModalOpen(true)}
        onOpenBatch={() => setIsBatchModalOpen(true)}
        onOpenAiEdit={() => setIsAiModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onResetSettings={handleResetSettings}
        onExportImage={handleExportImage}
      />

      {/* Main Content Area: Either Photoshop CC Docked View or Full Retouch Studio */}
      <main className="flex-1 flex overflow-hidden">
        {viewMode === 'photoshop-docked' ? (
          <PhotoshopWorkspace
            settings={settings}
            onSettingsChange={setSettings}
            sampleImages={sampleImages}
            selectedSampleId={selectedSampleId}
            maskingState={maskingState}
            onMaskingStateChange={setMaskingState}
            onDetectAllMasks={handleDetectAllMasks}
            isDetectingMasks={isDetectingMasks}
            onSelectSample={setSelectedSampleId}
            onCustomImageUploaded={handleCustomImageUploaded}
            onOpenScripts={handleOpenScripts}
            onOpenAnalysis={() => setIsAnalysisModalOpen(true)}
            onOpenBatch={() => setIsBatchModalOpen(true)}
            onOpenAiEdit={() => setIsAiModalOpen(true)}
            onAutoSharpen={handleAutoSharpen}
            onSampleColorPicked={handleSampleColorPicked}
          />
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Expanded Studio: Left Canvas + Right Retouch Panel */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <CanvasViewport
                settings={settings}
                sampleImages={sampleImages}
                selectedSampleId={selectedSampleId}
                maskingState={maskingState}
                onSelectSample={setSelectedSampleId}
                onCustomImageUploaded={handleCustomImageUploaded}
                onSampleColorPicked={handleSampleColorPicked}
              />
            </div>
            <div className="w-84 md:w-96 flex flex-col bg-[#222228] border-l border-neutral-800 shrink-0 overflow-hidden">
              <RetouchPanel
                settings={settings}
                onChange={setSettings}
                maskingState={maskingState}
                onMaskingStateChange={setMaskingState}
                onDetectAllMasks={handleDetectAllMasks}
                isDetectingMasks={isDetectingMasks}
                onOpenScripts={handleOpenScripts}
                onOpenAnalysis={() => setIsAnalysisModalOpen(true)}
                onOpenBatch={() => setIsBatchModalOpen(true)}
                onOpenAiEdit={() => setIsAiModalOpen(true)}
                onAutoSharpen={handleAutoSharpen}
              />
            </div>
          </div>
        )}
      </main>

      {/* AI Image Edit & Create Modal (gemini-3.1-flash-image-preview) */}
      <AiImageEditModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        currentImageSrc={currentSample?.url}
        onApplyResultImage={handleApplyAiImage}
      />

      {/* Batch Processing Modal */}
      <BatchProcessModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        settings={settings}
        sampleImages={sampleImages}
        onOpenScripts={handleOpenScripts}
      />

      {/* Photoshop ExtendScript & Actions Modal */}
      <ScriptModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        initialScriptId={activeScriptId}
      />

      {/* Skin Tone CMYK Analysis Modal */}
      <SkinAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        metrics={currentMetrics}
      />

      {/* Keyboard Shortcuts Guide Modal */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Floating HUD Toast Notification for Keyboard Shortcuts */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#1c1c24]/95 text-neutral-100 text-xs font-semibold rounded-lg shadow-2xl border border-indigo-500/40 backdrop-blur-md flex items-center gap-2 pointer-events-none animate-fade-in">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
