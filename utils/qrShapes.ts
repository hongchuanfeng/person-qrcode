// QR Code shape definitions

export type BodyShape = 'square' | 'rounded' | 'dots' | 'extra-rounded' | 'classy' | 'classy-rounded' | 'dots-rounded' | 'rounded-dots' | 'flower' | 'star' | 'pattern1' | 'pattern2' | 'pattern3' | 'pattern4' | 'pattern5' | 'pattern6' | 'pattern7' | 'pattern8';

export type EyeFrameShape = 'square' | 'rounded' | 'circle' | 'rounded-single' | 'rounded-double' | 'square-single' | 'square-double' | 'leaf' | 'leaf-rounded' | 'diamond' | 'diamond-rounded';

export type EyeBallShape = 'square' | 'circle' | 'rounded' | 'diamond' | 'leaf' | 'star' | 'flower' | 'dot' | 'rounded-square' | 'rounded-diamond' | 'pattern1' | 'pattern2' | 'pattern3' | 'pattern4' | 'pattern5' | 'pattern6';

// Draw body shape
export function drawBodyShape(
  ctx: CanvasRenderingContext2D | SVGPathElement,
  x: number,
  y: number,
  size: number,
  shape: BodyShape,
  isSvg: boolean = false
) {
  const halfSize = size / 2;
  const centerX = x + halfSize;
  const centerY = y + halfSize;

  if (isSvg && ctx instanceof SVGPathElement) {
    // SVG path drawing
    let path = '';
    switch (shape) {
      case 'square':
        path = `M ${x} ${y} L ${x + size} ${y} L ${x + size} ${y + size} L ${x} ${y + size} Z`;
        break;
      case 'rounded':
        const r1 = size * 0.2;
        path = `M ${x + r1} ${y} L ${x + size - r1} ${y} Q ${x + size} ${y} ${x + size} ${y + r1} L ${x + size} ${y + size - r1} Q ${x + size} ${y + size} ${x + size - r1} ${y + size} L ${x + r1} ${y + size} Q ${x} ${y + size} ${x} ${y + size - r1} L ${x} ${y + r1} Q ${x} ${y} ${x + r1} ${y} Z`;
        break;
      case 'dots':
        path = `M ${centerX} ${centerY} m -${halfSize * 0.3} 0 a ${halfSize * 0.3} ${halfSize * 0.3} 0 1 0 ${size * 0.3} 0 a ${halfSize * 0.3} ${halfSize * 0.3} 0 1 0 -${size * 0.3} 0`;
        break;
      case 'extra-rounded':
        const r2 = size * 0.4;
        path = `M ${x + r2} ${y} L ${x + size - r2} ${y} Q ${x + size} ${y} ${x + size} ${y + r2} L ${x + size} ${y + size - r2} Q ${x + size} ${y + size} ${x + size - r2} ${y + size} L ${x + r2} ${y + size} Q ${x} ${y + size} ${x} ${y + size - r2} L ${x} ${y + r2} Q ${x} ${y} ${x + r2} ${y} Z`;
        break;
      case 'classy':
        path = `M ${x} ${y} L ${x + size} ${y} L ${x + size} ${y + size * 0.7} L ${x + size * 0.7} ${y + size} L ${x} ${y + size} Z`;
        break;
      case 'classy-rounded':
        const r3 = size * 0.15;
        path = `M ${x + r3} ${y} L ${x + size - r3} ${y} Q ${x + size} ${y} ${x + size} ${y + r3} L ${x + size} ${y + size * 0.7} L ${x + size * 0.7} ${y + size} L ${x + r3} ${y + size} Q ${x} ${y + size} ${x} ${y + size - r3} L ${x} ${y + r3} Q ${x} ${y} ${x + r3} ${y} Z`;
        break;
      case 'dots-rounded':
        const r4 = size * 0.25;
        path = `M ${centerX} ${centerY} m -${r4} 0 a ${r4} ${r4} 0 1 0 ${r4 * 2} 0 a ${r4} ${r4} 0 1 0 -${r4 * 2} 0`;
        break;
      case 'rounded-dots':
        const r5 = size * 0.3;
        path = `M ${centerX} ${centerY} m -${r5} 0 a ${r5} ${r5} 0 1 0 ${r5 * 2} 0 a ${r5} ${r5} 0 1 0 -${r5 * 2} 0`;
        break;
      case 'flower':
        const petals = 8;
        // Use larger radius to ensure complete coverage
        const radius = halfSize * 0.95;
        path = `M ${centerX + radius} ${centerY}`;
        for (let i = 1; i <= petals; i++) {
          const angle = (i * 2 * Math.PI) / petals;
          const px = centerX + radius * Math.cos(angle);
          const py = centerY + radius * Math.sin(angle);
          path += ` L ${px} ${py}`;
        }
        path += ' Z';
        break;
      case 'star':
        const points = 5;
        // Use larger radius to ensure complete coverage of the module area
        const outerRadius = halfSize * 0.95;
        const innerRadius = halfSize * 0.4;
        path = `M ${centerX + outerRadius} ${centerY}`;
        for (let i = 0; i < points * 2; i++) {
          const angle = (i * Math.PI) / points;
          const r = i % 2 === 0 ? outerRadius : innerRadius;
          const px = centerX + r * Math.cos(angle - Math.PI / 2);
          const py = centerY + r * Math.sin(angle - Math.PI / 2);
          path += ` L ${px} ${py}`;
        }
        path += ' Z';
        break;
      default:
        path = `M ${x} ${y} L ${x + size} ${y} L ${x + size} ${y + size} L ${x} ${y + size} Z`;
    }
    ctx.setAttribute('d', path);
    return;
  }

  // Canvas drawing
  if (!(ctx instanceof CanvasRenderingContext2D)) return;

  ctx.beginPath();
  switch (shape) {
    case 'square':
      ctx.rect(x, y, size, size);
      break;
    case 'rounded':
      const r1 = size * 0.2;
      ctx.roundRect(x, y, size, size, r1);
      break;
    case 'dots':
      ctx.arc(centerX, centerY, halfSize * 0.3, 0, Math.PI * 2);
      break;
    case 'extra-rounded':
      const r2 = size * 0.4;
      ctx.roundRect(x, y, size, size, r2);
      break;
    case 'classy':
      ctx.moveTo(x, y);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x + size, y + size * 0.7);
      ctx.lineTo(x + size * 0.7, y + size);
      ctx.lineTo(x, y + size);
      ctx.closePath();
      break;
    case 'classy-rounded':
      const r3 = size * 0.15;
      ctx.roundRect(x, y, size, size * 0.7, r3);
      ctx.roundRect(x, y + size * 0.3, size * 0.7, size * 0.7, r3);
      break;
    case 'dots-rounded':
      ctx.arc(centerX, centerY, size * 0.25, 0, Math.PI * 2);
      break;
    case 'rounded-dots':
      ctx.arc(centerX, centerY, size * 0.3, 0, Math.PI * 2);
      break;
    case 'flower':
      const petals = 8;
      // Use larger radius to ensure complete coverage
      const radius = halfSize * 0.95;
      ctx.moveTo(centerX + radius, centerY);
      for (let i = 1; i <= petals; i++) {
        const angle = (i * 2 * Math.PI) / petals;
        const px = centerX + radius * Math.cos(angle);
        const py = centerY + radius * Math.sin(angle);
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    case 'star':
      const points = 5;
      // Use larger radius to ensure complete coverage of the module area
      const outerRadius = halfSize * 0.95;
      const innerRadius = halfSize * 0.4;
      ctx.moveTo(centerX + outerRadius, centerY);
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points;
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const px = centerX + r * Math.cos(angle - Math.PI / 2);
        const py = centerY + r * Math.sin(angle - Math.PI / 2);
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    default:
      ctx.rect(x, y, size, size);
  }
  ctx.fill();
}

