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
      // Calculate module size more accurately - use the actual module count without extra padding in calculation
      const moduleSize = size / moduleCount;
      // Add quiet zone (padding) - 4 modules on each side
      const padding = moduleSize * 4;

      const svg = svgRef.current!;
      svg.innerHTML = ''; // Clear previous content

      // Set SVG attributes
      svg.setAttribute('width', String(size + padding * 2));
      svg.setAttribute('height', String(size + padding * 2));
      svg.setAttribute('viewBox', `0 0 ${size + padding * 2} ${size + padding * 2}`);

      // Background
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('width', String(size + padding * 2));
      bgRect.setAttribute('height', String(size + padding * 2));
      bgRect.setAttribute('fill', bgColor);
      svg.appendChild(bgRect);

      // Calculate center area for image (if provided) - make it smaller to preserve scannability
      let centerArea: { row: number; col: number; size: number } | null = null;
      if (image) {
        // Use smaller image size to preserve more QR code data
        const imageSizeInModules = Math.max(5, Math.min(9, Math.ceil((size * imageSize * 0.8) / moduleSize)));
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
              
              // Draw standard finder pattern structure (7x7 outer, 3x3 inner, 1x1 center)
              // Outer 7x7 frame
              const outerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              outerRect.setAttribute('x', String(finderX));
              outerRect.setAttribute('y', String(finderY));
              outerRect.setAttribute('width', String(moduleSize * 7));
              outerRect.setAttribute('height', String(moduleSize * 7));
              outerRect.setAttribute('fill', fgColor);
              svg.appendChild(outerRect);
              
              // Inner 3x3 ball (background color)
              const innerX = finderX + moduleSize * 2;
              const innerY = finderY + moduleSize * 2;
              const innerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              innerRect.setAttribute('x', String(innerX));
              innerRect.setAttribute('y', String(innerY));
              innerRect.setAttribute('width', String(moduleSize * 3));
              innerRect.setAttribute('height', String(moduleSize * 3));
              innerRect.setAttribute('fill', bgColor);
              svg.appendChild(innerRect);
              
              // Center 1x1 dot (foreground color)
              const centerX = finderX + moduleSize * 3;
              const centerY = finderY + moduleSize * 3;
              const centerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              centerRect.setAttribute('x', String(centerX));
              centerRect.setAttribute('y', String(centerY));
              centerRect.setAttribute('width', String(moduleSize));
              centerRect.setAttribute('height', String(moduleSize));
              centerRect.setAttribute('fill', fgColor);
              svg.appendChild(centerRect);
              
              // Apply custom shape decoration on top (visible but doesn't affect scanning)
              if (eyeFrameShape !== 'square' || eyeBallShape !== 'square') {
                const decorationGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                decorationGroup.setAttribute('opacity', '0.75'); // More visible decoration
                
                const finderSize = 7 * moduleSize;
                
                // Draw eye frame decoration with fill for better visibility
                if (eyeFrameShape !== 'square') {
                  const framePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                  framePath.setAttribute('fill', fgColor);
                  drawEyeFrame(framePath, finderX, finderY, finderSize, eyeFrameShape, true);
                  decorationGroup.appendChild(framePath);
                }
                
                // Draw eye ball decoration with fill for better visibility
                if (eyeBallShape !== 'square') {
                  const ballSize = moduleSize * 3;
                  const ballPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                  ballPath.setAttribute('fill', bgColor);
                  drawEyeBall(ballPath, innerX, innerY, ballSize, eyeBallShape, true);
                  decorationGroup.appendChild(ballPath);
                }
                
                svg.appendChild(decorationGroup);
              }
            }
            // Skip individual module drawing for finder patterns
            continue;
          } else if (isModule) {
            // Always draw standard squares for maximum scannability
            // Custom shapes are applied as decoration only
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', String(x));
            rect.setAttribute('y', String(y));
            rect.setAttribute('width', String(moduleSize));
            rect.setAttribute('height', String(moduleSize));
            rect.setAttribute('fill', fgColor);
            svg.appendChild(rect);
            
            // Apply custom shape as decoration (only if not square)
            if (bodyShape !== 'square') {
              const bodyPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              bodyPath.setAttribute('fill', fgColor);
              bodyPath.setAttribute('opacity', '0.95'); // High opacity for visible decoration
              drawBodyShape(bodyPath, x, y, moduleSize, bodyShape, true);
              svg.appendChild(bodyPath);
            }
          }
        }
      }

      // Step 3: Add center image if provided (on top of everything)
      if (image && centerArea) {
        const imageSizePx = centerArea.size * moduleSize * 0.9; // Slightly smaller than the cleared area
        const totalSize = size + padding * 2;
        const centerX = totalSize / 2 - imageSizePx / 2;
        const centerY = totalSize / 2 - imageSizePx / 2;

        // Create background circle
        const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bgCircle.setAttribute('cx', String(totalSize / 2));
        bgCircle.setAttribute('cy', String(totalSize / 2));
        bgCircle.setAttribute('r', String(imageSizePx / 2));
        bgCircle.setAttribute('fill', bgColor);
        svg.appendChild(bgCircle);

        // Create clip path for circular image
        const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
        clipPath.setAttribute('id', 'image-clip');
        const clipCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        clipCircle.setAttribute('cx', String(totalSize / 2));
        clipCircle.setAttribute('cy', String(totalSize / 2));
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

