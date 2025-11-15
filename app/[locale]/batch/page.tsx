'use client';

import { useState, useRef, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

type PlanKey = 'monthly' | 'quarterly' | 'yearly';

export default function BatchPage() {
  const t = useTranslations('batch');
  const tSubscribe = useTranslations('subscribe');
  const locale = useLocale();
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<string[]>([]);
  const [qrCodes, setQrCodes] = useState<{ content: string; dataUrl: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Customization options
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [centerImage, setCenterImage] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Subscription state
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('monthly');
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError(null);
    setSuccess(null);
    setData([]);
    setQrCodes([]);
    setIsProcessing(true);

    try {
      const fileExtension = uploadedFile.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'csv') {
        await parseCSV(uploadedFile);
      } else if (fileExtension === 'xls' || fileExtension === 'xlsx') {
        await parseExcel(uploadedFile);
      } else {
        setError(t('error.invalidFormat'));
        setIsProcessing(false);
        return;
      }
    } catch (err) {
      console.error('Error parsing file:', err);
      setError(t('error.parseError'));
      setIsProcessing(false);
    }
  };

  const parseCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      setError(t('error.emptyFile'));
      setIsProcessing(false);
      return;
    }

    // Parse CSV - get first column of each row
    const contents: string[] = [];
    for (const line of lines) {
      // Simple CSV parsing - split by comma, handle quoted values
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      if (values[0] && values[0].length > 0) {
        contents.push(values[0]);
      }
    }

    if (contents.length === 0) {
      setError(t('error.emptyFile'));
      setIsProcessing(false);
      return;
    }

    setData(contents);
    setIsProcessing(false);
  };

  const parseExcel = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length === 0) {
      setError(t('error.emptyFile'));
      setIsProcessing(false);
      return;
    }

    // Get first column of each row
    const contents: string[] = [];
    for (const row of jsonData as any[]) {
      if (Array.isArray(row) && row[0] && String(row[0]).trim().length > 0) {
        contents.push(String(row[0]).trim());
      }
    }

    if (contents.length === 0) {
      setError(t('error.emptyFile'));
      setIsProcessing(false);
      return;
    }

    setData(contents);
    setIsProcessing(false);
  };

  const generateQRCodes = async () => {
    if (data.length === 0) {
      setError(t('error.noFile'));
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    setQrCodes([]);

    try {
      const generated: { content: string; dataUrl: string }[] = [];
      const size = 400;
      const margin = 2;

      for (let i = 0; i < data.length; i++) {
        const content = data[i];
        try {
          // Generate QR code with custom colors
          const qrDataUrl = await QRCode.toDataURL(content, {
            width: size,
            margin: margin,
            color: {
              dark: qrColor,
              light: bgColor
            }
          });

          // If there's a center image, composite it onto the QR code
          if (centerImage) {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              // Draw background
              ctx.fillStyle = bgColor;
              ctx.fillRect(0, 0, size, size);
              
              // Draw QR code
              const qrImg = new Image();
              await new Promise((resolve, reject) => {
                qrImg.onload = () => {
                  ctx.drawImage(qrImg, 0, 0);
                  
                  // Draw center image
                  const centerImg = new Image();
                  centerImg.onload = () => {
                    const centerSize = size * 0.2; // 20% of QR code size
                    const centerX = (size - centerSize) / 2;
                    const centerY = (size - centerSize) / 2;
                    
                    // Draw white circle background for image
                    ctx.fillStyle = bgColor;
                    ctx.beginPath();
                    ctx.arc(size / 2, size / 2, centerSize / 2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Draw image in circle
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(size / 2, size / 2, centerSize / 2, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.drawImage(centerImg, centerX, centerY, centerSize, centerSize);
                    ctx.restore();
                    
                    const finalDataUrl = canvas.toDataURL('image/png');
                    generated.push({ content, dataUrl: finalDataUrl });
                    resolve(null);
                  };
                  centerImg.onerror = reject;
                  centerImg.src = centerImage;
                };
                qrImg.onerror = reject;
                qrImg.src = qrDataUrl;
              });
            } else {
              generated.push({ content, dataUrl: qrDataUrl });
            }
          } else {
            generated.push({ content, dataUrl: qrDataUrl });
          }
        } catch (err) {
          console.error(`Error generating QR code for ${content}:`, err);
        }
      }

      if (generated.length === 0) {
        setError(t('error.generateError'));
        setIsGenerating(false);
        return;
      }

      setQrCodes(generated);
      setSuccess(t('success.generated', { count: generated.length }));
      setIsGenerating(false);
    } catch (err) {
      console.error('Error generating QR codes:', err);
      setError(t('error.generateError'));
      setIsGenerating(false);
    }
  };

  const downloadZip = async () => {
    if (qrCodes.length === 0) {
      setError(t('error.noFile'));
      return;
    }

    try {
      const zip = new JSZip();

      for (let i = 0; i < qrCodes.length; i++) {
        const { content, dataUrl } = qrCodes[i];
        // Extract base64 data
        const base64Data = dataUrl.split(',')[1];
        // Create filename from content (sanitize)
        const filename = content
          .substring(0, 50)
          .replace(/[^a-z0-9]/gi, '_')
          .toLowerCase() + `_${i + 1}.png`;
        
        zip.file(filename, base64Data, { base64: true });
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'qrcodes.zip');
    } catch (err) {
      console.error('Error creating ZIP:', err);
      setError('Error creating ZIP file');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCenterImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setCenterImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const reset = () => {
    setFile(null);
    setData([]);
    setQrCodes([]);
    setError(null);
    setSuccess(null);
    setIsProcessing(false);
    setIsGenerating(false);
    setQrColor('#000000');
    setBgColor('#FFFFFF');
    setCenterImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = 'Content\nhttps://example.com\nhttps://example2.com\nHello World\nYour text here';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'qrcode-template.csv');
  };

  const downloadExcelTemplate = () => {
    const templateData = [
      ['Content'],
      ['https://example.com'],
      ['https://example2.com'],
      ['Hello World'],
      ['Your text here']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'qrcode-template.xlsx');
  };

  const handleSubscribe = () => {
    setSubscribeError(null);
    startTransition(async () => {
      try {
        const response = await fetch('/api/creem/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ planId: selectedPlan })
        });

        const payload = await response.json();

        if (!response.ok || !payload.success) {
          const message =
            payload?.error ??
            `Creem checkout failed with status ${response.status}.`;
          throw new Error(message);
        }

        const redirectUrl =
          payload.data?.url ??
          payload.data?.checkout_url ??
          payload.data?.redirect_url;

        if (!redirectUrl) {
          throw new Error('Missing checkout URL in Creem response.');
        }

        window.location.href = redirectUrl;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unexpected error during checkout.';
        setSubscribeError(message);
      }
    });
  };

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>{t('title')}</h1>
        <p className="hero-description">{t('subtitle')}</p>
        <p>{t('description')}</p>
      </section>

      <section className="content-section">
        <div className="batch-generator">
          <div className="batch-upload-section">
            <h2>{t('upload')}</h2>
            <p className="batch-upload-desc">{t('uploadDesc')}</p>
            <p className="batch-format">{t('fileFormat')}</p>
            
            <div className="batch-template-section">
              <p className="template-desc">{t('templateDesc')}</p>
              <div className="template-buttons">
                <button
                  onClick={downloadCSVTemplate}
                  className="btn btn-secondary"
                  type="button"
                >
                  {t('downloadTemplateCSV')}
                </button>
                <button
                  onClick={downloadExcelTemplate}
                  className="btn btn-secondary"
                  type="button"
                >
                  {t('downloadTemplateExcel')}
                </button>
              </div>
            </div>
            
            <div className="batch-file-input">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileUpload}
                disabled={isProcessing || isGenerating}
                className="file-input"
              />
              {file && (
                <div className="file-info">
                  <p>{t('selectedFile', { fileName: file.name })}</p>
                  {data.length > 0 && (
                    <p className="data-count">{t('count', { count: data.length })}</p>
                  )}
                </div>
              )}
            </div>

            {isProcessing && (
              <div className="batch-status">
                <p>{t('processing')}</p>
              </div>
            )}

            {error && (
              <div className="form-error">
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="form-success">
                <p>{success}</p>
              </div>
            )}

            {/* Customization Options */}
            {data.length > 0 && (
              <div className="batch-customize-section">
                <h3>{t('customize')}</h3>
                
                <div className="customize-controls">
                  <div className="control-group">
                    <label htmlFor="qr-color">{t('qrColor')}</label>
                    <div className="color-input-wrapper">
                      <input
                        id="qr-color"
                        type="color"
                        value={qrColor}
                        onChange={(e) => setQrColor(e.target.value)}
                        className="color-input"
                      />
                      <input
                        type="text"
                        value={qrColor}
                        onChange={(e) => setQrColor(e.target.value)}
                        className="color-text-input"
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div className="control-group">
                    <label htmlFor="bg-color">{t('bgColor')}</label>
                    <div className="color-input-wrapper">
                      <input
                        id="bg-color"
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="color-input"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="color-text-input"
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>

                  <div className="control-group">
                    <label htmlFor="center-image">{t('centerImage')}</label>
                    <div className="image-upload-wrapper">
                      <input
                        ref={imageInputRef}
                        id="center-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="file-input"
                      />
                      {centerImage && (
                        <div className="image-preview-wrapper">
                          <img src={centerImage} alt="Center preview" className="image-preview" />
                          <button
                            onClick={removeImage}
                            className="btn btn-danger btn-small"
                            type="button"
                          >
                            {t('removeImage')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {data.length > 0 && !isGenerating && qrCodes.length === 0 && (
              <button
                onClick={generateQRCodes}
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
              >
                {t('generate')}
              </button>
            )}

            {isGenerating && (
              <div className="batch-status">
                <p>{t('generating')}</p>
              </div>
            )}

            {qrCodes.length > 0 && (
              <>
                <div className="batch-success">
                  <p>{t('success.ready')}</p>
                </div>
                <div className="batch-actions">
                  <button onClick={downloadZip} className="btn btn-primary">
                    {t('download')}
                  </button>
                  <button onClick={reset} className="btn btn-secondary">
                    {t('reset')}
                  </button>
                </div>
              </>
            )}
          </div>

          {qrCodes.length > 0 && (
            <div className="batch-preview-section">
              <h3>{t('preview')}</h3>
              <div className="batch-preview-grid">
                {qrCodes.slice(0, 12).map((qr, index) => (
                  <div key={index} className="batch-preview-item">
                    <img src={qr.dataUrl} alt={`QR Code ${index + 1}`} />
                    <p className="preview-content">{qr.content.substring(0, 30)}...</p>
                  </div>
                ))}
              </div>
              {qrCodes.length > 12 && (
                <p className="preview-more">{t('moreItems', { count: qrCodes.length - 12 })}</p>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="content-section">
        <div className="plans-section-wrapper">
          <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '2rem' }}>
            {tSubscribe('title')}
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            {tSubscribe('description')}
          </p>
          
          <div className="plans-section">
            {(['monthly', 'quarterly', 'yearly'] as PlanKey[]).map((key) => {
              const isActive = selectedPlan === key;
              return (
                <article
                  key={key}
                  className={`plan-card${isActive ? ' active' : ''}`}
                  onClick={() => setSelectedPlan(key)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      setSelectedPlan(key);
                    }
                  }}
                >
                  <div className="plan-header">
                    <h2>{tSubscribe(`plans.${key}.title`)}</h2>
                    <span className="price">{tSubscribe(`plans.${key}.priceLabel`)}</span>
                  </div>
                  <p className="subtitle">{tSubscribe(`plans.${key}.subtitle`)}</p>
                  <p className="savings">
                    {tSubscribe(`plans.${key}.savings`)}
                  </p>
                </article>
              );
            })}
          </div>

          {subscribeError && <p className="error-message">{subscribeError}</p>}

          <button
            className="cta-button"
            onClick={handleSubscribe}
            disabled={isPending}
            type="button"
          >
            {isPending ? tSubscribe('redirecting') : tSubscribe('checkout')}
          </button>
        </div>
      </section>
    </div>
  );
}

