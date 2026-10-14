'use client';

import React, { useState } from 'react';

interface FileTreeProps {
  files: Record<string, string>;
  activeFile: string;
  onSelectFile: (filename: string) => void;
  onAddFile?: (filename: string) => void;
  onDeleteFile?: (filename: string) => void;
  packages: Record<string, string>;
  onAddPackage?: (pkgName: string) => void;
}

export default function FileTree({
  files,
  activeFile,
  onSelectFile,
  onAddFile,
  onDeleteFile,
  packages,
  onAddPackage
}: FileTreeProps) {
  const [tab, setTab] = useState<'files' | 'packages'>('files');
  const [newFileName, setNewFileName] = useState('');
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newPkgName, setNewPkgName] = useState('');

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.tsx') || filename.endsWith('.jsx')) {
      return <span className="text-cyan-400 font-bold text-[10px]">⚛</span>;
    }
    if (filename.endsWith('.ts') || filename.endsWith('.js')) {
      return <span className="text-yellow-400 font-bold text-[10px]">TS</span>;
    }
    if (filename.endsWith('.json')) {
      return <span className="text-amber-400 font-bold text-[10px]">{}</span>;
    }
    if (filename.endsWith('.css')) {
      return <span className="text-sky-400 font-bold text-[10px]">#</span>;
    }
    return <span className="text-neutral-400 text-[10px]">📄</span>;
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    onAddFile?.(newFileName.trim());
    setNewFileName('');
    setIsAddingFile(false);
  };

  const handleInstallPkg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName.trim()) return;
    onAddPackage?.(newPkgName.trim());
    setNewPkgName('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d10] border-l border-white/10 select-none text-xs">
      {/* Tab Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-2 bg-[#121216]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab('files')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
              tab === 'files'
                ? 'bg-white/10 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Explorer ({Object.keys(files).length})
          </button>
          <button
            type="button"
            onClick={() => setTab('packages')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
              tab === 'packages'
                ? 'bg-white/10 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            NPM Packages
          </button>
        </div>

        {tab === 'files' && (
          <button
            type="button"
            onClick={() => setIsAddingFile(!isAddingFile)}
            title="Create new file"
            className="w-6 h-6 rounded flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition"
          >
            +
          </button>
        )}
      </div>

      {/* Files Tab */}
      {tab === 'files' && (
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin flex flex-col gap-0.5">
          {/* New file input form */}
          {isAddingFile && (
            <form onSubmit={handleCreateFile} className="mb-2 px-1">
              <input
                type="text"
                autoFocus
                placeholder="e.g. components/Card.tsx"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onBlur={() => {
                  if (!newFileName.trim()) setIsAddingFile(false);
                }}
                className="w-full bg-[#18181f] border border-[#FE2C55]/50 rounded px-2 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none"
              />
            </form>
          )}

          {Object.keys(files).map((filename) => {
            const isActive = activeFile === filename;
            return (
              <div
                key={filename}
                onClick={() => onSelectFile(filename)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition ${
                  isActive
                    ? 'bg-[#FE2C55]/15 text-white font-medium border border-[#FE2C55]/30'
                    : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {getFileIcon(filename)}
                  <span className="truncate font-mono text-[11px]">{filename}</span>
                </div>

                {onDeleteFile && filename !== 'app.tsx' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(filename);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 text-xs px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* NPM Packages Tab */}
      {tab === 'packages' && (
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin flex flex-col gap-2">
          {/* Install package form */}
          <form onSubmit={handleInstallPkg} className="flex gap-1">
            <input
              type="text"
              placeholder="e.g. canvas-confetti"
              value={newPkgName}
              onChange={(e) => setNewPkgName(e.target.value)}
              className="flex-1 bg-[#18181f] border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FE2C55]"
            />
            <button
              type="submit"
              className="px-2 py-1 rounded bg-[#FE2C55] hover:bg-[#FE2C55]/90 text-white font-bold text-[11px]"
            >
              Add
            </button>
          </form>

          <div className="flex flex-col gap-1 mt-1">
            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider px-1">
              Installed Dependencies
            </span>
            {Object.entries(packages).map(([pkg, ver]) => (
              <div
                key={pkg}
                className="flex items-center justify-between px-2 py-1.5 bg-white/5 rounded border border-white/5 font-mono text-[11px]"
              >
                <span className="text-neutral-200 font-semibold truncate">{pkg}</span>
                <span className="text-neutral-500 text-[10px]">{ver}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Info */}
      <div className="p-2 border-t border-white/10 bg-[#0d0d10] text-[10px] text-neutral-500 flex items-center justify-between">
        <span>WebContainer FS</span>
        <span className="text-emerald-400 font-semibold">● Ready</span>
      </div>
    </div>
  );
}
