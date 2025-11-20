'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import QRCode from 'qrcode';

type DownloadFormat = 'png' | 'jpg' | 'svg';

const EXPORT_SIZE = 400;
const QUIET_ZONE = 16;

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function QRCodeGenerator() {
  const t = useTranslations('qr');
  const [url, setUrl] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('png');
  const [svgMarkup, setSvgMarkup] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const buildSvg = useCallback(
    async (includeLogo: boolean) => {
      if (!url) return '';
      const baseSvg = await QRCode.toString(url, {
        type: 'svg',
        margin: 0,
        width: EXPORT_SIZE - QUIET_ZONE * 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: qrColor,
          light: bgColor
        }
      });

      const parser = new DOMParser();
      const doc = parser.parseFromString(baseSvg, 'image/svg+xml');
      const svgNode = doc.querySelector('svg');
      if (!svgNode) return '';

      const total = EXPORT_SIZE;
      svgNode.setAttribute('width', String(total));
      svgNode.setAttribute('height', String(total));
      svgNode.setAttribute('viewBox', `0 0 ${total} ${total}`);

      const bgRect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('x', '0');
        bgRect.setAttribute('y', '0');
      bgRect.setAttribute('width', String(total));
      bgRect.setAttribute('height', String(total));
      bgRect.setAttribute('fill', bgColor);
      svgNode.insertBefore(bgRect, svgNode.firstChild);

      const group = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('transform', `translate(${QUIET_ZONE}, ${QUIET_ZONE})`);
      while (svgNode.children.length > 1) {
        const child = svgNode.children[1];
        group.appendChild(child);
      }
      svgNode.appendChild(group);

      if (includeLogo && image) {
        const logoSize = EXPORT_SIZE * 0.2;
        const logoPos = (EXPORT_SIZE - logoSize) / 2;

        const defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const clip = doc.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
        clip.setAttribute('id', 'qr-logo-clip');
        const clipRect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
        clipRect.setAttribute('x', String(logoPos));
        clipRect.setAttribute('y', String(logoPos));
        clipRect.setAttribute('width', String(logoSize));
        clipRect.setAttribute('height', String(logoSize));
        clipRect.setAttribute('rx', String(logoSize * 0.15));
        clip.appendChild(clipRect);
        defs.appendChild(clip);
        svgNode.appendChild(defs);

        const logoBg = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
        logoBg.setAttribute('x', String(logoPos));
        logoBg.setAttribute('y', String(logoPos));
        logoBg.setAttribute('width', String(logoSize));
        logoBg.setAttribute('height', String(logoSize));
        logoBg.setAttribute('rx', String(logoSize * 0.15));
        logoBg.setAttribute('fill', bgColor);
        svgNode.appendChild(logoBg);

        const imgEl = doc.createElementNS('http://www.w3.org/2000/svg', 'image');
        imgEl.setAttribute('href', image);
        imgEl.setAttribute('x', String(logoPos));
        imgEl.setAttribute('y', String(logoPos));
        imgEl.setAttribute('width', String(logoSize));
        imgEl.setAttribute('height', String(logoSize));
        imgEl.setAttribute('clip-path', 'url(#qr-logo-clip)');
        imgEl.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        svgNode.appendChild(imgEl);
      }

      return new XMLSerializer().serializeToString(svgNode);
    },
    [url, qrColor, bgColor, image]
  );

  useEffect(() => {
    const render = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (!url) {
        ctx.clearRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
        setSvgMarkup('');
        return;
      }

      try {
        const tempCanvas = document.createElement('canvas');
        await QRCode.toCanvas(tempCanvas, url, {
          width: EXPORT_SIZE - QUIET_ZONE * 2,
          margin: 0,
          errorCorrectionLevel: 'H',
          color: { dark: qrColor, light: bgColor }
        });

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
        ctx.drawImage(tempCanvas, QUIET_ZONE, QUIET_ZONE);

        if (image) {
          const logoImg = await loadImage(image);
          const logoSize = EXPORT_SIZE * 0.2;
          const pos = (EXPORT_SIZE - logoSize) / 2;
          ctx.fillRect(pos, pos, logoSize, logoSize);
          ctx.drawImage(logoImg, pos, pos, logoSize, logoSize);
        }

        const svgString = await buildSvg(Boolean(image));
        setSvgMarkup(svgString);
      } catch (error) {
        console.error('Failed to generate QR code', error);
        setSvgMarkup('');
      }
    };

    render();
  }, [url, qrColor, bgColor, image, buildSvg]);

  const handleDownload = async () => {
    if (!url) return;
    if (downloadFormat === 'svg') {
      if (!svgMarkup) return;
      const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
      const urlObject = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'personalized-qrcode.svg';
      link.href = urlObject;
        link.click();
      URL.revokeObjectURL(urlObject);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const mime = downloadFormat === 'jpg' ? 'image/jpeg' : 'image/png';
        const link = document.createElement('a');
        link.download = `personalized-qrcode.${downloadFormat}`;
    link.href = canvas.toDataURL(mime, downloadFormat === 'jpg' ? 0.92 : undefined);
        link.click();
  };

  const handlePrint = async () => {
    if (!url || !canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Print QR Code</title></head>
          <body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#fff;">
            <img src="${dataUrl}" alt="QR Code" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleShare = async () => {
    if (!url || !canvasRef.current) return;
    const blob = await new Promise<Blob | null>((resolve) => {
      canvasRef.current?.toBlob((b) => resolve(b));
    });

    if (blob && navigator.share && navigator.canShare({ files: [new File([blob], 'qrcode.png', { type: 'image/png' })] })) {
        await navigator.share({
          files: [new File([blob], 'qrcode.png', { type: 'image/png' })],
          title: 'My Personalized QR Code',
        text: url
      });
    } else if (blob) {
      const urlObject = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'personalized-qrcode.png';
      link.href = urlObject;
      link.click();
      URL.revokeObjectURL(urlObject);
    }
  };

  const handleDelete = () => {
    setUrl('');
    setImage(null);
    setSvgMarkup('');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
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
          <label htmlFor="size">{t('size')} (400px)</label>
          <input id="size" type="range" min="400" max="400" value={400} disabled className="slider" />
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
          <label htmlFor="logo-upload">{t('uploadImage')}</label>
          <div className="file-row">
          <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="file-input"
            />
            {image && (
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => setImage(null)}
              >
                {t('delete')}
              </button>
            )}
        </div>
          {image && (
            <p className="helper-text">
              {/* plain message */}
              Logo will cover the center area of the QR code; keep it simple for best scanning results.
            </p>
          )}
        </div>

      </div>

      {url && (
        <div className="qr-preview-section">
          <div className="qr-preview" style={{ backgroundColor: bgColor }}>
            <canvas
              ref={canvasRef}
              width={EXPORT_SIZE}
              height={EXPORT_SIZE}
              className="qr-canvas"
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

        </div>
      )}
    </div>
  );
}

