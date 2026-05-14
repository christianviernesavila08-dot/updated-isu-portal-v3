import React, { useRef, useEffect } from 'react';
import SignaturePad from 'signature_pad';
import { Button } from './ui/Button';

interface SignatureInputProps {
  onSave: (base64: string) => void;
  onClear: () => void;
}

export function SignatureInput({ onSave, onClear }: SignatureInputProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      signaturePadRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgb(249, 250, 251)',
      });
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (canvasRef.current && signaturePadRef.current) {
          const { width } = entry.contentRect;
          // Maintain aspect ratio or fixed height
          canvasRef.current.width = width;
          canvasRef.current.height = 200;
          signaturePadRef.current.clear(); // Clear on resize to avoid distortion
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const handleClear = () => {
    signaturePadRef.current?.clear();
    onClear();
  };

  const handleSave = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      onSave(signaturePadRef.current.toDataURL());
    }
  };

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
        <canvas
          id="signature-canvas"
          ref={canvasRef}
          height={200}
          className="w-full h-48 cursor-crosshair"
        />
      </div>
      <div className="flex gap-2">
        <Button
          id="clear-signature"
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
        >
          Clear
        </Button>
        <Button
          id="save-signature"
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleSave}
        >
          Confirm Signature
        </Button>
      </div>
    </div>
  );
}
