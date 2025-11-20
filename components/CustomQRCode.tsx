'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { BodyShape, EyeFrameShape, EyeBallShape, drawBodyShape, drawEyeFrame, drawEyeBall } from '@/utils/qrShapes';

interface CustomQRCodeProps {
  value: string;
  size: number;
  fgColor: string;
  bgColor: string;
  bodyShape: BodyShape;
  eyeFrameShape: EyeFrameShape;
  eyeBallShape: EyeBallShape;
  image?: string;
  imageSize?: number;
}

export default function CustomQRCode({
  value,
  size,
  fgColor,
  bgColor,
  bodyShape,
  eyeFrameShape,
  eyeBallShape,
  image,
  imageSize = 0.2
}: CustomQRCodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      // Generate QR code matrix (synchronous)
      const qr = QRCode.create(value, { errorCorrectionLevel: 'H' });
      const modules = qr.modules;
      const moduleCount = modules.size;
      const totalModules = moduleCount + 8; // include quiet zone
      const moduleSize = Math.max(2, Math.floor(size / totalModules));
      const usedSize = moduleSize * totalModules;
      const remaining = size - usedSize;
      const offset = Math.floor(remaining / 2);
      const padding = offset + moduleSize * 4;
      const qrSize = moduleSize * moduleCount;

      const svg = svgRef.current!;
      svg.innerHTML = ''; // Clear previous content

      // Set SVG attributes
      svg.setAttribute('width', String(size));
      svg.setAttribute('height', String(size));
      svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
      svg.setAttribute('shape-rendering', 'crispEdges');

      // Background
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('width', String(size));
      bgRect.setAttribute('height', String(size));
      bgRect.setAttribute('fill', bgColor);
      svg.appendChild(bgRect);

      // Calculate center area for image (if provided) - make it smaller to preserve scannability
      let centerArea: { row: number; col: number; size: number } | null = null;
      if (image) {
        // Use smaller image size to preserve more QR code data
        const imageSizeInModules = Math.max(5, Math.min(9, Math.ceil((qrSize * imageSize * 0.8) / moduleSize)));
        const centerRow = Math.floor(moduleCount / 2);
        const centerCol = Math.floor(moduleCount / 2);
        const halfSize = Math.floor(imageSizeInModules / 2);
        centerArea = {
          row: centerRow - halfSize,
          col: centerCol - halfSize,
          size: imageSizeInModules
        };
      }

      // Draw QR code modules - use standard squares for maximum scannability
      // Only apply custom shapes for simple cases that don't affect scannability
      const drawnFinders = new Set<string>();
      
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          const isModule = modules.get(row, col);
          const x = col * moduleSize + padding;
          const y = row * moduleSize + padding;

          // Skip center area for image
          if (centerArea && 
              row >= centerArea.row && 
              row < centerArea.row + centerArea.size &&
              col >= centerArea.col && 
              col < centerArea.col + centerArea.size) {
            continue;
          }

          const finderInfo = isInFinderPattern(row, col, moduleCount);
          
          if (finderInfo.isEye && finderInfo.finderId) {
            // For finder patterns, draw standard structure first
            const finderKey = finderInfo.finderId;
            if (!drawnFinders.has(finderKey)) {
              drawnFinders.add(finderKey);
              
              const finderPos = finderInfo.position!;
              const finderX = finderPos.col * moduleSize + padding;
              const finderY = finderPos.row * moduleSize + padding;
              
              // Draw finder pattern with custom shapes
              const finderSize = 7 * moduleSize;
              const innerX = finderX + moduleSize * 2;
              const innerY = finderY + moduleSize * 2;
              const innerSize = moduleSize * 3;
              const centerX = finderX + moduleSize * 3;
              const centerY = finderY + moduleSize * 3;
              
              // Draw eye frame (outer 7x7)
              if (eyeFrameShape === 'square') {
                const outerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                outerRect.setAttribute('x', String(finderX));
                outerRect.setAttribute('y', String(finderY));
                outerRect.setAttribute('width', String(finderSize));
                outerRect.setAttribute('height', String(finderSize));
                outerRect.setAttribute('fill', fgColor);
                svg.appendChild(outerRect);
              } else {
                const framePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                framePath.setAttribute('fill', fgColor);
                drawEyeFrame(framePath, finderX, finderY, finderSize, eyeFrameShape, true);
                svg.appendChild(framePath);
              }
              
              // Draw eye ball (inner 3x3)
              if (eyeBallShape === 'square') {
                const innerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                innerRect.setAttribute('x', String(innerX));
                innerRect.setAttribute('y', String(innerY));
                innerRect.setAttribute('width', String(innerSize));
                innerRect.setAttribute('height', String(innerSize));
                innerRect.setAttribute('fill', bgColor);
                svg.appendChild(innerRect);
              } else {
                const ballPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                ballPath.setAttribute('fill', bgColor);
                drawEyeBall(ballPath, innerX, innerY, innerSize, eyeBallShape, true);
                svg.appendChild(ballPath);
              }
              
              // Center 1x1 dot (always square for scannability)
              const centerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              centerRect.setAttribute('x', String(centerX));
              centerRect.setAttribute('y', String(centerY));
              centerRect.setAttribute('width', String(moduleSize));
              centerRect.setAttribute('height', String(moduleSize));
              centerRect.setAttribute('fill', fgColor);
              svg.appendChild(centerRect);
            }
            // Skip individual module drawing for finder patterns
            continue;
          } else if (isModule) {
            // Draw custom shape directly (replacing standard square)
            if (bodyShape === 'square') {
              // Draw standard square
              const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              rect.setAttribute('x', String(x));
              rect.setAttribute('y', String(y));
              rect.setAttribute('width', String(moduleSize));
              rect.setAttribute('height', String(moduleSize));
              rect.setAttribute('fill', fgColor);
              svg.appendChild(rect);
            } else {
              // Draw custom shape
              const bodyPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              bodyPath.setAttribute('fill', fgColor);
              drawBodyShape(bodyPath, x, y, moduleSize, bodyShape, true);
              svg.appendChild(bodyPath);
            }
          }
        }
      }

      // Step 3: Add center image if provided (on top of everything)
      if (image && centerArea) {
        const imageSizePx = centerArea.size * moduleSize * 0.9; // Slightly smaller than the cleared area
        const centerX = contentSize / 2 - imageSizePx / 2;
        const centerY = contentSize / 2 - imageSizePx / 2;

        // Create background circle
        const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bgCircle.setAttribute('cx', String(contentSize / 2));
        bgCircle.setAttribute('cy', String(contentSize / 2));
        bgCircle.setAttribute('r', String(imageSizePx / 2));
        bgCircle.setAttribute('fill', bgColor);
        svg.appendChild(bgCircle);

        // Create clip path for circular image
        const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
        clipPath.setAttribute('id', 'image-clip');
        const clipCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        clipCircle.setAttribute('cx', String(contentSize / 2));
        clipCircle.setAttribute('cy', String(contentSize / 2));
        clipCircle.setAttribute('r', String(imageSizePx / 2));
        clipPath.appendChild(clipCircle);
        svg.appendChild(clipPath);

        // Add image
        const imageEl = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        imageEl.setAttribute('href', image);
        imageEl.setAttribute('x', String(centerX));
        imageEl.setAttribute('y', String(centerY));
        imageEl.setAttribute('width', String(imageSizePx));
        imageEl.setAttribute('height', String(imageSizePx));
        imageEl.setAttribute('clip-path', 'url(#image-clip)');
        imageEl.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        svg.appendChild(imageEl);
      }
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  }, [value, size, fgColor, bgColor, bodyShape, eyeFrameShape, eyeBallShape, image, imageSize]);

  // Helper function to check if a module is part of finder pattern
  function isInFinderPattern(row: number, col: number, moduleCount: number) {
    const finderSize = 7;
    const finderPositions = [
      { id: 'top-left', row: 0, col: 0 },
      { id: 'top-right', row: 0, col: moduleCount - finderSize },
      { id: 'bottom-left', row: moduleCount - finderSize, col: 0 }
    ];

    for (const pos of finderPositions) {
      if (
        row >= pos.row &&
        row < pos.row + finderSize &&
        col >= pos.col &&
        col < pos.col + finderSize
      ) {
        return { 
          isEye: true, 
          finderId: pos.id,
          position: { row: pos.row, col: pos.col }
        };
      }
    }

    return { isEye: false };
  }

  return <svg ref={svgRef} />;
}

