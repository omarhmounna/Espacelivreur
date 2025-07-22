import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Camera, X, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => Promise<string>;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScan }) => {
  const { t } = useLanguage();
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [scanCooldown, setScanCooldown] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<any>(null);
  const scanningRef = useRef<boolean>(false);

  // تشغيل الأصوات المحسنة
  const playSound = (type: 'success' | 'error' | 'warning') => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === 'success') {
        // صوت نجاح محسن - أوضح وأعلى مع نغمة أكثر وضوحاً
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1300, audioContext.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(1600, audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.7, audioContext.currentTime); // رفع الصوت
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } else if (type === 'error') {
        // صوت خطأ - نغمة هابطة
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.6);
      } else {
        // صوت تحذير - بيب قصير
        oscillator.type = 'triangle';
        oscillator.frequency.value = 600;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      }
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const handleScanResult = async (code: string) => {
    // منع المسح المتكرر للكود نفسه
    if (scanCooldown || code === lastScannedCode) {
      return;
    }

    console.log('Processing scanned code:', code);
    setLastScannedCode(code);
    setScanCooldown(true);
    
    // إزالة فترة التهدئة بعد ثانية واحدة
    setTimeout(() => {
      setScanCooldown(false);
      setLastScannedCode('');
    }, 1000);

    const result = await onScan(code);
    
    if (result === 'success') {
      playSound('success');
    } else if (result === 'not-found') {
      playSound('error');
    } else {
      playSound('warning');
    }

    stopScanning();
    onClose();
  };

  const handleManualScanResult = async (code: string) => {
    if (!code.trim()) return;
    
    console.log('Manual code entered:', code);
    const result = await onScan(code);
    
    if (result === 'success') {
      playSound('success');
    } else if (result === 'not-found') {
      playSound('error');
    } else {
      playSound('warning');
    }

    setManualCode('');
    // لا نغلق الماسح تلقائياً عند الإدخال اليدوي
  };

  const startCamera = async () => {
    try {
      setCameraError('');
      setIsScanning(true);
      scanningRef.current = true;

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // بدء المسح باستخدام ZXing
        startZXingScanning();
      }
    } catch (error) {
      console.error('Camera error:', error);
      setIsScanning(false);
      scanningRef.current = false;
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setCameraError('تم رفض الإذن للوصول إلى الكاميرا. يرجى السماح بالوصول.');
          playSound('error');
        } else if (error.name === 'NotFoundError') {
          setCameraError('لم يتم العثور على كاميرا في هذا الجهاز.');
          playSound('error');
        } else {
          setCameraError('خطأ في الوصول إلى الكاميرا: ' + error.message);
          playSound('error');
        }
      }
    }
  };

  const startZXingScanning = async () => {
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/library');
      readerRef.current = new BrowserMultiFormatReader();
      
      if (videoRef.current && scanningRef.current) {
        readerRef.current.decodeFromVideoDevice(undefined, videoRef.current, (result: any, error: any) => {
          if (result && scanningRef.current) {
            const scannedCode = result.getText();
            handleScanResult(scannedCode);
          }
          // تجاهل أخطاء عدم الوجود لتجنب الرسائل المتكررة
        });
      }
    } catch (error) {
      console.error('ZXing error:', error);
      setCameraError('خطأ في مكتبة المسح. جرب الإدخال اليدوي.');
      playSound('error');
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    scanningRef.current = false;
    
    if (readerRef.current) {
      try {
        readerRef.current.reset();
      } catch (error) {
        console.log('Reader reset error:', error);
      }
      readerRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleManualScanResult(manualCode.trim());
    }
  };

  const handleClose = () => {
    stopScanning();
    setManualCode('');
    setCameraError('');
    setLastScannedCode('');
    setScanCooldown(false);
    onClose();
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    playSound('warning'); // تشغيل صوت تجريبي
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopScanning();
      setManualCode('');
      setCameraError('');
      setLastScannedCode('');
      setScanCooldown(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md animate-scale-in">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-right">{t('barcode_scanner')}</DialogTitle>
            <Button
              onClick={toggleSound}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-green-600" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Manual Input */}
          <div className="space-y-4 animate-fade-in">
            <h4 className="font-medium text-right text-gray-800">{t('order_code')}</h4>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Button 
                type="submit" 
                variant="default"
                disabled={!manualCode.trim()}
                className="px-6 bg-blue-600 hover:bg-blue-700 transition-all duration-200"
              >
                {t('search')}
              </Button>
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder={t('order_code')}
                className="flex-1 text-right border-2 border-gray-200 focus:border-blue-400 transition-colors duration-200"
                autoComplete="off"
                inputMode="text"
                dir="rtl"
              />
            </form>
          </div>

          {/* Camera Scanner */}
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h4 className="font-medium text-right text-gray-800">{t('scan_barcode')}</h4>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden hover:border-blue-300 transition-colors duration-200">
              {isScanning ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 object-cover bg-black rounded-lg"
                    autoPlay
                    muted
                    playsInline
                  />
                  
                  {/* إطار المسح المتحرك */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-green-400 rounded-lg animate-pulse">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg animate-pulse"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg animate-pulse"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg animate-pulse"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg animate-pulse"></div>
                      
                      {/* خط المسح المتحرك */}
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"
                           style={{
                             animation: 'scanning 2s ease-in-out infinite',
                             transform: 'translateY(0)'
                           }}></div>
                    </div>
                    
                    {/* حالة التهدئة */}
                    {scanCooldown && (
                      <div className="absolute top-4 left-4 bg-yellow-500 bg-opacity-90 text-white px-3 py-1 rounded-lg text-xs animate-fade-in">
                        ⏳ {t('scan_instruction')}
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <Button
                      onClick={stopScanning}
                      variant="destructive"
                      size="sm"
                      className="gap-2 bg-red-600 hover:bg-red-700 transition-all duration-200 hover-scale"
                    >
                      <X className="h-4 w-4" />
                      {t('close')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center space-y-4">
                  <div className="relative">
                    <QrCode className="h-16 w-16 text-gray-400 mx-auto hover-scale transition-transform duration-200" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 font-medium">{t('scan_barcode')}</p>
                    <p className="text-xs text-gray-500">{t('scan_instruction')}</p>
                  </div>
                  <Button
                    onClick={startCamera}
                    className="gap-2 bg-green-600 hover:bg-green-700 transition-all duration-200 hover-scale"
                  >
                    <Camera className="h-4 w-4" />
                    {t('scan_barcode')}
                  </Button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {cameraError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-right flex-1">
                    <h5 className="font-medium text-red-900 mb-1">⚠️ {t('error')}</h5>
                    <p className="text-sm text-red-800">{cameraError}</p>
                    <p className="text-xs text-red-600 mt-2">💡 {t('camera_permission')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between w-full">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="hover-scale transition-all duration-200"
            >
              {t('close')}
            </Button>
            <div className="text-xs text-gray-500">
              {soundEnabled ? '🔊' : '🔇'}
            </div>
          </div>
        </DialogFooter>

        {/* CSS للرسوم المتحركة المخصصة */}
        <style>{`
          @keyframes scanning {
            0% { transform: translateY(0); }
            50% { transform: translateY(128px); }
            100% { transform: translateY(0); }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;