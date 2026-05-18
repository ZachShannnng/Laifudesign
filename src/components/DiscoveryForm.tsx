/**
 * Laifu Design — Discovery Form 组件
 * 渲染交互式表单，支持 text/textarea/select/radio/checkbox/direction-cards 类型
 */

import { useState } from 'react';
import type { QuestionForm, QuestionFormField, DirectionCard, QuestionFormAnswers } from '../artifacts/question-form';

interface DiscoveryFormProps {
  /** 表单数据 */
  form: QuestionForm;
  /** 提交回调 */
  onSubmit: (answers: QuestionFormAnswers) => void;
  /** 取消回调 */
  onCancel?: () => void;
}

function DiscoveryForm({ form, onSubmit, onCancel }: DiscoveryFormProps) {
  const [answers, setAnswers] = useState<QuestionFormAnswers>({});
  const [selectedDirection, setSelectedDirection] = useState<string>('');

  const handleFieldChange = (name: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  return (
    <div className="discovery-form p-6 bg-white rounded-lg border border-border max-w-2xl mx-auto my-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">项目信息</h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-4">
        {form.fields.map((field) => (
          <FormField
            key={field.name}
            field={field}
            value={answers[field.name] || ''}
            selectedDirection={selectedDirection}
            onChange={(value) => handleFieldChange(field.name, value)}
            onDirectionSelect={setSelectedDirection}
          />
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted"
          >
            取消
          </button>
        )}
        <button
          onClick={handleSubmit}
          className="px-4 py-2 rounded-lg bg-foreground text-white hover:opacity-90"
        >
          继续
        </button>
      </div>
    </div>
  );
}

interface FormFieldProps {
  field: QuestionFormField;
  value: string | string[];
  selectedDirection: string;
  onChange: (value: string | string[]) => void;
  onDirectionSelect?: (direction: string) => void;
}

function FormField({ field, value, selectedDirection, onChange, onDirectionSelect }: FormFieldProps) {
  const fieldValue = value as string;

  switch (field.type) {
    case 'text':
      return (
        <div>
          <label className="block text-sm font-medium mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={fieldValue}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        </div>
      );

    case 'textarea':
      return (
        <div>
          <label className="block text-sm font-medium mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            value={fieldValue}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        </div>
      );

    case 'select':
      return (
        <div>
          <label className="block text-sm font-medium mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={fieldValue}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          >
            <option value="">请选择...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );

    case 'direction-cards':
      // 方向卡片优先使用模型输出，缺省使用内置方向。
      const cards: DirectionCard[] = field.cards ?? [
        { id: 'modern-minimal', name: '现代极简', description: '大量留白，清晰的排版', color: '#1a1a1a' },
        { id: 'warm-cream', name: '温暖奶油', description: '柔和的暖色调，舒适的视觉', color: '#c9b8a0' },
        { id: 'vibrant-gradient', name: '活力渐变', description: '大胆的渐变色彩，充满活力', color: '#6366f1' },
        { id: 'dark-mode', name: '深色模式', description: '深色背景，高对比度文字', color: '#0f172a' },
        { id: 'nature-green', name: '自然绿意', description: '绿色为主调，给人宁静感', color: '#059669' },
      ];

      return (
        <div>
          <label className="block text-sm font-medium mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cards.map((card) => (
              <DirectionCardItem
                key={card.id}
                card={card}
                selected={selectedDirection === card.id}
                onClick={() => {
                  onChange(card.id);
                  onDirectionSelect?.(card.id);
                }}
              />
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div>
          <label className="block text-sm font-medium mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={fieldValue}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg"
            required={field.required}
          />
        </div>
      );
  }
}

interface DirectionCardItemProps {
  card: DirectionCard;
  selected: boolean;
  onClick: () => void;
}

function DirectionCardItem({ card, selected, onClick }: DirectionCardItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        p-4 rounded-lg border-2 text-left transition-all
        ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-border hover:border-gray-300'}
      `}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-full"
          style={{ backgroundColor: card.color }}
        />
        <span className="font-medium">{card.name}</span>
      </div>
      <p className="text-sm text-muted-foreground">{card.description}</p>
    </button>
  );
}

export default DiscoveryForm;
