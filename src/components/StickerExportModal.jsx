import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { Download, Image, Loader2, QrCode, X } from 'lucide-react';
import Modal from './Modal';
import { Button } from './ui';

const STICKER_COUNT = 6;
const PUBLIC_PATH = (n) => `/img/sticker-${n}.png`;

/**
 * Configuración independiente por diseño.
 * Las coordenadas son proporciones (0-1) sobre las dimensiones naturales
 * de cada plantilla. Los valores de sticker-1 son referencia inicial;
 * los de 2 a 6 son aproximados y se ajustan cuando se confirme la
 * plantilla definitiva.
 */
const stickerConfigurations = {
  1: { image: PUBLIC_PATH(1), qrPosition: { x: 0.5048, y: 0.3054, width: 0.3628, height: 0.3270 } },
  2: { image: PUBLIC_PATH(2), qrPosition: { x: 0.5024, y: 0.3174, width: 0.3397, height: 0.3110 } },
  3: { image: PUBLIC_PATH(3), qrPosition: { x: 0.2480, y: 0.2839, width: 0.5040, height: 0.3740 } },
  4: { image: PUBLIC_PATH(4), qrPosition: { x: 0.5096, y: 0.3278, width: 0.3397, height: 0.3190 } },
  5: { image: PUBLIC_PATH(5), qrPosition: { x: 0.2911, y: 0.2871, width: 0.4179, height: 0.3772 } },
  6: { image: PUBLIC_PATH(6), qrPosition: { x: 0.3600, y: 0.5520, width: 0.2550, height: 0.2570 } },
};

