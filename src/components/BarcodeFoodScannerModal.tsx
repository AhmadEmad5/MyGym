import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Barcode, Camera, Zap, Check, AlertCircle, 
  Loader2, Plus, Minus, Search, RefreshCw, Star, Trash2 
} from 'lucide-react';
import { MealRecord, MealType } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import { generateGeminiJson } from '../lib/gemini';

interface BarcodeFoodScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMeal: (meal: Omit<MealRecord, 'id'>) => void;
  defaultMealType?: MealType;
}

interface ScannedProduct {
  barcode: string;
  title: string;
  brand?: string;
  servingSize?: string;
  servingWeightGrams?: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatsPerServing: number;
  imageUrl?: string;
}

export interface SavedBarcodeProduct extends ScannedProduct {
  savedAt: number;
}

const FAVORITES_STORAGE_KEY = 'forma_favorite_barcode_foods';

const SAMPLE_GYM_FAVORITES: SavedBarcodeProduct[] = [
  {
    barcode: '748927028645',
    title: 'Gold Standard 100% Whey Protein',
    brand: 'Optimum Nutrition',
    servingSize: '1 scoop (31g)',
    servingWeightGrams: 31,
    caloriesPerServing: 120,
    proteinPerServing: 24,
    carbsPerServing: 3,
    fatsPerServing: 1.5,
    caloriesPer100g: 387,
    proteinPer100g: 77.4,
    carbsPer100g: 9.7,
    fatsPer100g: 4.8,
    savedAt: Date.now() - 100000
  },
  {
    barcode: '6281007010012',
    title: 'Greek Yogurt 0% Fat',
    brand: 'Nada',
    servingSize: '1 cup (160g)',
    servingWeightGrams: 160,
    caloriesPerServing: 96,
    proteinPerServing: 16,
    carbsPerServing: 6,
    fatsPerServing: 0,
    caloriesPer100g: 60,
    proteinPer100g: 10,
    carbsPer100g: 3.8,
    fatsPer100g: 0,
    savedAt: Date.now() - 50000
  }
];

function loadFavoriteFoods(): SavedBarcodeProduct[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(SAMPLE_GYM_FAVORITES));
      return SAMPLE_GYM_FAVORITES;
    }
    return JSON.parse(raw);
  } catch {
    return SAMPLE_GYM_FAVORITES;
  }
}

function persistFavoriteFoods(list: SavedBarcodeProduct[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Could not save favorites to localStorage:', e);
  }
}

