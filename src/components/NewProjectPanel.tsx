/**
 * Laifu Design — New Project Panel 组件
 * 选择 Skill + 设计系统 + 平台 → 创建项目
 */

import { useState, useEffect } from 'react';

interface Skill {
  id: string;
  name: string;
  description: string;
}

interface DesignSystemOption {
  id: string;
  name: string;
  description?: string;
}

interface NewProjectPanelProps {
  /** 取消回调 */
  onCancel: () => void;
  /** 创建项目回调 */
  onCreateProject: (data: {
    name: string;
    skillId: string;
    designSystemId: string;
    platform: string;
  }) => void;
  /** 是否显示 */
  open: boolean;
}

/** 平台选项 */
const PLATFORMS = [
  { id: 'web', name: 'Web', icon: '🌐' },
  { id: 'mobile', name: 'Mobile', icon: '📱' },
  { id: 'tablet', name: 'Tablet', icon: '📱' },
  { id: 'desktop', name: 'Desktop', icon: '💻' },
];

function NewProjectPanel({ onCancel, onCreateProject, open }: NewProjectPanelProps) {
  const [projectName, setProjectName] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [selectedDesignSystem, setSelectedDesignSystem] = useState<string>('artistic');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('web');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [designSystems, setDesignSystems] = useState<DesignSystemOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // 加载内置 Skills 和 Design Systems
  useEffect(() => {
    if (!open) return;

    setOptionsError(null);
    Promise.all([
      fetch('http://127.0.0.1:7456/api/skills').then((res) => res.json()),
      fetch('http://127.0.0.1:7456/api/design-systems').then((res) => res.json()),
    ])
      .then(([skillsData, designSystemsData]) => {
        if (skillsData.ok && skillsData.skills) {
          setSkills(skillsData.skills);
          if (skillsData.skills.length > 0 && !selectedSkill) {
            setSelectedSkill(skillsData.skills[0].id);
          }
        }

        if (designSystemsData.ok && designSystemsData.designSystems) {
          setDesignSystems(designSystemsData.designSystems);
          if (!designSystemsData.designSystems.some((ds: DesignSystemOption) => ds.id === selectedDesignSystem)) {
            setSelectedDesignSystem(designSystemsData.designSystems[0]?.id ?? 'artistic');
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load project options:', err);
        setOptionsError('无法加载 skill 或设计系统，请确认 Laifu 本地服务正在运行。');
      });
  }, [open, selectedSkill, selectedDesignSystem]);

  const handleSubmit = async () => {
    if (!projectName.trim()) {
      alert('请输入项目名称');
      return;
    }

    setLoading(true);
    try {
      onCreateProject({
        name: projectName.trim(),
        skillId: selectedSkill,
        designSystemId: selectedDesignSystem,
        platform: selectedPlatform,
      });
      setProjectName('');
      setSelectedSkill('');
      setSelectedDesignSystem('artistic');
    } catch (err) {
      console.error('Failed to create project:', err);
      alert('创建项目失败');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border bg-cream">
          <div>
            <h2 className="text-lg font-semibold">新建项目</h2>
            <p className="text-sm text-muted-foreground mt-1">
              先确定设计系统、页面类型和平台，再进入会话开始生成。
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[68vh] overflow-y-auto">
          {optionsError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {optionsError}
            </div>
          )}
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              项目名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="例如：我的第一个设计"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Skill Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Skill <span className="text-red-500">*</span>
            </label>
            {skills.length === 0 && !optionsError && (
              <div className="text-sm text-muted-foreground border border-border rounded-lg p-3">正在加载 skill...</div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {skills.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => setSelectedSkill(skill.id)}
                  className={`
                    p-3 rounded-lg border-2 text-left transition-all
                    ${selectedSkill === skill.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-border hover:border-gray-300'
                    }
                  `}
                >
                  <div className="font-medium text-sm">{skill.name}</div>
                  {skill.description && (
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {skill.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              目标平台 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`
                    flex-1 p-3 rounded-lg border-2 text-center transition-all
                    ${selectedPlatform === platform.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-border hover:border-gray-300'
                    }
                  `}
                >
                  <div className="text-2xl mb-1">{platform.icon}</div>
                  <div className="text-xs">{platform.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Design System Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              设计系统 <span className="text-red-500">*</span>
            </label>
            {designSystems.length === 0 && !optionsError && (
              <div className="text-sm text-muted-foreground border border-border rounded-lg p-3">正在加载设计系统...</div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {designSystems.map((system) => (
                <button
                  key={system.id}
                  onClick={() => setSelectedDesignSystem(system.id)}
                  className={`
                    p-3 rounded-lg border-2 text-left transition-all
                    ${selectedDesignSystem === system.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-border hover:border-gray-300'
                    }
                  `}
                >
                  <div className="font-medium text-sm">{system.name}</div>
                  {system.description && (
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {system.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !projectName.trim() || !selectedSkill || !selectedDesignSystem || Boolean(optionsError)}
            className="px-4 py-2 rounded-lg bg-foreground text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '创建中...' : '创建项目'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewProjectPanel;
