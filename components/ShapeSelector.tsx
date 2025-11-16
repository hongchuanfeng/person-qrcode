'use client';

import { BodyShape, EyeFrameShape, EyeBallShape } from '@/utils/qrShapes';

interface ShapeSelectorProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string; preview: string }[];
  onChange: (value: T) => void;
}

export function ShapeSelector<T extends string>({
  label,
  value,
  options,
  onChange
}: ShapeSelectorProps<T>) {
  return (
    <div className="shape-selector">
      <label className="shape-selector-label">{label}</label>
      <div className="shape-options-grid">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`shape-option ${value === option.value ? 'selected' : ''}`}
            onClick={() => onChange(option.value)}
            title={option.label}
          >
            <div className="shape-preview">{option.preview}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Body shape options
export const bodyShapeOptions: { value: BodyShape; label: string; preview: string }[] = [
  { value: 'square', label: 'Square', preview: '⬜' },
  { value: 'rounded', label: 'Rounded', preview: '▢' },
  { value: 'extra-rounded', label: 'Extra Rounded', preview: '◉' },
  { value: 'classy', label: 'Classy', preview: '▥' },
  { value: 'classy-rounded', label: 'Classy Rounded', preview: '▦' },
  { value: 'flower', label: 'Flower', preview: '❀' },
  { value: 'pattern1', label: 'Pattern 1', preview: '▣' },
  { value: 'pattern2', label: 'Pattern 2', preview: '▤' },
  { value: 'pattern3', label: 'Pattern 3', preview: '▧' },
  { value: 'pattern4', label: 'Pattern 4', preview: '▨' },
  { value: 'pattern5', label: 'Pattern 5', preview: '▩' },
  { value: 'pattern6', label: 'Pattern 6', preview: '▪' },
  { value: 'pattern7', label: 'Pattern 7', preview: '▫' },
  { value: 'pattern8', label: 'Pattern 8', preview: '▬' }
];

// Eye frame shape options
export const eyeFrameShapeOptions: { value: EyeFrameShape; label: string; preview: string }[] = [
  { value: 'square', label: 'Square', preview: '⬜' },
  { value: 'rounded', label: 'Rounded', preview: '▢' },
  { value: 'circle', label: 'Circle', preview: '○' },
  { value: 'rounded-single', label: 'Rounded Single', preview: '▭' },
  { value: 'rounded-double', label: 'Rounded Double', preview: '▯' },
  { value: 'square-single', label: 'Square Single', preview: '▰' },
  { value: 'square-double', label: 'Square Double', preview: '▱' },
  { value: 'leaf', label: 'Leaf', preview: '❁' },
  { value: 'leaf-rounded', label: 'Leaf Rounded', preview: '❂' },
  { value: 'diamond', label: 'Diamond', preview: '◆' },
  { value: 'diamond-rounded', label: 'Diamond Rounded', preview: '◇' }
];

// Eye ball shape options
export const eyeBallShapeOptions: { value: EyeBallShape; label: string; preview: string }[] = [
  { value: 'square', label: 'Square', preview: '■' },
  { value: 'circle', label: 'Circle', preview: '●' },
  { value: 'rounded', label: 'Rounded', preview: '◉' },
  { value: 'diamond', label: 'Diamond', preview: '◆' },
  { value: 'leaf', label: 'Leaf', preview: '❁' },
  { value: 'star', label: 'Star', preview: '★' },
  { value: 'flower', label: 'Flower', preview: '❀' },
  { value: 'dot', label: 'Dot', preview: '●' },
  { value: 'rounded-square', label: 'Rounded Square', preview: '▣' },
  { value: 'rounded-diamond', label: 'Rounded Diamond', preview: '◈' },
  { value: 'pattern1', label: 'Pattern 1', preview: '▤' },
  { value: 'pattern2', label: 'Pattern 2', preview: '▥' },
  { value: 'pattern3', label: 'Pattern 3', preview: '▦' },
  { value: 'pattern4', label: 'Pattern 4', preview: '▧' },
  { value: 'pattern5', label: 'Pattern 5', preview: '▨' },
  { value: 'pattern6', label: 'Pattern 6', preview: '▩' }
];

