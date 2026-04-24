// @ts-nocheck
"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScanLine, Package, X, Plus, Minus, Camera, CameraOff, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { Product } from '../types';

interface BarcodeScannerProps {
  products: Product[];
  onUpdateStock: (productId: string, newStock: number) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ products, onUpdateStock }) => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [stockAdjustment, setStockAdjustment] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<any>(null);

  const lookupProduct = useCallback((code: string) => {
    const found = products.find(
      p => p.barcode === code || p.sku?.toLowerCase() === code.toLowerCase() || p.id === code
    );
    setScanResult(code);
    setMatchedProduct(found || null);
    setStockAdjustment(0);
    setSuccessMessage('');

    // Stop scanning after a match
    if (html5QrRef.current) {
      try {
        html5QrRef.current.stop().catch(() => {});
      } catch { }
      setIsScanning(false);
    }
  }, [products]);

  const startScanner = async () => {
    setCameraError('');
    setIsScanning(true);
    setScanResult(null);
    setMatchedProduct(null);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      if (!scannerRef.current) return;

      const scanner = new Html5Qrcode('barcode-reader');
      html5QrRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 300, height: 150 },
          aspectRatio: 1.5,
        },
        (decodedText: string) => {
          lookupProduct(decodedText);
        },
        () => {} // ignore errors during scanning
      );
    } catch (err: any) {
      setCameraError(err?.message || 'Camera access denied. Try using manual entry.');
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (html5QrRef.current) {
      try {
        html5QrRef.current.stop().catch(() => {});
      } catch {}
    }
    setIsScanning(false);
  };

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      lookupProduct(manualCode.trim());
    }
  };

  const handleAdjustStock = (delta: number) => {
    setStockAdjustment(prev => prev + delta);
  };

  const handleApplyAdjustment = () => {
    if (matchedProduct && stockAdjustment !== 0) {
      const newStock = Math.max(0, matchedProduct.stock + stockAdjustment);
      onUpdateStock(matchedProduct.id, newStock);
      setSuccessMessage(`Stock updated: ${matchedProduct.stock} → ${newStock}`);
      setMatchedProduct({ ...matchedProduct, stock: newStock });
      setStockAdjustment(0);
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        try { html5QrRef.current.stop().catch(() => {}); } catch {}
      }
    };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          Barcode Scanner <ScanLine className="w-7 h-7 text-purple-400" />
        </h1>
        <p className="text-muted-foreground mt-1">Scan product barcodes for instant stock lookup and adjustment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Panel */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-purple-400" />
              <h3 className="font-semibold text-foreground text-sm">Camera Scanner</h3>
            </div>
            <button
              onClick={isScanning ? stopScanner : startScanner}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isScanning
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                  : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20'
              }`}
            >
              {isScanning ? 'Stop' : 'Start Camera'}
            </button>
          </div>

          <div className="p-6">
            {/* Camera viewport */}
            <div
              id="barcode-reader"
              ref={scannerRef}
              className={`w-full aspect-video rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                isScanning
                  ? 'border-purple-500/40 shadow-[0_0_30px_rgba(167,139,250,0.15)]'
                  : 'border-border'
              }`}
              style={{ display: isScanning ? 'block' : 'none' }}
            />

            {!isScanning && (
              <div className="w-full aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-black/30">
                {cameraError ? (
                  <>
                    <CameraOff className="w-10 h-10 text-gray-600 mb-3" />
                    <p className="text-sm text-gray-500 text-center px-6">{cameraError}</p>
                  </>
                ) : (
                  <>
                    <ScanLine className="w-12 h-12 text-gray-600 mb-3" />
                    <p className="text-sm text-gray-500">Click "Start Camera" to begin scanning</p>
                    <p className="text-xs text-gray-600 mt-1">Or use manual entry below</p>
                  </>
                )}
              </div>
            )}

            {/* Manual Entry */}
            <form onSubmit={handleManualLookup} className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  placeholder="Enter barcode, SKU, or product ID..."
                  className="w-full bg-background border border-border rounded-lg py-2.5 pl-9 pr-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Lookup
              </button>
            </form>
          </div>
        </div>

        {/* Product Card */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-400" />
              Product Info
            </h3>
          </div>

          <div className="p-6">
            {!scanResult && (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <Package className="w-12 h-12 text-gray-700 mb-3" />
                <p className="text-sm text-gray-500">Scan a barcode or enter a code</p>
                <p className="text-xs text-gray-600 mt-1">Product details will appear here</p>
              </div>
            )}

            {scanResult && !matchedProduct && (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                  <AlertCircle className="w-7 h-7 text-red-400" />
                </div>
                <p className="text-sm font-medium text-red-400">Product Not Found</p>
                <p className="text-xs text-gray-500 mt-2">No match for code: <span className="font-mono text-gray-400">{scanResult}</span></p>
              </div>
            )}

            {matchedProduct && (
              <div className="space-y-5">
                {/* Product Details */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{matchedProduct.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="font-mono">SKU: {matchedProduct.sku}</span>
                      <span>|</span>
                      <span>{matchedProduct.category}</span>
                    </div>
                  </div>
                </div>

                {/* Stock Info Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-muted/30 border border-border text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Current Stock</p>
                    <p className={`text-lg font-bold ${
                      matchedProduct.stock < matchedProduct.reorderLevel ? 'text-amber-400' : 'text-purple-400'
                    }`}>{matchedProduct.stock}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Reorder Level</p>
                    <p className="text-lg font-bold text-foreground">{matchedProduct.reorderLevel}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Price</p>
                    <p className="text-lg font-bold text-foreground">${matchedProduct.price}</p>
                  </div>
                </div>

                {/* Stock Adjustment */}
                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                  <p className="text-xs font-medium text-purple-300 mb-3">Quick Stock Adjustment</p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => handleAdjustStock(-10)}
                      className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium border border-red-500/20"
                    >
                      -10
                    </button>
                    <button
                      onClick={() => handleAdjustStock(-1)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className={`text-2xl font-bold min-w-[60px] text-center ${
                      stockAdjustment > 0 ? 'text-purple-400' : stockAdjustment < 0 ? 'text-red-400' : 'text-foreground'
                    }`}>
                      {stockAdjustment > 0 ? '+' : ''}{stockAdjustment}
                    </span>
                    <button
                      onClick={() => handleAdjustStock(1)}
                      className="p-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors border border-purple-500/20"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAdjustStock(10)}
                      className="px-3 py-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors text-sm font-medium border border-purple-500/20"
                    >
                      +10
                    </button>
                  </div>

                  {stockAdjustment !== 0 && (
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        New stock: {Math.max(0, matchedProduct.stock + stockAdjustment)}
                      </span>
                      <button
                        onClick={handleApplyAdjustment}
                        className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {successMessage && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-purple-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {successMessage}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Override html5-qrcode styles */}
      <style>{`
        #barcode-reader video { border-radius: 8px; }
        #barcode-reader__dashboard { display: none !important; }
        #barcode-reader__status_span { display: none !important; }
        #barcode-reader__header_message { display: none !important; }
        #barcode-reader img[alt="Info icon"] { display: none !important; }
        #barcode-reader__dashboard_section { display: none !important; }
        #barcode-reader { border: none !important; }
      `}</style>
    </div>
  );
};
