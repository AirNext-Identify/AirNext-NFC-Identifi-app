import { useState, useRef, useCallback, useEffect } from 'react';
import { X, RotateCw, ZoomIn, ZoomOut, Check, Camera, Grid3x3 } from 'lucide-react';

interface Props {
  onSave: (dataUrl: string) => void;
  onCancel?: () => void;
  onClose?: () => void;
  initialImage?: string;
  title?: string;
  /** Proporção largura/altura do recorte. 1 = quadrado, 3 = capa larga, 16/9 = galeria, 9/16 = fundo retrato. */
  aspect?: number;
  /** Texto de ajuda com o tamanho recomendado, exibido abaixo do recorte. */
  helperText?: string;
}

export default function ImageEditor({ onSave, onCancel, onClose, initialImage, title = 'Editar Imagem', aspect = 4 / 3, helperText }: Props) {
  const close = onClose || onCancel || (() => {});
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage || null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialImage) return;
    const img = new Image();
    if (initialImage.startsWith('http')) img.crossOrigin = 'anonymous';
    img.onload = () => { imgRef.current = img; };
    img.src = initialImage;
  }, [initialImage]);

  const resetTransform = () => { setZoom(1); setRotation(0); setPos({ x: 0, y: 0 }); };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setImageSrc(src);
      resetTransform();
      const img = new Image();
      img.onload = () => { imgRef.current = img; };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - pos.x, y: clientY - pos.y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging || !imgRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPos({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  }, [dragging, dragStart]);

  const handleMouseUp = () => setDragging(false);

  // Zoom com a roda do mouse para mais precisão no encaixe
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(4, Math.max(0.3, z - e.deltaY * 0.001)));
  };

  const handleSave = () => {
    if (!imgRef.current || !canvasRef.current || !frameRef.current) return;
    setSaving(true);

    const img = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setSaving(false); return; }

    // Dimensões reais (em pixels) do quadro de recorte exibido na tela.
    const frameRect = frameRef.current.getBoundingClientRect();
    const frameW = frameRect.width;
    const frameH = frameRect.height;

    // Saída em alta resolução, mantendo exatamente a mesma proporção do quadro.
    const OUTPUT_LONG_EDGE = 1400;
    const outputScale = OUTPUT_LONG_EDGE / Math.max(frameW, frameH);
    const outputW = Math.round(frameW * outputScale);
    const outputH = Math.round(frameH * outputScale);
    canvas.width = outputW;
    canvas.height = outputH;

    // A imagem é exibida dentro do quadro com "object-contain" (encaixe proporcional)
    // e depois sofre o transform do usuário (arrastar, zoom, girar) — replicamos
    // exatamente essa mesma matemática aqui para que o que o usuário vê seja
    // exatamente o que é exportado (encaixe correto, sem corte incorreto).
    const containScale = Math.min(frameW / img.width, frameH / img.height);
    const displayedW = img.width * containScale;
    const displayedH = img.height * containScale;

    ctx.save();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, outputW, outputH);
    ctx.translate(outputW / 2 + pos.x * outputScale, outputH / 2 + pos.y * outputScale);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.drawImage(
      img,
      -(displayedW * outputScale) / 2,
      -(displayedH * outputScale) / 2,
      displayedW * outputScale,
      displayedH * outputScale
    );
    ctx.restore();

    onSave(canvas.toDataURL('image/jpeg', 0.95));
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-zinc-900 rounded-3xl w-full max-w-md overflow-hidden border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <button onClick={close} className="p-2 text-zinc-400 hover:text-white"><X className="h-4 w-4" /></button>
          <p className="text-xs font-bold text-white">{title}</p>
          <button onClick={handleSave} disabled={!imageSrc || saving} className="flex items-center gap-1 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-bold disabled:opacity-30 active:scale-95">
            <Check className="h-3 w-3" /> Aplicar
          </button>
        </div>

        {!imageSrc ? (
          <label className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] cursor-pointer hover:border-blue-500/50 m-5">
            <Camera className="h-10 w-10 text-zinc-600 mb-3" />
            <p className="text-sm font-bold text-white">Escolher Imagem Original</p>
            {helperText && <p className="text-[11px] text-zinc-500 mt-1.5 px-6 text-center">{helperText}</p>}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} ref={fileInputRef} />
          </label>
        ) : (
          <div className="p-5">
            <div
              ref={frameRef}
              className="relative w-full rounded-2xl overflow-hidden bg-zinc-800 cursor-move select-none max-h-[65vh] mx-auto"
              style={{
                aspectRatio: aspect,
              }}
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp}
              onWheel={handleWheel}>
              <img src={imageSrc} className="absolute w-full h-full object-contain pointer-events-none" style={{
                transform: `translate(${pos.x}px, ${pos.y}px) rotate(${rotation}deg) scale(${zoom})`,
                transformOrigin: 'center'
              }} draggable={false} />

              {/* Grade de composição (regra dos terços) para encaixe mais preciso */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none opacity-40">
                  <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white" />
                  <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white" />
                  <div className="absolute top-1/3 left-0 right-0 h-px bg-white" />
                  <div className="absolute top-2/3 left-0 right-0 h-px bg-white" />
                </div>
              )}
              <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/20 rounded-2xl" />
            </div>

            {helperText && (
              <p className="text-[10px] text-zinc-500 mt-2 text-center">{helperText}</p>
            )}

            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <ZoomOut className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <input
                  type="range" min={0.3} max={4} step={0.01} value={zoom}
                  onChange={e => setZoom(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <ZoomIn className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span className="text-[10px] text-zinc-400 font-mono w-10 text-right shrink-0">{Math.round(zoom * 100)}%</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-2.5 rounded-2xl bg-white/5 text-zinc-400 hover:bg-white/10" title="Girar 90°"><RotateCw className="h-4 w-4" /></button>
                  <button
                    onClick={() => setShowGrid(v => !v)}
                    className={`p-2.5 rounded-2xl transition-colors ${showGrid ? 'bg-blue-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
                    title="Alternar grade de composição"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </button>
                </div>
                <button onClick={resetTransform} className="text-xs text-zinc-500 hover:text-white">Resetar</button>
                <button onClick={() => fileInputRef.current?.click()} className="text-xs text-blue-400 hover:text-blue-300">Trocar Imagem</button>
              </div>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
      </div>
    </div>
  );
}