export const StickerExportModal = ({ isOpen, onClose, qr }) => {
  const [selectedId, setSelectedId] = useState(1);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [available, setAvailable] = useState({});
  const [error, setError] = useState(null);

  const publicUrl = useMemo(
    () => `${window.location.origin}/e/${encodeURIComponent(qr.value)}`,
    [qr.value]
  );

  const revoke = useCallback((url) => {
    if (url && url.startsWith('blob:')) window.URL.revokeObjectURL(url);
  }, []);

  const loadImage = useCallback((src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      img.src = src;
    });
  }, []);

  const compose = useCallback(async (designId) => {
    const config = stickerConfigurations[designId];
    if (!config) return null;

    let stickerImg;
    try {
      stickerImg = await loadImage(config.image);
    } catch {
      return { unavailable: true };
    }

    const { naturalWidth: W, naturalHeight: H } = stickerImg;

    let qrImg;
    try {
      const dataUrl = await QRCode.toDataURL(publicUrl, { width: 1024, margin: 2 });
      qrImg = await loadImage(dataUrl);
    } catch (err) {
      throw new Error('No se pudo generar el código QR');
    }

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');

    // Plantilla completa a resolución original.
    g.drawImage(stickerImg, 0, 0, W, H);

    const { x, y, width, height } = config.qrPosition;
    const boxX = W * x;
    const boxY = H * y;
    const boxW = W * width;
    const boxH = H * height;

    // Zona de silencio blanca sobre el espacio reservado.
    g.fillStyle = '#ffffff';
    g.fillRect(boxX, boxY, boxW, boxH);

    // QR centrado dentro del espacio, sin deformar (aspect ratio preservado).
    const pad = Math.min(boxW, boxH) * 0.05;
    const innerW = Math.max(1, boxW - pad * 2);
    const innerH = Math.max(1, boxH - pad * 2);
    const scale = Math.min(innerW / qrImg.width, innerH / qrImg.height);
    const drawW = qrImg.width * scale;
    const drawH = qrImg.height * scale;
    const drawX = boxX + (boxW - drawW) / 2;
    const drawY = boxY + (boxH - drawH) / 2;
    g.drawImage(qrImg, drawX, drawY, drawW, drawH);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('No se pudo generar la imagen del sticker');
    return URL.createObjectURL(blob);
  }, [publicUrl, loadImage]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError(null);
      try {
        const result = await compose(selectedId);
        if (cancelled) return;
        if (result?.unavailable) {
          setAvailable((prev) => ({ ...prev, [selectedId]: false }));
          setPreviewUrl(null);
          setError(`El diseño ${selectedId} aún no está disponible.`);
          return;
        }
        setAvailable((prev) => ({ ...prev, [selectedId]: true }));
        revoke(previewUrl);
        setPreviewUrl(result);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'No se pudo generar la vista previa');
        setPreviewUrl(null);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedId, compose, revoke, previewUrl]);

  const isAvailable = useMemo(() => available[selectedId] !== false, [selectedId, available]);

  const downloadSticker = () => {
    if (!previewUrl || busy) return;
    try {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = `sticker-${qr.value}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setError('No se pudo descargar el sticker');
    }
  };

  const selectDesign = (id) => {
    if (available[id] === false) return;
    setSelectedId(id);
  };

  if (!isOpen) return null;

  return createPortal(
    <div>
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Exportar sticker con QR"
        description={`Selecciona el diseño y descarga el sticker personalizado con el QR del código ${qr.value}.`}
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="btn-ghost px-4 py-2.5 text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={downloadSticker}
              disabled={busy || !previewUrl || !isAvailable}
              className="btn-primary px-6 py-2.5 text-sm"
            >
              {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
              {busy ? 'Generando…' : 'Descargar sticker'}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Diseño del sticker</h3>
            <p className="mt-1 text-xs text-text-secondary">
              El QR se coloca automáticamente en el espacio reservado de cada diseño.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[...Array(STICKER_COUNT)].map((_, i) => {
              const id = i + 1;
              const config = stickerConfigurations[id];
              const done = selectedId === id;
              const av = available[id] !== false;
              const missing = available[id] === false;
              return (
                <div
                  key={id}
                  onClick={() => selectDesign(id)}
                  disabled={!av}
                  className={`group relative flex flex-col items-center rounded-xl border p-3 transition-colors ${
                    done
                      ? 'border-brand-500 bg-brand-50/50'
                      : av
                        ? 'border-border bg-white hover:border-brand-500/40 hover:cursor-pointer'
                        : 'border-border/30 bg-neutral-50/50 text-neutral-400'
                  }`}
                  aria-pressed={done}
                  role="radio"
                  aria-checked={done}
                  aria-label={`Diseño ${id}${missing ? ', no disponible' : ''}`}
                >
                  <div className="relative mb-2 h-20 w-20 rounded-lg border border-border overflow-hidden">
                    {av ? (
                      <img
                        src={config.image}
                        alt={`Sticker ${id}`}
                        className="h-full w-full object-cover"
                        onError={() => {
                          setAvailable((prev) => ({ ...prev, [id]: false }));
                          setError(`El diseño ${id} no se pudo cargar.`);
                        }}
                        decoding="async"
                      />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center">
                        <Image size={20} className="mb-1" aria-hidden="true" />
                        <span className="text-[10px] font-semibold">Pendiente</span>
                      </div>
                    )}
                    {done && (
                      <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white text-[10px] font-bold ring-2 ring-white">
                        <QrCode size={10} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-neutral-900 truncate w-full text-center">Diseño {id}</span>
                  {!av && (
                    <span className="mt-0.5 text-[10px] font-semibold text-neutral-500">Pendiente</span>
                  )}
                </div>
              );
            })}
          </div>

          {!isAvailable && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-xs text-rose-700">
              {error || `El diseño ${selectedId} aún no está disponible. Elige otro diseño.`}
            </div>
          )}

          <div className="rounded-2xl border border-border bg-white p-4">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Vista previa</h3>
            <div className="flex items-center justify-center min-h-[260px]">
              {busy ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={24} className="animate-spin text-text-secondary" aria-label="Generando" />
                  <p className="text-xs text-text-secondary">Componiendo sticker…</p>
                </div>
              ) : !previewUrl ? (
                <p className="text-xs text-text-secondary">Selecciona un diseño para ver la vista previa.</p>
              ) : (
                <img
                  src={previewUrl}
                  alt="Vista previa del sticker"
                  className="max-w-full max-h-[420px] object-contain rounded-lg border border-border bg-white shadow-sm"
                />
              )}
            </div>
            <p className="mt-2 text-xs text-text-secondary">
              Se descarga en PNG a la resolución original de la plantilla ({previewUrl ? 'lista' : '—'}).
            </p>
          </div>
        </div>
      </Modal>
    </div>,
    document.body
  );
};

StickerExportModal.displayName = 'StickerExportModal';

export default StickerExportModal;