// Draw eye frame shape
export function drawEyeFrame(
  ctx: CanvasRenderingContext2D | SVGPathElement,
  x: number,
  y: number,
  size: number,
  shape: EyeFrameShape,
  isSvg: boolean = false
) {
  if (isSvg && ctx instanceof SVGPathElement) {
    let path = '';
    switch (shape) {
      case 'square':
        path = `M ${x} ${y} L ${x + size} ${y} L ${x + size} ${y + size} L ${x} ${y + size} Z`;
        break;
      case 'rounded':
        const r = size * 0.3;
        path = `M ${x + r} ${y} L ${x + size - r} ${y} Q ${x + size} ${y} ${x + size} ${y + r} L ${x + size} ${y + size - r} Q ${x + size} ${y + size} ${x + size - r} ${y + size} L ${x + r} ${y + size} Q ${x} ${y + size} ${x} ${y + size - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
        break;
      case 'circle': {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = size / 2;
        path = `M ${centerX + radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX} ${centerY - radius} A ${radius} ${radius} 0 0 1 ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX} ${centerY + radius} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`;
        break;
      }
      case 'rounded-single':
        const r1 = size * 0.2;
        path = `M ${x + r1} ${y} L ${x + size - r1} ${y} Q ${x + size} ${y} ${x + size} ${y + r1} L ${x + size} ${y + size - r1} Q ${x + size} ${y + size} ${x + size - r1} ${y + size} L ${x + r1} ${y + size} Q ${x} ${y + size} ${x} ${y + size - r1} L ${x} ${y + r1} Q ${x} ${y} ${x + r1} ${y} Z`;
        break;
      case 'rounded-double':
        const r2 = size * 0.25;
        path = `M ${x + r2} ${y} L ${x + size - r2} ${y} Q ${x + size} ${y} ${x + size} ${y + r2} L ${x + size} ${y + size - r2} Q ${x + size} ${y + size} ${x + size - r2} ${y + size} L ${x + r2} ${y + size} Q ${x} ${y + size} ${x} ${y + size - r2} L ${x} ${y + r2} Q ${x} ${y} ${x + r2} ${y} Z`;
        break;
      case 'square-single':
        path = `M ${x} ${y} L ${x + size} ${y} L ${x + size} ${y + size} L ${x} ${y + size} Z`;
        break;
      case 'square-double':
        path = `M ${x} ${y} L ${x + size} ${y} L ${x + size} ${y + size} L ${x} ${y + size} Z`;
        break;
      case 'leaf': {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = size / 2;
        path = `M ${centerX} ${y} Q ${x + size} ${centerY} ${centerX} ${y + size} Q ${x} ${centerY} ${centerX} ${y}`;
        break;
      }
      case 'leaf-rounded': {
        const centerX2 = x + size / 2;
        const centerY2 = y + size / 2;
        const radius2 = size / 2.2;
        path = `M ${centerX2} ${y + size * 0.1} Q ${x + size * 0.9} ${centerY2} ${centerX2} ${y + size * 0.9} Q ${x + size * 0.1} ${centerY2} ${centerX2} ${y + size * 0.1}`;
        break;
      }
      case 'diamond': {
        const centerX3 = x + size / 2;
        const centerY3 = y + size / 2;
        path = `M ${centerX3} ${y} L ${x + size} ${centerY3} L ${centerX3} ${y + size} L ${x} ${centerY3} Z`;
        break;
      }
      case 'diamond-rounded': {
        const centerX4 = x + size / 2;
        const centerY4 = y + size / 2;
        const r4 = size * 0.15;
        path = `M ${centerX4} ${y + r4} L ${x + size - r4} ${centerY4} L ${centerX4} ${y + size - r4} L ${x + r4} ${centerY4} Z`;
        break;
      }
      default:
        path = `M ${x} ${y} L ${x + size} ${y} L ${x + size} ${y + size} L ${x} ${y + size} Z`;
    }
    ctx.setAttribute('d', path);
    return;
  }

  if (!(ctx instanceof CanvasRenderingContext2D)) return;

  ctx.beginPath();
  switch (shape) {
    case 'square':
      ctx.rect(x, y, size, size);
      break;
    case 'rounded':
      const r = size * 0.3;
      ctx.roundRect(x, y, size, size, r);
      break;
    case 'circle':
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      break;
    case 'rounded-single':
      const r1 = size * 0.2;
      ctx.roundRect(x, y, size, size, r1);
      break;
    case 'rounded-double':
      const r2 = size * 0.25;
      ctx.roundRect(x, y, size, size, r2);
      break;
    case 'square-single':
      ctx.rect(x, y, size, size);
      break;
    case 'square-double':
      const margin = size * 0.1;
      ctx.rect(x + margin, y + margin, size - margin * 2, size - margin * 2);
      break;
    case 'leaf':
      const centerX = x + size / 2;
      const centerY = y + size / 2;
      ctx.moveTo(centerX, y);
      ctx.quadraticCurveTo(x + size, centerY, centerX, y + size);
      ctx.quadraticCurveTo(x, centerY, centerX, y);
      break;
    case 'leaf-rounded':
      const centerX2 = x + size / 2;
      const centerY2 = y + size / 2;
      ctx.moveTo(centerX2, y + size * 0.1);
      ctx.quadraticCurveTo(x + size * 0.9, centerY2, centerX2, y + size * 0.9);
      ctx.quadraticCurveTo(x + size * 0.1, centerY2, centerX2, y + size * 0.1);
      break;
    case 'diamond':
      const centerX3 = x + size / 2;
      const centerY3 = y + size / 2;
      ctx.moveTo(centerX3, y);
      ctx.lineTo(x + size, centerY3);
      ctx.lineTo(centerX3, y + size);
      ctx.lineTo(x, centerY3);
      ctx.closePath();
      break;
    case 'diamond-rounded':
      const centerX4 = x + size / 2;
      const centerY4 = y + size / 2;
      const r4 = size * 0.15;
      ctx.moveTo(centerX4, y + r4);
      ctx.lineTo(x + size - r4, centerY4);
      ctx.lineTo(centerX4, y + size - r4);
      ctx.lineTo(x + r4, centerY4);
      ctx.closePath();
      break;
    default:
      ctx.rect(x, y, size, size);
  }
  ctx.stroke();
}

// Draw eye ball shape
export function drawEyeBall(
  ctx: CanvasRenderingContext2D | SVGPathElement,
  x: number,
  y: number,
  size: number,
  shape: EyeBallShape,
  isSvg: boolean = false
) {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const radius = size / 2;

  if (isSvg && ctx instanceof SVGPathElement) {
    let path = '';
    switch (shape) {
      case 'square':
        const margin = size * 0.2;
        path = `M ${x + margin} ${y + margin} L ${x + size - margin} ${y + margin} L ${x + size - margin} ${y + size - margin} L ${x + margin} ${y + size - margin} Z`;
        break;
      case 'circle':
        path = `M ${centerX + radius * 0.6} ${centerY} A ${radius * 0.6} ${radius * 0.6} 0 0 1 ${centerX} ${centerY - radius * 0.6} A ${radius * 0.6} ${radius * 0.6} 0 0 1 ${centerX - radius * 0.6} ${centerY} A ${radius * 0.6} ${radius * 0.6} 0 0 1 ${centerX} ${centerY + radius * 0.6} A ${radius * 0.6} ${radius * 0.6} 0 0 1 ${centerX + radius * 0.6} ${centerY}`;
        break;
      case 'rounded':
        const r = size * 0.15;
        const m = size * 0.2;
        path = `M ${x + m + r} ${y + m} L ${x + size - m - r} ${y + m} Q ${x + size - m} ${y + m} ${x + size - m} ${y + m + r} L ${x + size - m} ${y + size - m - r} Q ${x + size - m} ${y + size - m} ${x + size - m - r} ${y + size - m} L ${x + m + r} ${y + size - m} Q ${x + m} ${y + size - m} ${x + m} ${y + size - m - r} L ${x + m} ${y + m + r} Q ${x + m} ${y + m} ${x + m + r} ${y + m} Z`;
        break;
      case 'diamond':
        const m2 = size * 0.2;
        path = `M ${centerX} ${y + m2} L ${x + size - m2} ${centerY} L ${centerX} ${y + size - m2} L ${x + m2} ${centerY} Z`;
        break;
      case 'leaf':
        const r2 = radius * 0.6;
        path = `M ${centerX} ${centerY - r2} Q ${centerX + r2} ${centerY} ${centerX} ${centerY + r2} Q ${centerX - r2} ${centerY} ${centerX} ${centerY - r2}`;
        break;
      case 'star':
        const points = 5;
        const outerRadius = radius * 0.6;
        const innerRadius = radius * 0.3;
        path = `M ${centerX + outerRadius} ${centerY}`;
        for (let i = 0; i < points * 2; i++) {
          const angle = (i * Math.PI) / points;
          const r = i % 2 === 0 ? outerRadius : innerRadius;
          const px = centerX + r * Math.cos(angle - Math.PI / 2);
          const py = centerY + r * Math.sin(angle - Math.PI / 2);
          path += ` L ${px} ${py}`;
        }
        path += ' Z';
        break;
      case 'flower':
        const petals = 8;
        const r3 = radius * 0.5;
        path = `M ${centerX + r3} ${centerY}`;
        for (let i = 1; i <= petals; i++) {
          const angle = (i * 2 * Math.PI) / petals;
          const px = centerX + r3 * Math.cos(angle);
          const py = centerY + r3 * Math.sin(angle);
          path += ` L ${px} ${py}`;
        }
        path += ' Z';
        break;
      case 'dot':
        path = `M ${centerX + radius * 0.4} ${centerY} A ${radius * 0.4} ${radius * 0.4} 0 0 1 ${centerX} ${centerY - radius * 0.4} A ${radius * 0.4} ${radius * 0.4} 0 0 1 ${centerX - radius * 0.4} ${centerY} A ${radius * 0.4} ${radius * 0.4} 0 0 1 ${centerX} ${centerY + radius * 0.4} A ${radius * 0.4} ${radius * 0.4} 0 0 1 ${centerX + radius * 0.4} ${centerY}`;
        break;
      default:
        const m3 = size * 0.2;
        path = `M ${x + m3} ${y + m3} L ${x + size - m3} ${y + m3} L ${x + size - m3} ${y + size - m3} L ${x + m3} ${y + size - m3} Z`;
    }
    ctx.setAttribute('d', path);
    return;
  }

  if (!(ctx instanceof CanvasRenderingContext2D)) return;

  ctx.beginPath();
  switch (shape) {
    case 'square':
      const margin = size * 0.2;
      ctx.rect(x + margin, y + margin, size - margin * 2, size - margin * 2);
      break;
    case 'circle':
      ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
      break;
    case 'rounded':
      const r = size * 0.15;
      const m = size * 0.2;
      ctx.roundRect(x + m, y + m, size - m * 2, size - m * 2, r);
      break;
    case 'diamond':
      const m2 = size * 0.2;
      ctx.moveTo(centerX, y + m2);
      ctx.lineTo(x + size - m2, centerY);
      ctx.lineTo(centerX, y + size - m2);
      ctx.lineTo(x + m2, centerY);
      ctx.closePath();
      break;
    case 'leaf':
      const r2 = radius * 0.6;
      ctx.moveTo(centerX, centerY - r2);
      ctx.quadraticCurveTo(centerX + r2, centerY, centerX, centerY + r2);
      ctx.quadraticCurveTo(centerX - r2, centerY, centerX, centerY - r2);
      break;
    case 'star':
      const points = 5;
      const outerRadius = radius * 0.6;
      const innerRadius = radius * 0.3;
      ctx.moveTo(centerX + outerRadius, centerY);
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points;
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const px = centerX + r * Math.cos(angle - Math.PI / 2);
        const py = centerY + r * Math.sin(angle - Math.PI / 2);
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    case 'flower':
      const petals = 8;
      const r3 = radius * 0.5;
      ctx.moveTo(centerX + r3, centerY);
      for (let i = 1; i <= petals; i++) {
        const angle = (i * 2 * Math.PI) / petals;
        const px = centerX + r3 * Math.cos(angle);
        const py = centerY + r3 * Math.sin(angle);
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    case 'dot':
      ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
      break;
    default:
      const m3 = size * 0.2;
      ctx.rect(x + m3, y + m3, size - m3 * 2, size - m3 * 2);
  }
  ctx.fill();
}

