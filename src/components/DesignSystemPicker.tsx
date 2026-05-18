/**
 * Laifu Design — Design System Picker 组件
 * 下拉选择设计系统
 */

import React, { useState, useEffect } from 'react';
import type { DesignSystem } from '../main/types/design-system';

interface DesignSystemPickerProps {
  /** 当前选中的设计系统 ID */
  value: string;
  /** 选择回调 */
  onChange: (designSystemId: string) => void;
  /** 是否显示预览按钮 */
  showPreview?: boolean;
}

function DesignSystemPicker({ value, onChange, showPreview = true }: DesignSystemPickerProps) {
  const [designSystems, setDesignSystems] = useState<DesignSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // 加载 Design Systems
  useEffect(() => {
    setLoading(true);
    fetch('http://127.0.0.1:7456/api/design-systems')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.designSystems) {
          setDesignSystems(data.designSystems);
        }
      })
      .catch((err) => {
        console.error('Failed to load design systems:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value) {
      setPreviewUrl(`http://127.0.0.1:7456/api/design-systems/${value}/preview`);
      setShowPreviewModal(true);
    }
  };

  if (loading) {
    return (
      <div className="relative">
        <label className="block text-sm font-medium mb-2">设计系统</label>
        <div className="w-full px-3 py-2 border border-border rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <label className="block text-sm font-medium mb-2">设计系统</label>
        <div className="flex gap-2">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {designSystems.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name}
                {ds.description ? ` - ${ds.description}` : ''}
              </option>
            ))}
          </select>
          {showPreview && (
            <button
              onClick={handlePreview}
              disabled={!value}
              className="px-3 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              title="预览设计系统"
            >
              👁️
            </button>
          )}
        </div>
      </div>

      {/* 预览模态框 */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[90vw] h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-medium">设计系统预览</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                ✕
              </button>
            </div>
            <iframe
              src={previewUrl}
              className="flex-1 w-full border-0"
              title="Design System Preview"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default DesignSystemPicker;
