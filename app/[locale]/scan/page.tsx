 'use client';

import { useTranslations } from 'next-intl';
import Script from 'next/script';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { BrowserQRCodeReader, BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

const MAX_HISTORY = 5;
const FEEDBACK_EMAIL = 'support@chdaoai.com';
type TorchConstraint = MediaTrackConstraintSet & { torch?: boolean };
type ZXingResult = { getText(): string };
type QRImageReader = {
  decodeFromImageUrl: (url: string) => Promise<ZXingResult>;
  reset?: () => void;
};

function isNotFoundError(error: unknown) {
  return typeof error === 'object' && error !== null && 'name' in error && (error as { name: string }).name === 'NotFoundException';
}

export default function ScanPage() {
  const t = useTranslations('scanner');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [result, setResult] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDecodingImage, setIsDecodingImage] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [cameraSupported, setCameraSupported] = useState(false);

  const helpSteps = useMemo(() => {
    const raw = t.raw('help.steps');
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [t]);

  const noteItems = useMemo(() => {
    const raw = t.raw('notes.items');
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [t]);

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setTorchEnabled(false);
    setTorchAvailable(false);
  }, []);

  const resetReader = useCallback(() => {
    const reader = readerRef.current;
    if (reader && 'reset' in reader && typeof reader.reset === 'function') {
      reader.reset();
    }
  }, []);

  const updateTorchAvailability = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks?.()[0];
    if (!track || typeof track.getCapabilities !== 'function') {
      setTorchAvailable(false);
      setTorchEnabled(false);
      return;
    }
    const capabilities = track.getCapabilities();
    const supported = Boolean(capabilities && 'torch' in capabilities && (capabilities as MediaTrackCapabilities & { torch?: boolean }).torch);
    setTorchAvailable(supported);
    if (!supported) {
      setTorchEnabled(false);
    }
  }, []);

  const handleSuccess = useCallback((text: string) => {
    setResult(text);
    setHistory((prev) => {
      const next = [text, ...prev.filter((entry) => entry !== text)];
      return next.slice(0, MAX_HISTORY);
    });
    setError(null);
  }, []);

  const startCamera = useCallback(
    async (deviceId?: string) => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setError(t('camera.unsupported'));
        return;
      }

      const video = videoRef.current;
      if (!video) {
        return;
      }

      if (!readerRef.current) {
        readerRef.current = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 400 });
      }

      try {
        setError(null);
        const controls = await readerRef.current.decodeFromVideoDevice(
          deviceId ?? selectedDeviceId ?? undefined,
          video,
          (scanResult, err) => {
            if (scanResult) {
              handleSuccess(scanResult.getText());
            } else if (err && !isNotFoundError(err)) {
              console.warn('[QR Scanner] camera decode error:', err);
              setError(t('camera.readError'));
            }
          }
        );
        controlsRef.current = controls;
        setCameraActive(true);
        setTimeout(updateTorchAvailability, 800);
      } catch (cameraError) {
        console.error('[QR Scanner] camera error', cameraError);
        setError(t('camera.permission'));
      }
    },
    [handleSuccess, selectedDeviceId, t, updateTorchAvailability]
  );

  useEffect(() => {
    setCameraSupported(typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia);
    readerRef.current = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 400 });

    return () => {
      stopCamera();
      resetReader();
    };
  }, [resetReader, stopCamera]);

  useEffect(() => {
    if (!cameraSupported || typeof navigator === 'undefined') {
      return;
    }
    let mounted = true;

    const loadDevices = async () => {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        if (!mounted) return;
        const videoDevices = mediaDevices.filter((device) => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length && !selectedDeviceId) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error('[QR Scanner] enumerateDevices error', err);
      }
    };

    loadDevices();

    return () => {
      mounted = false;
    };
  }, [cameraSupported, selectedDeviceId]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsDecodingImage(true);
      setError(null);

      if (!readerRef.current) {
        readerRef.current = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 300 });
      }

      const temporaryReader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 300 });
      const fallbackReader = new BrowserMultiFormatReader();
      const dataUrl = URL.createObjectURL(file);

      const tryReaders = async () => {
        const readers = [readerRef.current, temporaryReader, fallbackReader].filter(Boolean) as QRImageReader[];

        let lastError: unknown = null;
        for (const reader of readers) {
          try {
            return await reader.decodeFromImageUrl(dataUrl);
          } catch (decodeError) {
            lastError = decodeError;
            if (!isNotFoundError(decodeError)) {
              throw decodeError;
            }
          }
        }
        throw lastError ?? new Error('Unable to decode image');
      };

      try {
        const decodeResult = await tryReaders();
        if (decodeResult) {
          handleSuccess(decodeResult.getText());
        } else {
          setError(t('upload.error'));
        }
      } catch (decodeError) {
        if (isNotFoundError(decodeError)) {
          setError(t('upload.error'));
        } else {
          console.error('[QR Scanner] decode image error', decodeError);
          setError(t('upload.error'));
        }
      } finally {
        setIsDecodingImage(false);
        URL.revokeObjectURL(dataUrl);
        if ('reset' in temporaryReader && typeof temporaryReader.reset === 'function') {
          temporaryReader.reset();
        }
        if ('reset' in fallbackReader && typeof fallbackReader.reset === 'function') {
          fallbackReader.reset();
        }
      }
    },
    [handleSuccess, t]
  );

  const toggleTorch = useCallback(async () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks?.()[0];
    if (!track) {
      return;
    }
    if (!torchAvailable) {
      setError(t('camera.torchUnavailable'));
      return;
    }
    try {
      const constraints: MediaTrackConstraints & { advanced: TorchConstraint[] } = {
        advanced: [{ torch: !torchEnabled }]
      };
      await track.applyConstraints(constraints);
      setTorchEnabled((prev) => !prev);
    } catch (torchError) {
      console.error('[QR Scanner] torch error', torchError);
      setError(t('camera.torchUnavailable'));
    }
  }, [torchAvailable, torchEnabled, t]);

  const copyResult = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setError(null);
    } catch (copyError) {
      console.error('[QR Scanner] copy error', copyError);
      setError(t('status.copyError'));
    }
  }, [result, t]);

  const submitFeedback = useCallback(() => {
    if (!feedback.trim()) return;
    const subject = encodeURIComponent('QR scanner feedback');
    const body = encodeURIComponent(feedback.trim());
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
  }, [feedback]);

  const historyList = history.length ? history : [];

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>{t('title')}</h1>
        <p>{t('subtitle')}</p>
        <div className="scanner-notes">
          {noteItems.map((item) => (
            <span key={item} className="note-pill">
              {item}
            </span>
          ))}
        </div>
      </section>

      <div className="scanner-grid">
        <section className="scanner-card scanner-card--full">
          <h2>{t('upload.title')}</h2>
          <p>{t('upload.description')}</p>
          <label className="upload-input">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileChange}
              disabled={isDecodingImage}
            />
            <span>{t('upload.button')}</span>
          </label>
          <p className="helper-text">{t('upload.help')}</p>
          {isDecodingImage && <p className="status-info">{t('upload.processing')}</p>}
        </section>

        <section className="scanner-card">
          <h2>{t('camera.title')}</h2>
          <p>{t('camera.description')}</p>
          {!cameraSupported && <p className="error-text">{t('camera.unsupported')}</p>}
          {cameraSupported && (
            <>
              <div className="camera-controls">
                <button className="btn btn-primary" onClick={() => startCamera()} disabled={cameraActive}>
                  {t('camera.start')}
                </button>
                <button className="btn btn-secondary" onClick={stopCamera} disabled={!cameraActive}>
                  {t('camera.stop')}
                </button>
                {torchAvailable && (
                  <button className="btn btn-ghost" onClick={toggleTorch} disabled={!cameraActive}>
                    {torchEnabled ? t('camera.torchOff') : t('camera.torchOn')}
                  </button>
                )}
              </div>
              {devices.length > 1 && (
                <label className="select-field">
                  <span>{t('camera.switch')}</span>
                  <select
                    value={selectedDeviceId ?? ''}
                    onChange={async (event) => {
                      const newId = event.target.value;
                      setSelectedDeviceId(newId);
                      if (cameraActive) {
                        stopCamera();
                        await startCamera(newId);
                      }
                    }}
                  >
                    {devices.map((device) => (
                      <option value={device.deviceId} key={device.deviceId}>
                        {device.label || `${t('camera.device')} ${device.deviceId.slice(-4)}`}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <video ref={videoRef} className={`scanner-video ${cameraActive ? 'active' : ''}`} muted playsInline autoPlay />
              <p className="status-info">{cameraActive ? t('camera.statusOn') : t('camera.statusOff')}</p>
              <p className="helper-text">{t('camera.permission')}</p>
            </>
          )}
        </section>

        <section className="scanner-card">
          <h2>{t('status.title')}</h2>
          {result ? (
            <>
              <pre className="scan-result">{result}</pre>
              <div className="status-actions">
                <button className="btn btn-primary" onClick={copyResult}>
                  {t('status.copy')}
                </button>
                <button className="btn btn-secondary" onClick={() => setResult('')}>
                  {t('status.clear')}
                </button>
              </div>
            </>
          ) : (
            <p className="helper-text">{t('status.empty')}</p>
          )}
          <div className="history">
            <h3>{t('status.history')}</h3>
            {historyList.length ? (
              <ul>
                {historyList.map((item, index) => (
                  <li key={`${item}-${index}`}>
                    <button className="link-button" onClick={() => setResult(item)}>
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="helper-text">{t('status.historyEmpty')}</p>
            )}
          </div>
        </section>
      </div>

      <section className="scanner-help">
        <div>
          <h2>{t('help.title')}</h2>
          <p>{t('help.description')}</p>
          <ol>
            {helpSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="feedback-card">
          <h2>{t('feedback.title')}</h2>
          <p>{t('feedback.description')}</p>
          <textarea
            value={feedback}
            placeholder={t('feedback.placeholder')}
            onChange={(event) => setFeedback(event.target.value)}
          />
          <button className="btn btn-primary" onClick={submitFeedback} disabled={!feedback.trim()}>
            {t('feedback.button')}
          </button>
          <p className="helper-text">{t('feedback.mail')}</p>
        </div>
      </section>

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}


