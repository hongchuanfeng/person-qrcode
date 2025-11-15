'use client';

import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { useTranslations } from 'next-intl';
import CustomQRCode from './CustomQRCode';
import { BodyShape, EyeFrameShape, EyeBallShape } from '@/utils/qrShapes';
import { ShapeSelector, bodyShapeOptions, eyeFrameShapeOptions, eyeBallShapeOptions } from './ShapeSelector';

type DownloadFormat = 'png' | 'jpg' | 'svg';

export default function QRCodeGenerator() {
  const t = useTranslations('qr');
  const [url, setUrl] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [size, setSize] = useState(400);
  const [scanCount, setScanCount] = useState(0);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('png');
  const [bodyShape, setBodyShape] = useState<BodyShape>('square');
  const [eyeFrameShape, setEyeFrameShape] = useState<EyeFrameShape>('square');
  const [eyeBallShape, setEyeBallShape] = useState<EyeBallShape>('square');
  const qrRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    if (!qrRef.current) return;
    
    try {
      if (downloadFormat === 'svg') {
        // Download as SVG - find SVG element in the container
        const svgElement = qrRef.current?.querySelector('svg');
        if (!svgElement) return;
        
        // Clone the SVG element
        const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
        
        // Create a wrapper SVG with background
        const wrapperSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        wrapperSvg.setAttribute('width', String(size + 40));
        wrapperSvg.setAttribute('height', String(size + 40));
        wrapperSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        wrapperSvg.setAttribute('viewBox', `0 0 ${size + 40} ${size + 40}`);
        
        // Add background rectangle
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('width', String(size + 40));
        bgRect.setAttribute('height', String(size + 40));
        bgRect.setAttribute('fill', bgColor);
        bgRect.setAttribute('x', '0');
        bgRect.setAttribute('y', '0');
        wrapperSvg.appendChild(bgRect);
        
        // Create a group for the QR code and translate it
        const qrGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        qrGroup.setAttribute('transform', 'translate(20, 20)');
        
        // Move all children from cloned SVG to the group
        Array.from(clonedSvg.childNodes).forEach((child) => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            qrGroup.appendChild(child.cloneNode(true));
          }
        });
        
        wrapperSvg.appendChild(qrGroup);
        
        const svgData = new XMLSerializer().serializeToString(wrapperSvg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const link = document.createElement('a');
        link.download = 'personalized-qrcode.svg';
        link.href = svgUrl;
        link.click();
        URL.revokeObjectURL(svgUrl);
      } else {
        // Download as PNG or JPG using canvas
        const canvas = await html2canvas(qrRef.current, {
          backgroundColor: bgColor,
          scale: 2
        });
        
        const mimeType = downloadFormat === 'jpg' ? 'image/jpeg' : 'image/png';
        const quality = downloadFormat === 'jpg' ? 0.92 : undefined;
        
        const link = document.createElement('a');
        link.download = `personalized-qrcode.${downloadFormat}`;
        link.href = canvas.toDataURL(mimeType, quality);
        link.click();
      }
    } catch (error) {
      console.error('Failed to download:', error);
    }
  };

  const handlePrint = async () => {
    if (!qrRef.current) return;
    const canvas = await html2canvas(qrRef.current, {
      backgroundColor: bgColor,
      scale: 2
    });
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Print QR Code</title></head>
          <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
            <img src="${canvas.toDataURL('image/png')}" alt="QR Code" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleShare = async () => {
    if (!qrRef.current) return;
    try {
      const canvas = await html2canvas(qrRef.current, {
        backgroundColor: bgColor,
        scale: 2
      });
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        });
      });
      if (navigator.share && navigator.canShare({ files: [new File([blob], 'qrcode.png', { type: 'image/png' })] })) {
        await navigator.share({
          files: [new File([blob], 'qrcode.png', { type: 'image/png' })],
          title: 'My Personalized QR Code',
          text: 'Check out my personalized QR code!'
        });
      } else {
        // Fallback: copy to clipboard or show download
        await navigator.clipboard.writeText(url);
        alert('URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleDelete = () => {
    setUrl('');
    setImage(null);
    setScanCount(0);
  };

  return (
    <div className="qr-generator">
      <div className="qr-controls">
        <div className="control-group">
          <label htmlFor="url">{t('urlPlaceholder')}</label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t('urlPlaceholder')}
            className="input"
          />
        </div>

        <div className="control-group">
          <label htmlFor="image">{t('uploadImage')}</label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="file-input"
          />
        </div>

        <div className="control-group">
          <label htmlFor="qrColor">{t('color')}</label>
          <input
            id="qrColor"
            type="color"
            value={qrColor}
            onChange={(e) => setQrColor(e.target.value)}
            className="color-input"
          />
        </div>

        <div className="control-group">
          <label htmlFor="bgColor">{t('backgroundColor')}</label>
          <input
            id="bgColor"
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="color-input"
          />
        </div>

        <div className="control-group">
          <label htmlFor="size">{t('size')}: {size}px</label>
          <input
            id="size"
            type="range"
            min="200"
            max="800"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="slider"
          />
        </div>

        {url && (
          <>
            <ShapeSelector
              label={t('bodyShape')}
              value={bodyShape}
              options={bodyShapeOptions}
              onChange={(value) => setBodyShape(value)}
            />
            <ShapeSelector
              label={t('eyeFrameShape')}
              value={eyeFrameShape}
              options={eyeFrameShapeOptions}
              onChange={(value) => setEyeFrameShape(value)}
            />
            <ShapeSelector
              label={t('eyeBallShape')}
              value={eyeBallShape}
              options={eyeBallShapeOptions}
              onChange={(value) => setEyeBallShape(value)}
            />
          </>
        )}
      </div>

      {url && (
        <div className="qr-preview-section">
          <div ref={qrRef} className="qr-preview" style={{ backgroundColor: bgColor, padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CustomQRCode
              value={url}
              size={size}
              fgColor={qrColor}
              bgColor={bgColor}
              bodyShape={bodyShape}
              eyeFrameShape={eyeFrameShape}
              eyeBallShape={eyeBallShape}
              image={image || undefined}
              imageSize={0.2}
            />
          </div>

          <div className="control-group">
            <label htmlFor="downloadFormat">{t('downloadFormat')}</label>
            <select
              id="downloadFormat"
              value={downloadFormat}
              onChange={(e) => setDownloadFormat(e.target.value as DownloadFormat)}
              className="select-input"
            >
              <option value="png">{t('formatPNG')}</option>
              <option value="jpg">{t('formatJPG')}</option>
              <option value="svg">{t('formatSVG')}</option>
            </select>
          </div>

          <div className="qr-actions">
            <button onClick={handleDownload} className="btn btn-primary">
              {t('download')}
            </button>
            <button onClick={handlePrint} className="btn btn-secondary">
              {t('print')}
            </button>
            <button onClick={handleShare} className="btn btn-secondary">
              {t('share')}
            </button>
            <button onClick={handleDelete} className="btn btn-danger">
              {t('delete')}
            </button>
          </div>

          <div className="qr-stats">
            <p>{t('scansCount')}: {scanCount}</p>
          </div>
        </div>
      )}
    </div>
  );
}