export function BarcodeFoodScannerModal({
  isOpen,
  onClose,
  onSaveMeal,
  defaultMealType = 'snack'
}: BarcodeFoodScannerModalProps) {
  const { t, isRTL } = useTranslation();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [servingCount, setServingCount] = useState<number>(1);
  const [portionMode, setPortionMode] = useState<'serving' | 'grams'>('serving');
  const [customGrams, setCustomGrams] = useState<number>(100);
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [activeTab, setActiveTab] = useState<'scan' | 'favorites'>('scan');
  const [favoriteFoods, setFavoriteFoods] = useState<SavedBarcodeProduct[]>(() => loadFavoriteFoods());

  const toggleFavorite = (product: ScannedProduct) => {
    gymAudio.triggerSubtleHaptic([15, 20]);
    setFavoriteFoods(prev => {
      const exists = prev.some(f => f.barcode === product.barcode);
      let updated: SavedBarcodeProduct[];
      if (exists) {
        updated = prev.filter(f => f.barcode !== product.barcode);
      } else {
        const item: SavedBarcodeProduct = { ...product, savedAt: Date.now() };
        updated = [item, ...prev];
      }
      persistFavoriteFoods(updated);
      return updated;
    });
  };

  const deleteFavorite = (barcode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    gymAudio.triggerSubtleHaptic([25]);
    setFavoriteFoods(prev => {
      const updated = prev.filter(f => f.barcode !== barcode);
      persistFavoriteFoods(updated);
      return updated;
    });
  };

  const selectFavorite = (product: SavedBarcodeProduct) => {
    gymAudio.triggerSubtleHaptic([20]);
    setScannedProduct(product);
    setCustomGrams(product.servingWeightGrams || 100);
    setSearchError(null);
    stopCamera();
  };

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Fetch product information by barcode from Open Food Facts with Gemini fallback
  const lookupBarcode = useCallback(async (code: string) => {
    const cleanCode = code.trim().replace(/\D/g, '');
    if (!cleanCode || isSearching) return;

    setIsSearching(true);
    setSearchError(null);
    gymAudio.triggerSubtleHaptic([30, 40]);

    try {
      // 1. Try Open Food Facts API (Worldwide database for food and supplements)
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json`, {
        headers: { 'User-Agent': 'FORMA-FitnessTracker/1.0' }
      });
      const data = await res.json();

      if (data && data.status === 1 && data.product) {
        const p = data.product;
        const nut = p.nutriments || {};

        const title = p.product_name_ar || p.product_name || p.product_name_en || (isRTL ? 'منتج غذائي معبأ' : 'Packaged Food Item');
        const brand = p.brands || p.brand_owner || '';
        const servingSize = p.serving_size || '';

        // Extract serving weight in grams if available
        let servingGrams = 100;
        if (p.serving_quantity) {
          servingGrams = Number(p.serving_quantity) || 100;
        } else if (servingSize) {
          const match = servingSize.match(/(\d+(?:\.\d+)?)\s*g/i);
          if (match) servingGrams = parseFloat(match[1]) || 100;
        }

        const cal100 = Math.round(Number(nut['energy-kcal_100g'] ?? nut['energy-kcal'] ?? 0));
        const pro100 = Math.round(Number(nut.proteins_100g ?? 0) * 10) / 10;
        const carb100 = Math.round(Number(nut.carbohydrates_100g ?? 0) * 10) / 10;
        const fat100 = Math.round(Number(nut.fat_100g ?? 0) * 10) / 10;

        const calServing = Math.round(Number(nut['energy-kcal_serving'] ?? (cal100 * servingGrams / 100)));
        const proServing = Math.round(Number(nut.proteins_serving ?? (pro100 * servingGrams / 100)) * 10) / 10;
        const carbServing = Math.round(Number(nut.carbohydrates_serving ?? (carb100 * servingGrams / 100)) * 10) / 10;
        const fatServing = Math.round(Number(nut.fat_serving ?? (fat100 * servingGrams / 100)) * 10) / 10;

        const img = p.image_front_url || p.image_url || undefined;

        setScannedProduct({
          barcode: cleanCode,
          title,
          brand,
          servingSize: servingSize || `${servingGrams}g`,
          servingWeightGrams: servingGrams,
          caloriesPer100g: cal100,
          proteinPer100g: pro100,
          carbsPer100g: carb100,
          fatsPer100g: fat100,
          caloriesPerServing: calServing || cal100,
          proteinPerServing: proServing || pro100,
          carbsPerServing: carbServing || carb100,
          fatsPerServing: fatServing || fat100,
          imageUrl: img
        });
        setCustomGrams(servingGrams);
        gymAudio.playSetCompleteChime();
        gymAudio.triggerDualPulseHaptic();
        stopCamera();
        return;
      }

      // 2. Fallback to Gemini AI if not found in Open Food Facts
      const prompt = `Identify packaged food, snack, or gym supplement with barcode or UPC: "${cleanCode}".
Estimate nutritional facts per 1 serving and per 100g.
Respond ONLY with valid JSON:
{
  "title": "Product Name",
  "brand": "Brand",
  "servingSize": "1 bar (60g)",
  "servingWeightGrams": 60,
  "caloriesPerServing": 210,
  "proteinPerServing": 20,
  "carbsPerServing": 22,
  "fatsPerServing": 7,
  "caloriesPer100g": 350,
  "proteinPer100g": 33,
  "carbsPer100g": 36,
  "fatsPer100g": 11
}`;

      const aiData = await generateGeminiJson<any>({ prompt });
      if (aiData && aiData.title) {
        setScannedProduct({
          barcode: cleanCode,
          title: aiData.title,
          brand: aiData.brand || '',
          servingSize: aiData.servingSize || '100g',
          servingWeightGrams: aiData.servingWeightGrams || 100,
          caloriesPer100g: Number(aiData.caloriesPer100g) || 200,
          proteinPer100g: Number(aiData.proteinPer100g) || 15,
          carbsPer100g: Number(aiData.carbsPer100g) || 20,
          fatsPer100g: Number(aiData.fatsPer100g) || 5,
          caloriesPerServing: Number(aiData.caloriesPerServing) || 200,
          proteinPerServing: Number(aiData.proteinPerServing) || 15,
          carbsPerServing: Number(aiData.carbsPerServing) || 20,
          fatsPerServing: Number(aiData.fatsPerServing) || 5
        });
        setCustomGrams(aiData.servingWeightGrams || 100);
        gymAudio.playSetCompleteChime();
        gymAudio.triggerDualPulseHaptic();
        stopCamera();
        return;
      }

      throw new Error('Not found');
    } catch {
      setSearchError(isRTL ? 'لم يتم العثور على المنتج. يمكنك كتابة اسمه وسعراته يدوياً أو تجربة رقم آخر.' : 'Product not found. Try entering another barcode or log manually.');
    } finally {
      setIsSearching(false);
    }
  }, [isRTL, isSearching, stopCamera]);

  // Start live camera stream and scan loop
  useEffect(() => {
    if (!isOpen || scannedProduct || activeTab !== 'scan') {
      stopCamera();
      return;
    }

    let isMounted = true;

    async function initCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setHasCameraPermission(false);
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        // Initialize BarcodeDetector if natively supported by browser/Capacitor
        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code']
          });

          const scanFrame = async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) {
              scanLoopRef.current = requestAnimationFrame(scanFrame);
              return;
            }

            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                const detectedCode = barcodes[0].rawValue;
                lookupBarcode(detectedCode);
                return;
              }
            } catch {
              // Ignore occasional frame decode errors
            }

            scanLoopRef.current = requestAnimationFrame(scanFrame);
          };

          scanLoopRef.current = requestAnimationFrame(scanFrame);
        }
      } catch (err) {
        console.warn('Camera stream error:', err);
        if (isMounted) setHasCameraPermission(false);
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, scannedProduct, lookupBarcode, stopCamera]);

  // Flashlight / Torch toggle
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchOn(nextState);
        gymAudio.triggerSubtleHaptic([20]);
      } catch (e) {
        console.warn('Torch not supported:', e);
      }
    }
  };

  const handleClose = () => {
    stopCamera();
    setScannedProduct(null);
    setSearchError(null);
    setManualBarcodeInput('');
    setServingCount(1);
    onClose();
  };

  if (!isOpen) return null;

  // Compute effective macros based on serving multiplier or exact grams
  const effectiveGrams = portionMode === 'serving' 
    ? (scannedProduct?.servingWeightGrams || 100) * servingCount
    : customGrams;

  const effectiveCalories = scannedProduct ? (
    portionMode === 'serving'
      ? Math.round(scannedProduct.caloriesPerServing * servingCount)
      : Math.round((scannedProduct.caloriesPer100g * customGrams) / 100)
  ) : 0;

  const effectiveProtein = scannedProduct ? (
    portionMode === 'serving'
      ? Math.round(scannedProduct.proteinPerServing * servingCount * 10) / 10
      : Math.round(((scannedProduct.proteinPer100g * customGrams) / 100) * 10) / 10
  ) : 0;

  const effectiveCarbs = scannedProduct ? (
    portionMode === 'serving'
      ? Math.round(scannedProduct.carbsPerServing * servingCount * 10) / 10
      : Math.round(((scannedProduct.carbsPer100g * customGrams) / 100) * 10) / 10
  ) : 0;

  const effectiveFats = scannedProduct ? (
    portionMode === 'serving'
      ? Math.round(scannedProduct.fatsPerServing * servingCount * 10) / 10
      : Math.round(((scannedProduct.fatsPer100g * customGrams) / 100) * 10) / 10
  ) : 0;

  const handleSaveScannedMeal = () => {
    if (!scannedProduct) return;

    onSaveMeal({
      title: `${scannedProduct.title}${scannedProduct.brand ? ` (${scannedProduct.brand})` : ''}`,
      date: new Date().toISOString(),
      mealType,
      calories: effectiveCalories,
      protein: effectiveProtein,
      carbs: effectiveCarbs,
      fats: effectiveFats,
      imageUrl: scannedProduct.imageUrl,
      aiNotes: isRTL 
        ? `مسح باركود: ${scannedProduct.barcode} • الحصة: ${effectiveGrams}g`
        : `Barcode scan: ${scannedProduct.barcode} • Portion: ${effectiveGrams}g`,
      ingredients: [{
        name: scannedProduct.title,
        portion: `${effectiveGrams}g`,
        calories: effectiveCalories
      }]
    });

    gymAudio.playCelebrationFanfare();
    gymAudio.triggerDualPulseHaptic();
    handleClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem',
        direction: isRTL ? 'rtl' : 'ltr'
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '24px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.15rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-tertiary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}>
              <Barcode size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {isRTL ? 'ماسح الباركود الغذائي' : 'Barcode Food Scanner'}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isRTL ? 'وجه الكاميرا نحو باركود المنتج للتعرف الفوري' : 'Point camera at product barcode for instant macros'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon btn-ghost"
            onClick={handleClose}
            style={{ color: 'var(--text-muted)', padding: '0.4rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* TAB SWITCHER (when browsing / before selecting product) */}
          {!scannedProduct && (
            <div style={{
              display: 'flex',
              gap: '0.45rem',
              padding: '0.25rem',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '14px',
              border: '1px solid var(--border-color)'
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('scan')}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.75rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'scan' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                  color: activeTab === 'scan' ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 750,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'scan' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Camera size={15} />
                <span>{isRTL ? 'مسح الكاميرا' : 'Live Camera'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setActiveTab('favorites');
                }}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.75rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'favorites' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                  color: activeTab === 'favorites' ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 750,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'favorites' ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Star size={15} fill={activeTab === 'favorites' ? '#ffffff' : 'none'} />
                <span>{isRTL ? 'منتجاتي المفضلة' : 'Favorite Foods'}</span>
                {favoriteFoods.length > 0 && (
                  <span style={{
                    backgroundColor: activeTab === 'favorites' ? 'rgba(0,0,0,0.3)' : 'rgba(245, 158, 11, 0.2)',
                    color: activeTab === 'favorites' ? '#fff' : '#f59e0b',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '999px',
                    fontSize: '0.68rem',
                    fontWeight: 800
                  }}>
                    {favoriteFoods.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* 1. CAMERA VIEWFINDER & SEARCH (Tab: 'scan') */}
          {!scannedProduct && activeTab === 'scan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{
                position: 'relative',
                width: '100%',
                height: '240px',
                borderRadius: '18px',
                overflow: 'hidden',
                backgroundColor: '#000',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
              }}>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: hasCameraPermission ? 'block' : 'none'
                  }}
                />

                {/* Laser scan line overlay */}
                {hasCameraPermission && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {/* Darkened corner overlay */}
                    <div style={{
                      position: 'absolute',
                      inset: '24px',
                      border: '2px solid rgba(16, 185, 129, 0.8)',
                      borderRadius: '14px',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)'
                    }}>
                      {/* Scanning vertical moving beam */}
                      <motion.div
                        animate={{ y: [0, 180, 0] }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                        style={{
                          width: '100%',
                          height: '2px',
                          background: 'linear-gradient(90deg, transparent, #10b981, #38bdf8, transparent)',
                          boxShadow: '0 0 12px #10b981'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Permission denied or loading state */}
                {!hasCameraPermission && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    gap: '0.75rem'
                  }}>
                    <Camera size={36} style={{ color: '#10b981' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>
                      {isRTL 
                        ? 'يرجى السماح بالوصول للكاميرا أو إدخال رقم الباركود يدوياً بالأسفل.' 
                        : 'Please grant camera access or enter the barcode manually below.'}
                    </p>
                  </div>
                )}

                {/* Flashlight button */}
                {hasCameraPermission && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: isRTL ? 'auto' : '12px',
                      left: isRTL ? '12px' : 'auto',
                      padding: '0.5rem',
                      borderRadius: '10px',
                      background: torchOn ? '#eab308' : 'rgba(0, 0, 0, 0.65)',
                      color: torchOn ? '#000' : '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      cursor: 'pointer'
                    }}
                    title={isRTL ? 'فلاش الكاميرا' : 'Flashlight'}
                  >
                    <Zap size={16} />
                  </button>
                )}
              </div>

              {/* Manual Barcode Input Fallback */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder={isRTL ? 'أو اكتب رقم الباركود (مثال: 6281007010012)' : 'Or type barcode (e.g. 041570054705)'}
                    value={manualBarcodeInput}
                    onChange={(e) => setManualBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') lookupBarcode(manualBarcodeInput);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      paddingLeft: isRTL ? '0.85rem' : '2.2rem',
                      paddingRight: isRTL ? '2.2rem' : '0.85rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  />
                  <Barcode
                    size={16}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      left: isRTL ? 'auto' : '0.75rem',
                      right: isRTL ? '0.75rem' : 'auto',
                      color: 'var(--text-muted)'
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => lookupBarcode(manualBarcodeInput)}
                  disabled={!manualBarcodeInput.trim() || isSearching}
                  style={{
                    padding: '0.65rem 1.15rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    color: '#fff'
                  }}
                >
                  {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  <span>{isRTL ? 'بحث' : 'Lookup'}</span>
                </button>
              </div>

              {/* Error Alert */}
              {searchError && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{searchError}</span>
                </div>
              )}
            </div>
          )}

          {/* 2. FAVORITES / RECENT FOODS LIST (Tab: 'favorites') */}
          {!scannedProduct && activeTab === 'favorites' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                  {isRTL ? 'اختر منتجك المعتاد للتسجيل بنقرة واحدة:' : 'Tap any frequent food to log in 1 tap:'}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 650 }}>
                  {isRTL ? '⭐ محفوظة محلياً' : '⭐ Saved Locally'}
                </span>
              </div>

              {favoriteFoods.length === 0 ? (
                <div style={{
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '16px',
                  border: '1px dashed var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <Star size={36} style={{ color: '#f59e0b', opacity: 0.6 }} />
                  <div>
                    <h4 style={{ margin: '0 0 0.3rem', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {isRTL ? 'لا توجد منتجات محفوظة بعد' : 'No saved foods yet'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: '280px' }}>
                      {isRTL 
                        ? 'امسح باركود أي منتج تريده بالكاميرا، ثم اضغط على زر النجمة ⭐ لحفظه هنا والوصول إليه بسرعة دائماً.'
                        : 'Scan any food barcode with your camera, then tap ⭐ to save it here for instant 1-tap access.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {favoriteFoods.map((item) => (
                    <motion.div
                      key={item.barcode}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectFavorite(item)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '14px',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      {/* Product Thumbnail */}
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '10px',
                            objectFit: 'contain',
                            backgroundColor: '#fff',
                            padding: '2px',
                            flexShrink: 0
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(245, 158, 11, 0.12)',
                          color: '#f59e0b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Barcode size={22} />
                        </div>
                      )}

                      {/* Title & Macros */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>
                          {item.brand || (isRTL ? 'منتج معتمد' : 'Verified')}
                        </div>
                        <h4 style={{
                          margin: '0.1rem 0 0.25rem',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.title}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '6px',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                            fontSize: '0.7rem',
                            fontWeight: 800
                          }}>
                            🔥 {item.caloriesPerServing} kcal
                          </span>
                          <span style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '6px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            fontSize: '0.7rem',
                            fontWeight: 800
                          }}>
                            🥩 {item.proteinPerServing}g {isRTL ? 'بروتين' : 'pro'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {item.servingSize || '100g'}
                          </span>
                        </div>
                      </div>

                      {/* Delete from Favorites */}
                      <button
                        type="button"
                        onClick={(e) => deleteFavorite(item.barcode, e)}
                        title={isRTL ? 'حذف من المفضلة' : 'Remove favorite'}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          padding: '0.4rem',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DETECTED PRODUCT & MACROS RESULT CARD */}
          {scannedProduct && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              {/* Product Hero Info */}
              <div style={{
                padding: '1rem',
                borderRadius: '16px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem'
              }}>
                {scannedProduct.imageUrl ? (
                  <img
                    src={scannedProduct.imageUrl}
                    alt={scannedProduct.title}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      objectFit: 'contain',
                      backgroundColor: '#fff',
                      padding: '4px'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Barcode size={32} />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>
                    {scannedProduct.brand || (isRTL ? 'منتج معتمد' : 'Verified Food')}
                  </span>
                  <h4 style={{ margin: '0.15rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {scannedProduct.title}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {isRTL ? `الباركود: ${scannedProduct.barcode}` : `UPC: ${scannedProduct.barcode}`}
                  </span>
                </div>

                {/* Favorite Toggle Button */}
                {(() => {
                  const isFav = favoriteFoods.some(f => f.barcode === scannedProduct.barcode);
                  return (
                    <button
                      type="button"
                      onClick={() => toggleFavorite(scannedProduct)}
                      title={isFav ? (isRTL ? 'إزالة من المفضلة' : 'Remove from Favorites') : (isRTL ? 'حفظ في المفضلة' : 'Save to Favorites')}
                      style={{
                        padding: '0.45rem 0.75rem',
                        borderRadius: '10px',
                        border: isFav ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid var(--border-color)',
                        background: isFav ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: isFav ? '#f59e0b' : 'var(--text-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.75rem',
                        fontWeight: 750,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Star size={15} fill={isFav ? '#f59e0b' : 'none'} />
                      <span>{isFav ? (isRTL ? 'في المفضلة ⭐' : 'Saved ⭐') : (isRTL ? 'حفظ للمفضلة' : 'Save')}</span>
                    </button>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => {
                    setScannedProduct(null);
                    setSearchError(null);
                  }}
                  className="btn-icon btn-ghost"
                  title={isRTL ? 'مسح منتج آخر' : 'Scan another'}
                  style={{ color: 'var(--text-muted)' }}
                >
                  <RefreshCw size={16} />
                </button>
              </div>

              {/* Portion & Quantity Stepper */}
              <div style={{
                padding: '1rem',
                borderRadius: '16px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {isRTL ? 'تحديد الكمية والحصة:' : 'Serving & Portion Size:'}
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setPortionMode('serving')}
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: portionMode === 'serving' ? '#10b981' : 'transparent',
                        color: portionMode === 'serving' ? '#fff' : 'var(--text-muted)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {isRTL ? 'بالحصة' : 'Per Serving'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPortionMode('grams')}
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: portionMode === 'grams' ? '#10b981' : 'transparent',
                        color: portionMode === 'grams' ? '#fff' : 'var(--text-muted)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {isRTL ? 'بالجرام' : 'Per Grams'}
                    </button>
                  </div>
                </div>

                {portionMode === 'serving' ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {scannedProduct.servingSize}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setServingCount(prev => Math.max(0.5, prev - 0.5));
                          gymAudio.triggerSubtleHaptic([15]);
                        }}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontSize: '1rem', fontWeight: 800, minWidth: '40px', textAlign: 'center' }}>
                        {servingCount}x
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setServingCount(prev => prev + 0.5);
                          gymAudio.triggerSubtleHaptic([15]);
                        }}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <input
                      type="number"
                      min="1"
                      max="2000"
                      value={customGrams}
                      onChange={(e) => setCustomGrams(Math.max(1, Number(e.target.value) || 0))}
                      style={{
                        flex: 1,
                        padding: '0.55rem 0.75rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.95rem',
                        fontWeight: 700
                      }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {isRTL ? 'جرام' : 'grams'}
                    </span>
                  </div>
                )}
              </div>

              {/* Dynamic Macro Triad Preview */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                textAlign: 'center'
              }}>
                <div style={{ padding: '0.75rem 0.5rem', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, display: 'block' }}>🔥 {t('calories')}</span>
                  <strong style={{ fontSize: '1.2rem', color: '#ef4444' }}>{effectiveCalories}</strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>kcal</span>
                </div>

                <div style={{ padding: '0.75rem 0.5rem', borderRadius: '12px', backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#06b6d4', fontWeight: 700, display: 'block' }}>🍗 {t('protein')}</span>
                  <strong style={{ fontSize: '1.2rem', color: '#06b6d4' }}>{effectiveProtein}</strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>g</span>
                </div>

                <div style={{ padding: '0.75rem 0.5rem', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700, display: 'block' }}>⚡ {t('carbs')}</span>
                  <strong style={{ fontSize: '1.2rem', color: '#f59e0b' }}>{effectiveCarbs}</strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>g</span>
                </div>

                <div style={{ padding: '0.75rem 0.5rem', borderRadius: '12px', backgroundColor: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.25)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#ec4899', fontWeight: 700, display: 'block' }}>🥑 {t('fats')}</span>
                  <strong style={{ fontSize: '1.2rem', color: '#ec4899' }}>{effectiveFats}</strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>g</span>
                </div>
              </div>

              {/* Meal Category Picker */}
              <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMealType(type)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.35rem',
                      borderRadius: '10px',
                      border: mealType === type ? '1px solid #10b981' : '1px solid var(--border-color)',
                      background: mealType === type ? 'rgba(16, 185, 129, 0.18)' : 'var(--bg-tertiary)',
                      color: mealType === type ? '#10b981' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {t(type as any)}
                  </button>
                ))}
              </div>

              {/* 1-Tap Save Button */}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveScannedMeal}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                  cursor: 'pointer'
                }}
              >
                <Check size={18} />
                <span>{isRTL ? `تسجيل الوجبة فوراً (${effectiveCalories} سعرة)` : `Log Meal (${effectiveCalories} kcal)`}</span>
              </button>
            </motion.div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
