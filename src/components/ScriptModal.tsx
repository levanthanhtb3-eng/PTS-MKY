import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode, ExternalLink, HelpCircle, Terminal } from 'lucide-react';
import { PHOTOSHOP_SCRIPTS, PhotoshopScriptItem } from '../data/photoshopScripts';

interface ScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialScriptId?: string;
}

export const ScriptModal: React.FC<ScriptModalProps> = ({
  isOpen,
  onClose,
  initialScriptId,
}) => {
  const [selectedScriptId, setSelectedScriptId] = useState<string>(
    initialScriptId || PHOTOSHOP_SCRIPTS[0].id
  );
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const activeScript =
    PHOTOSHOP_SCRIPTS.find((s) => s.id === selectedScriptId) || PHOTOSHOP_SCRIPTS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeScript.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeScript.code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeScript.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#1f1f26] border border-neutral-700/80 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#25252e] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-md border border-indigo-500/30">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Kho Script Photoshop Tự Động Hóa (.JSX)
              </h2>
              <p className="text-[11px] text-neutral-400">
                ExtendScript chuẩn cho Adobe Photoshop CC 2020 – 2026
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Sidebar Script list + Code Editor */}
        <div className="flex-1 flex overflow-hidden">
          {/* Script List Sidebar */}
          <div className="w-72 bg-[#191920] border-r border-neutral-800 p-3 space-y-1.5 overflow-y-auto shrink-0">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-1">
              Danh mục script:
            </div>
            {PHOTOSHOP_SCRIPTS.map((script) => {
              const isSelected = script.id === activeScript.id;
              return (
                <button
                  key={script.id}
                  onClick={() => {
                    setSelectedScriptId(script.id);
                    setCopied(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border border-indigo-500/40 text-white shadow-sm'
                      : 'hover:bg-neutral-800/60 text-neutral-300 border border-transparent'
                  }`}
                >
                  <div className="font-semibold">{script.title}</div>
                  <div className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                    {script.filename}
                  </div>
                </button>
              );
            })}

            {/* Quick Install Guide Box */}
            <div className="mt-4 p-3 bg-neutral-900/80 border border-neutral-800 rounded-lg text-[11px] space-y-1.5 text-neutral-300">
              <div className="font-semibold text-amber-300 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Cách chạy trong Photoshop:</span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                1. Tải file <code className="text-sky-300 font-mono">.jsx</code> về máy.<br />
                2. Trong Photoshop: chọn menu <strong>File &gt; Scripts &gt; Browse...</strong> và chọn file vừa tải.<br />
                3. Hoặc chép file vào thư mục:<br />
                <code className="text-neutral-300 font-mono text-[9px] block bg-black/40 p-1 rounded mt-1 break-all">
                  C:\Program Files\Adobe\Photoshop...\Presets\Scripts\
                </code>
              </p>
            </div>
          </div>

          {/* Code Viewer & Actions */}
          <div className="flex-1 flex flex-col bg-[#16161c] overflow-hidden">
            {/* Action Bar */}
            <div className="px-4 py-2 bg-[#1d1d24] border-b border-neutral-800 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-indigo-300 font-medium">
                  {activeScript.filename}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-xs font-medium text-neutral-200 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Đã Sao Chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao Chép Mã</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-semibold text-white shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải File .JSX</span>
                </button>
              </div>
            </div>

            {/* Description Bar */}
            <div className="px-4 py-2 bg-[#181820] border-b border-neutral-800 text-xs text-neutral-300">
              {activeScript.description}
            </div>

            {/* Code Body */}
            <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-neutral-300 bg-[#121217]">
              <pre className="select-text whitespace-pre-wrap">{activeScript.code}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
