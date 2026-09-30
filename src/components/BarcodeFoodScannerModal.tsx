import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Barcode, Camera, Zap, Check, AlertCircle, Loader2, Plus, Minus,
  Search, RefreshCw, Star, Trash2, ShieldAlert, ImageOff, WifiOff,
  Keyboard, ScanLine, PencilLine
} from 'lucide-react';
import { MealRecord, MealType } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import { generateGeminiJson } from '../lib/gemini';
import {
  ModalShell, InlineNumberField, UnitToggle, FieldError, StatusCallout,
  PrimaryAction, SecondaryAction, massToGrams, gramsToMass, type MassUnit
} from './AIMealVisionModal';

interface BarcodeFoodScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMeal: (meal: Omit<MealRecord, 'id'>) => void;
  defaultMealType?: MealType;
  onManualEntry?: () => void;
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
  source?: 'database' | 'ai';
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

type CameraState = 'unknown' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'busy';
type FailureKind = 'permission' | 'no-camera' | 'network' | 'not-found' | 'malformed' | 'no-detector' | null;
type LookupStage = 'idle' | 'database' | 'ai' | 'done';

export function BarcodeFoodScannerModal({
  isOpen,
  onClose,
  onSaveMeal,
  defaultMealType = 'snack',
  onManualEntry
}: BarcodeFoodScannerModalProps) {
  const { t, isRTL } = useTranslation();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const lookupGuard = useRef(false);

  const [cameraState, setCameraState] = useState<CameraState>('unknown');
  const [torchOn, setTorchOn] = useState(false);
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lookupStage, setLookupStage] = useState<LookupStage>('idle');
  const [searchError, setSearchError] = useState<FailureKind>(null);
  const [searchErrorDetail, setSearchErrorDetail] = useState<string | null>(null);

  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editErrors, setEditErrors] = useState<{ title?: string; macros?: string }>({});
  const [servingCount, setServingCount] = useState<number>(1);
  const [portionMode, setPortionMode] = useState<'serving' | 'grams'>('serving');
  const [customGrams, setCustomGrams] = useState<string>('100');
  const [massUnit, setMassUnit] = useState<MassUnit>('g');
  const [gramsError, setGramsError] = useState<string | undefined>(undefined);
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [activeTab, setActiveTab] = useState<'scan' | 'favorites'>('scan');
  const [favoriteFoods, setFavoriteFoods] = useState<SavedBarcodeProduct[]>(() => loadFavoriteFoods());

  const stopCamera = useCallback(() => {
    if (scanLoopRef.current !== null) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setTorchOn(false);
  }, []);

  const toggleFavorite = (product: ScannedProduct) => {
    gymAudio.triggerSubtleHaptic([15, 20]);
    setFavoriteFoods(prev => {
      const exists = prev.some(f => f.barcode === product.barcode);
      const updated = exists
        ? prev.filter(f => f.barcode !== product.barcode)
        : [{ ...product, savedAt: Date.now() }, ...prev];
      persistFavoriteFoods(updated);
      return updated;
    });
  };

  const deleteFavorite = (barcode: string, event: React.MouseEvent) => {
    event.stopPropagation();
    gymAudio.triggerSubtleHaptic([25]);
    setFavoriteFoods(prev => {
      const updated = prev.filter(f => f.barcode !== barcode);
      persistFavoriteFoods(updated);
      return updated;
    });
  };

  const applyProduct = useCallback((product: ScannedProduct) => {
    setScannedProduct(product);
    setCustomGrams(String(product.servingWeightGrams || 100));
    setServingCount(1);
    setPortionMode('serving');
    setIsEditingProduct(false);
    setEditErrors({});
    setGramsError(undefined);
    setSearchError(null);
    setSearchErrorDetail(null);
    setEditTitle(product.title);
    setEditBrand(product.brand ?? '');
    gymAudio.playSetCompleteChime();
    gymAudio.triggerDualPulseHaptic();
    stopCamera();
  }, [stopCamera]);

  const selectFavorite = (product: SavedBarcodeProduct) => {
    gymAudio.triggerSubtleHaptic([20]);
    applyProduct(product);
  };

  const lookupBarcode = useCallback(async (rawCode: string) => {
    const cleanCode = rawCode.trim().replace(/\D/g, '');
    if (!cleanCode || lookupGuard.current) return;
    if (cleanCode.length < 6) {
      setSearchError('malformed');
      setSearchErrorDetail(isRTL ? 'أدخل رقم باركود صحيح (6 أرقام على الأقل).' : 'Enter a valid barcode (at least 6 digits).');
      return;
    }

    lookupGuard.current = true;
    setIsSearching(true);
    setLookupStage('database');
    setSearchError(null);
    setSearchErrorDetail(null);
    gymAudio.triggerSubtleHaptic([30, 40]);

    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json`, {
        headers: { 'User-Agent': 'FORMA-FitnessTracker/1.0' }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(`Open Food Facts responded with ${res.status}`);
      }

      if (data && data.status === 1 && data.product) {
        const p = data.product;
        const nut = p.nutriments || {};

        const title = p.product_name_ar || p.product_name || p.product_name_en || (isRTL ? 'منتج غذائي معبأ' : 'Packaged Food Item');
        const brand = p.brands || p.brand_owner || '';
        const servingSize = p.serving_size || '';

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

        if (cal100 === 0 && pro100 === 0 && carb100 === 0 && fat100 === 0) {
          throw new Error('NO_NUTRITION_DATA');
        }

        applyProduct({
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
          imageUrl: p.image_front_url || p.image_url || undefined,
          source: 'database'
        });
        setLookupStage('done');
        return;
      }

      setLookupStage('ai');
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

      const aiData = await generateGeminiJson<Record<string, unknown>>({ prompt });
      const aiTitle = typeof aiData?.title === 'string' ? aiData.title.trim() : '';
      const num = (value: unknown) => {
        const n = Number(value);
        return Number.isFinite(n) && n >= 0 ? n : 0;
      };

      if (!aiTitle) throw new Error('EMPTY_AI_RESPONSE');

      const caloriesPer100g = num(aiData.caloriesPer100g);
      const proteinPer100g = num(aiData.proteinPer100g);
      const carbsPer100g = num(aiData.carbsPer100g);
      const fatsPer100g = num(aiData.fatsPer100g);
      const aiIncomplete = caloriesPer100g === 0 && proteinPer100g === 0 && carbsPer100g === 0 && fatsPer100g === 0;

      applyProduct({
        barcode: cleanCode,
        title: aiTitle,
        brand: typeof aiData.brand === 'string' ? aiData.brand : '',
        servingSize: typeof aiData.servingSize === 'string' ? aiData.servingSize : '100g',
        servingWeightGrams: num(aiData.servingWeightGrams) || 100,
        caloriesPer100g,
        proteinPer100g,
        carbsPer100g,
        fatsPer100g,
        caloriesPerServing: num(aiData.caloriesPerServing) || caloriesPer100g,
        proteinPerServing: num(aiData.proteinPerServing) || proteinPer100g,
        carbsPerServing: num(aiData.carbsPerServing) || carbsPer100g,
        fatsPerServing: num(aiData.fatsPerServing) || fatsPer100g,
        source: 'ai'
      });

      if (aiIncomplete) {
        setIsEditingProduct(true);
        setEditErrors({ macros: isRTL ? 'أدخل السعرات والماكروز بشكل صحيح' : 'Enter calories and macros' });
      }
      setLookupStage('done');
    } catch (err) {
      const message = (err as { message?: string })?.message || '';
      if (message === 'NO_NUTRITION_DATA') {
        setSearchError('not-found');
        setSearchErrorDetail(isRTL ? 'المنتج موجود لكن بدون جدول تغذية. سجّله يدوياً أو جرّب منتجاً آخر.' : 'This product exists but has no nutrition table. Log it manually or try another.');
      } else if (message === 'EMPTY_AI_RESPONSE') {
        setSearchError('malformed');
        setSearchErrorDetail(isRTL ? 'أعاد الذكاء الاصطناعي نتيجة فارغة. سجّل المنتج يدوياً بالأرقام من العبوة.' : 'The AI returned an empty result. Enter the numbers from the label manually.');
      } else if (/network|failed to fetch|timeout|offline|abort/i.test(message)) {
        setSearchError('network');
        setSearchErrorDetail(message);
      } else {
        setSearchError('not-found');
        setSearchErrorDetail(message);
      }
      setLookupStage('idle');
    } finally {
      setIsSearching(false);
      lookupGuard.current = false;
    }
  }, [applyProduct, isRTL]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    if (scannedProduct || activeTab !== 'scan') {
      stopCamera();
      return;
    }

    let isMounted = true;

    async function initCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (isMounted) {
          setCameraState('unavailable');
          setSearchError('no-camera');
        }
        return;
      }

      setCameraState('requesting');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });

        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        setCameraState('granted');

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        const Detector = (window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (source: CanvasImageSource) => Promise<{ rawValue?: string }[]> } }).BarcodeDetector;
        if (!Detector) {
          if (isMounted) setSearchError('no-detector');
          return;
        }

        const detector = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'] });

        const scanFrame = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            scanLoopRef.current = requestAnimationFrame(scanFrame);
            return;
          }
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              void lookupBarcode(barcodes[0].rawValue);
              return;
            }
          } catch {
            scanLoopRef.current = requestAnimationFrame(scanFrame);
            return;
          }
          scanLoopRef.current = requestAnimationFrame(scanFrame);
        };

        scanLoopRef.current = requestAnimationFrame(scanFrame);
      } catch (err) {
        if (!isMounted) return;
        const name = (err as { name?: string })?.name;
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setCameraState('denied');
          setSearchError('permission');
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          setCameraState('unavailable');
          setSearchError('no-camera');
        } else if (name === 'NotReadableError') {
          setCameraState('busy');
          setSearchError('no-camera');
        } else {
          setCameraState('unknown');
          setSearchError('no-camera');
        }
      }
    }

    void initCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, scannedProduct, activeTab, lookupBarcode, stopCamera]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextState = !torchOn;
      await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
        advanced: [{ torch: nextState }]
      });
      setTorchOn(nextState);
      gymAudio.triggerSubtleHaptic([20]);
    } catch {
      setTorchOn(false);
    }
  };

  const handleClose = useCallback(() => {
    stopCamera();
    setScannedProduct(null);
    setSearchError(null);
    setSearchErrorDetail(null);
    setManualBarcodeInput('');
    setServingCount(1);
    setIsEditingProduct(false);
    setEditErrors({});
    setActiveTab('scan');
    onClose();
  }, [onClose, stopCamera]);

  const effectiveGrams = portionMode === 'serving'
    ? (scannedProduct?.servingWeightGrams || 100) * servingCount
    : massToGrams(Number(customGrams) || 0, massUnit);

  const effectiveCalories = scannedProduct
    ? Math.round(portionMode === 'serving'
      ? scannedProduct.caloriesPerServing * servingCount
      : (scannedProduct.caloriesPer100g * effectiveGrams) / 100)
    : 0;

  const effectiveProtein = scannedProduct
    ? Math.round((portionMode === 'serving'
      ? scannedProduct.proteinPerServing * servingCount
      : (scannedProduct.proteinPer100g * effectiveGrams) / 100) * 10) / 10
    : 0;

  const effectiveCarbs = scannedProduct
    ? Math.round((portionMode === 'serving'
      ? scannedProduct.carbsPerServing * servingCount
      : (scannedProduct.carbsPer100g * effectiveGrams) / 100) * 10) / 10
    : 0;

  const effectiveFats = scannedProduct
    ? Math.round((portionMode === 'serving'
      ? scannedProduct.fatsPerServing * servingCount
      : (scannedProduct.fatsPer100g * effectiveGrams) / 100) * 10) / 10
    : 0;

  const applyEdits = () => {
    if (!scannedProduct) return;
    const next: { title?: string; macros?: string } = {};
    if (!editTitle.trim()) next.title = isRTL ? 'اسم المنتج مطلوب' : 'Product name is required';
    const totals = [scannedProduct.caloriesPer100g, scannedProduct.proteinPer100g, scannedProduct.carbsPer100g, scannedProduct.fatsPer100g];
    if (totals.every(v => !v)) next.macros = isRTL ? 'أدخل سعرات وماكروز صحيحة' : 'Enter valid calories and macros';
    setEditErrors(next);
    if (Object.keys(next).length > 0) return;
    setScannedProduct({ ...scannedProduct, title: editTitle.trim(), brand: editBrand.trim() });
    setIsEditingProduct(false);
    gymAudio.triggerSubtleHaptic([20]);
  };

  const handleSaveScannedMeal = () => {
    if (!scannedProduct) return;
    if (portionMode === 'grams' && (!Number(customGrams) || Number(customGrams) <= 0)) {
      setGramsError(isRTL ? 'أدخل وزناً أكبر من صفر' : 'Enter a weight above zero');
      return;
    }
    const grams = Math.max(0, Math.round(effectiveGrams));
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
        ? `مسح باركود: ${scannedProduct.barcode} • الحصة: ${grams}g`
        : `Barcode scan: ${scannedProduct.barcode} • Portion: ${grams}g`,
      ingredients: [{ name: scannedProduct.title, portion: `${grams}g`, calories: effectiveCalories }]
    });
    gymAudio.playCelebrationFanfare();
    gymAudio.triggerDualPulseHaptic();
    handleClose();
  };

  const errorCallout = useMemo(() => {
    if (searchError === 'permission') {
      return {
        tone: 'error' as const,
        icon: <ShieldAlert size={15} />,
        title: isRTL ? 'الكاميرا مرفوضة' : 'Camera access denied',
        body: isRTL
          ? 'اسمح للموقع باستخدام الكاميرا من إعدادات المتصفح، أو اكتب رقم الباركود يدوياً بالأسفل.'
          : 'Allow camera access for this site in your browser settings, or type the barcode number below.'
      };
    }
    if (searchError === 'no-camera') {
      return {
        tone: 'error' as const,
        icon: <ImageOff size={15} />,
        title: isRTL ? 'لا توجد كاميرا متاحة' : 'No camera available',
        body: isRTL
          ? 'لم يتم العثور على كاميرا، أو أنها مستخدمة من تطبيق آخر. يمكنك المتابعة بكتابة الرقم يدوياً.'
          : 'No camera was found, or it is busy in another app. You can continue by typing the number.'
      };
    }
    if (searchError === 'no-detector') {
      return {
        tone: 'info' as const,
        icon: <ScanLine size={15} />,
        title: isRTL ? 'المسح التلقائي غير مدعوم هنا' : 'Auto-scan is not supported here',
        body: isRTL
          ? 'افتح FORMA في Chrome على أندرويد أو Safari على iOS للمسح المباشر، أو اكتب الرقم يدوياً — النتيجة نفسها تماماً.'
          : 'Open FORMA in Chrome on Android or Safari on iOS for live scanning, or type the number — the result is identical.'
      };
    }
    if (searchError === 'network') {
      return {
        tone: 'error' as const,
        icon: <WifiOff size={15} />,
        title: isRTL ? 'تعذّر جلب بيانات المنتج' : 'Could not fetch product data',
        body: isRTL ? 'تحقق من اتصالك بالإنترنت ثم أعد المحاولة.' : 'Check your connection and try again.'
      };
    }
    if (searchError === 'malformed') {
      return {
        tone: 'warning' as const,
        icon: <AlertCircle size={15} />,
        title: isRTL ? 'نتيجة غير قابلة للاستخدام' : 'Unusable result',
        body: isRTL
          ? 'سجّل المنتج يدوياً بالأرقام المدوّنة على العبوة — يستغرق ذلك ثوانٍ.'
          : 'Log the product manually using the numbers printed on the label — it takes seconds.'
      };
    }
    if (searchError === 'not-found') {
      return {
        tone: 'warning' as const,
        icon: <AlertCircle size={15} />,
        title: isRTL ? 'المنتج غير موجود' : 'Product not found',
        body: isRTL
          ? 'جرّب رقم باركود آخر، أو سجّل الوجبة يدوياً.'
          : 'Try another barcode number, or log the meal manually.'
      };
    }
    return null;
  }, [searchError, isRTL]);

  const lookupPercent = lookupStage === 'database' ? 40 : lookupStage === 'ai' ? 72 : lookupStage === 'done' ? 100 : 0;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      titleId="barcode-scanner-title"
      title={isRTL ? 'ماسح الباركود الغذائي' : 'Barcode Food Scanner'}
      subtitle={isRTL ? 'وجّه الكاميرا نحو باركود المنتج للتعرّف الفوري' : 'Point the camera at a product barcode for instant macros'}
      icon={<Barcode size={19} />}
      accent="#10b981"
      maxWidth={520}
      footer={
        scannedProduct ? (
          <>
            <SecondaryAction
              onClick={() => {
                setScannedProduct(null);
                setSearchError(null);
                setSearchErrorDetail(null);
                setIsEditingProduct(false);
              }}
              icon={<RefreshCw size={15} />}
            >
              {isRTL ? 'منتج آخر' : 'Scan another'}
            </SecondaryAction>
            <PrimaryAction onClick={handleSaveScannedMeal} icon={<Check size={18} />}>
              {isRTL ? `تسجيل (${effectiveCalories} سعرة)` : `Log meal (${effectiveCalories} kcal)`}
            </PrimaryAction>
          </>
        ) : (
          <>
            <SecondaryAction onClick={handleClose}>{isRTL ? 'إلغاء' : 'Cancel'}</SecondaryAction>
            {onManualEntry && (
              <PrimaryAction onClick={onManualEntry} icon={<Keyboard size={17} />}>
                {isRTL ? 'إدخال يدوي' : 'Enter manually'}
              </PrimaryAction>
            )}
          </>
        )
      }
    >
      {!scannedProduct && (
        <div role="tablist" aria-label={isRTL ? 'وضع المسح' : 'Scan mode'} style={{ display: 'flex', gap: '0.4rem', padding: '0.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'scan'}
            onClick={() => { setActiveTab('scan'); setSearchError(null); }}
            style={{
              flex: 1,
              padding: '0.55rem 0.6rem',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'scan' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              color: activeTab === 'scan' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              minHeight: 42
            }}
          >
            <Camera size={15} />
            <span>{isRTL ? 'مسح الكاميرا' : 'Live camera'}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'favorites'}
            onClick={() => { stopCamera(); setActiveTab('favorites'); }}
            style={{
              flex: 1,
              padding: '0.55rem 0.6rem',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'favorites' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
              color: activeTab === 'favorites' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              minHeight: 42
            }}
          >
            <Star size={15} fill={activeTab === 'favorites' ? '#ffffff' : 'none'} />
            <span>{isRTL ? 'منتجاتي' : 'Favorites'}</span>
            {favoriteFoods.length > 0 && (
              <span style={{ background: activeTab === 'favorites' ? 'rgba(0,0,0,0.3)' : 'rgba(245, 158, 11, 0.2)', color: activeTab === 'favorites' ? '#fff' : '#f59e0b', padding: '0.1rem 0.4rem', borderRadius: '999px', fontSize: '0.66rem', fontWeight: 800 }}>
                {favoriteFoods.length}
              </span>
            )}
          </button>
        </div>
      )}

      {!scannedProduct && activeTab === 'scan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div style={{ position: 'relative', width: '100%', height: '230px', borderRadius: '18px', overflow: 'hidden', backgroundColor: '#000', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
            <video
              ref={videoRef}
              playsInline
              muted
              aria-label={isRTL ? 'معاينة الكاميرا' : 'Camera preview'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraState === 'granted' ? 'block' : 'none' }}
            />

            {cameraState === 'granted' && (
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', direction: isRTL ? 'rtl' : 'ltr' }}>
                <div style={{ position: 'absolute', inset: '22px', border: `2px solid ${isRTL ? '#38bdf8' : '#10b981'}`, borderRadius: '14px', boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)' }}>
                  <motion.div
                    animate={{ y: [0, 178, 0] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                    style={{ width: '100%', height: '2px', background: isRTL ? 'linear-gradient(270deg, transparent, #38bdf8, #10b981, transparent)' : 'linear-gradient(90deg, transparent, #10b981, #38bdf8, transparent)', boxShadow: '0 0 12px #10b981' }}
                  />
                </div>
                <span style={{ position: 'absolute', bottom: '6px', insetInlineStart: 0, width: '100%', textAlign: 'center', fontSize: '0.7rem', color: '#e2e8f0', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                  {isRTL ? 'املأ الإطار بكامل الباركود' : 'Fill the frame with the whole barcode'}
                </span>
              </div>
            )}

            {cameraState !== 'granted' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.2rem', textAlign: 'center', color: 'var(--text-muted)', gap: '0.6rem' }}>
                {cameraState === 'requesting' ? (
                  <>
                    <Loader2 size={30} style={{ color: '#10b981', animation: 'spin 1s linear infinite' }} />
                    <p style={{ margin: 0, fontSize: '0.8rem' }}>{isRTL ? 'بانتظار إذن الكاميرا…' : 'Waiting for camera permission…'}</p>
                  </>
                ) : (
                  <>
                    <Camera size={32} style={{ color: '#10b981' }} />
                    <p style={{ margin: 0, fontSize: '0.8rem' }}>
                      {isRTL ? 'اكتب رقم الباركود بالأسفل إن لم تتوفر الكاميرا.' : 'Type the barcode number below if no camera is available.'}
                    </p>
                  </>
                )}
              </div>
            )}

            {cameraState === 'granted' && (
              <button
                type="button"
                onClick={() => void toggleTorch()}
                aria-pressed={torchOn}
                aria-label={isRTL ? 'فلاش الكاميرا' : 'Toggle flashlight'}
                style={{
                  position: 'absolute',
                  top: '12px',
                  insetInlineEnd: '12px',
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  background: torchOn ? '#eab308' : 'rgba(0, 0, 0, 0.65)',
                  color: torchOn ? '#000' : '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Zap size={16} />
              </button>
            )}

            {isSearching && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '1rem' }}>
                <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={lookupPercent} aria-label={isRTL ? 'تقدم البحث' : 'Lookup progress'} style={{ width: '70%', height: 7, borderRadius: '999px', background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                  <motion.div animate={{ width: `${lookupPercent}%` }} transition={{ type: 'spring', stiffness: 90, damping: 20 }} style={{ height: '100%', background: 'linear-gradient(90deg, #38bdf8, #10b981)' }} />
                </div>
                <span style={{ fontSize: '0.76rem', color: '#e2e8f0', fontWeight: 700 }}>
                  {lookupStage === 'ai'
                    ? isRTL ? 'لم يُعثر عليه — جارٍ التعرّف بالذكاء الاصطناعي…' : 'Not in database — asking the AI…'
                    : isRTL ? 'جارٍ جلب بيانات المنتج…' : 'Fetching product data…'}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <label htmlFor="barcode-input" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                {isRTL ? 'رقم الباركود' : 'Barcode number'}
              </label>
              <Barcode
                size={16}
                aria-hidden="true"
                style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '0.75rem', color: 'var(--text-muted)', pointerEvents: 'none' }}
              />
              <input
                id="barcode-input"
                type="text"
                inputMode="numeric"
                enterKeyHint="search"
                pattern="[0-9]*"
                autoComplete="off"
                dir="ltr"
                placeholder={isRTL ? 'اكتب رقم الباركود' : 'Type barcode number'}
                value={manualBarcodeInput}
                onChange={event => setManualBarcodeInput(event.target.value.replace(/\D/g, ''))}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void lookupBarcode(manualBarcodeInput);
                  }
                }}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  fontSize: '1rem',
                  padding: '0.65rem 0.85rem',
                  paddingInlineStart: '2.2rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <SecondaryAction
              onClick={() => void lookupBarcode(manualBarcodeInput)}
              disabled={manualBarcodeInput.trim().length < 6 || isSearching}
              icon={isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            >
              {isRTL ? 'بحث' : 'Look up'}
            </SecondaryAction>
          </div>

          {errorCallout && (
            <StatusCallout
              tone={errorCallout.tone}
              title={errorCallout.title}
              icon={errorCallout.icon}
              action={onManualEntry ? (
                <SecondaryAction onClick={onManualEntry} icon={<Keyboard size={15} />}>
                  {isRTL ? 'سجّل يدوياً' : 'Log manually'}
                </SecondaryAction>
              ) : undefined}
            >
              {errorCallout.body}
              {searchErrorDetail && (
                <span style={{ display: 'block', marginTop: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)', wordBreak: 'break-word' }}>
                  {searchErrorDetail}
                </span>
              )}
            </StatusCallout>
          )}
        </div>
      )}

      {!scannedProduct && activeTab === 'favorites' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'اضغط أي منتج متكرر لتسجيله بنقرة:' : 'Tap any frequent food to log it in one tap:'}
            </span>
            <span style={{ color: '#f59e0b', fontWeight: 700 }}>⭐ {isRTL ? 'محفوظ محلياً' : 'Saved locally'}</span>
          </div>

          {favoriteFoods.length === 0 ? (
            <div style={{ padding: '1.5rem 1rem', textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: '16px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
              <Star size={32} style={{ color: '#f59e0b', opacity: 0.6 }} />
              <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{isRTL ? 'لا توجد منتجات محفوظة' : 'No saved foods yet'}</h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: '300px' }}>
                {isRTL
                  ? 'امسح أي منتج ثم اضغط ⭐ لحفظه هنا والوصول إليه بنقرة في المرة القادمة.'
                  : 'Scan any product, then tap ⭐ to keep it here for one-tap logging next time.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {favoriteFoods.map(item => (
                <div
                  key={item.barcode}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectFavorite(item)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      selectFavorite(item);
                    }
                  }}
                  style={{
                    padding: '0.75rem 0.9rem',
                    borderRadius: '14px',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    cursor: 'pointer',
                    minHeight: 56
                  }}
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'contain', backgroundColor: '#fff', padding: 2, flexShrink: 0 }} />
                  ) : (
                    <span aria-hidden="true" style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Barcode size={20} />
                    </span>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>
                      {item.brand || (isRTL ? 'منتج معتمد' : 'Verified')}
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.2rem', fontSize: '0.7rem' }}>
                      <span style={{ color: '#f97316', fontWeight: 800 }}>🔥 {item.caloriesPerServing} kcal</span>
                      <span style={{ color: '#06b6d4', fontWeight: 800 }}>🥩 {item.proteinPerServing}g</span>
                      <span style={{ color: 'var(--text-muted)' }}>{item.servingSize || '100g'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={event => deleteFavorite(item.barcode, event)}
                    aria-label={isRTL ? `حذف ${item.title} من المفضلة` : `Remove ${item.title} from favorites`}
                    style={{ background: 'transparent', border: 'none', color: '#64748b', padding: '0.4rem', cursor: 'pointer', borderRadius: '8px', display: 'flex', flexShrink: 0 }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {scannedProduct && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ padding: '0.9rem', borderRadius: '16px', backgroundColor: 'var(--bg-tertiary)', border: `1px solid ${scannedProduct.source === 'ai' ? 'rgba(245, 158, 11, 0.45)' : 'rgba(16, 185, 129, 0.35)'}`, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            {scannedProduct.imageUrl ? (
              <img src={scannedProduct.imageUrl} alt="" style={{ width: '58px', height: '58px', borderRadius: '12px', objectFit: 'contain', backgroundColor: '#fff', padding: 4, flexShrink: 0 }} />
            ) : (
              <span aria-hidden="true" style={{ width: '58px', height: '58px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Barcode size={28} />
              </span>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: scannedProduct.source === 'ai' ? '#f59e0b' : '#10b981', textTransform: 'uppercase' }}>
                {scannedProduct.source === 'ai'
                  ? isRTL ? 'تقدير ذكي — تحقق منه' : 'AI estimate — verify it'
                  : scannedProduct.brand || (isRTL ? 'قاعدة بيانات موثوقة' : 'Verified database')}
              </span>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {scannedProduct.title}
              </div>
              <span dir="ltr" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {isRTL ? 'الباركود' : 'UPC'}: {scannedProduct.barcode}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setIsEditingProduct(prev => !prev)}
                aria-expanded={isEditingProduct}
                aria-label={isRTL ? 'تصحيح بيانات المنتج' : 'Correct product data'}
                style={{ padding: '0.35rem 0.55rem', borderRadius: '9px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: 750, cursor: 'pointer' }}
              >
                <PencilLine size={12} />
                {isRTL ? 'تصحيح' : 'Correct'}
              </button>
              <button
                type="button"
                onClick={() => toggleFavorite(scannedProduct)}
                aria-pressed={favoriteFoods.some(f => f.barcode === scannedProduct.barcode)}
                style={{ padding: '0.35rem 0.55rem', borderRadius: '9px', border: `1px solid ${favoriteFoods.some(f => f.barcode === scannedProduct.barcode) ? 'rgba(245, 158, 11, 0.5)' : 'var(--border-color)'}`, background: favoriteFoods.some(f => f.barcode === scannedProduct.barcode) ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)', color: favoriteFoods.some(f => f.barcode === scannedProduct.barcode) ? '#f59e0b' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: 750, cursor: 'pointer' }}
              >
                <Star size={12} fill={favoriteFoods.some(f => f.barcode === scannedProduct.barcode) ? '#f59e0b' : 'none'} />
                {isRTL ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {isEditingProduct && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', padding: '0.85rem', borderRadius: '14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <label htmlFor="product-title-edit" style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                      {isRTL ? 'اسم المنتج' : 'Product name'}
                    </label>
                    <input
                      id="product-title-edit"
                      type="text"
                      value={editTitle}
                      onChange={event => { setEditTitle(event.target.value); if (editErrors.title) setEditErrors(prev => ({ ...prev, title: undefined })); }}
                      aria-invalid={editErrors.title ? true : undefined}
                      aria-describedby={editErrors.title ? 'product-title-error' : undefined}
                      style={{ width: '100%', boxSizing: 'border-box', fontSize: '1rem', fontWeight: 700, padding: '0.6rem 0.8rem', borderRadius: '11px', border: `1px solid ${editErrors.title ? '#f87171' : 'var(--border-color)'}`, background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                    {editErrors.title && <FieldError id="product-title-error" message={editErrors.title} />}
                  </div>

                  <div>
                    <label htmlFor="product-brand-edit" style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                      {isRTL ? 'العلامة التجارية' : 'Brand'}
                    </label>
                    <input
                      id="product-brand-edit"
                      type="text"
                      value={editBrand}
                      onChange={event => setEditBrand(event.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', fontSize: '1rem', padding: '0.6rem 0.8rem', borderRadius: '11px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {([
                      { key: 'caloriesPer100g' as const, label: isRTL ? 'سعرة/100g' : 'kcal/100g', accent: '#ef4444' },
                      { key: 'proteinPer100g' as const, label: isRTL ? 'بروتين/100g' : 'Protein/100g', accent: '#06b6d4' },
                      { key: 'carbsPer100g' as const, label: isRTL ? 'كارب/100g' : 'Carbs/100g', accent: '#f59e0b' },
                      { key: 'fatsPer100g' as const, label: isRTL ? 'دهون/100g' : 'Fats/100g', accent: '#ec4899' }
                    ]).map(field => (
                      <InlineNumberField
                        key={field.key}
                        id={`product-${field.key}`}
                        label={field.label}
                        accent={field.accent}
                        inputMode="decimal"
                        max={1000}
                        value={String(scannedProduct[field.key] ?? 0)}
                        onChange={value => {
                          setScannedProduct(prev => prev ? { ...prev, [field.key]: Number(value) || 0 } : prev);
                          if (editErrors.macros) setEditErrors(prev2 => ({ ...prev2, macros: undefined }));
                        }}
                        invalid={Boolean(editErrors.macros)}
                        describedBy={editErrors.macros ? 'product-macros-error' : undefined}
                        dir="ltr"
                      />
                    ))}
                  </div>
                  {editErrors.macros && <FieldError id="product-macros-error" message={editErrors.macros} />}

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <SecondaryAction onClick={() => { setIsEditingProduct(false); setEditErrors({}); }} fullWidth>
                      {isRTL ? 'تراجع' : 'Cancel'}
                    </SecondaryAction>
                    <PrimaryAction onClick={applyEdits} fullWidth icon={<Check size={16} />}>
                      {isRTL ? 'تطبيق' : 'Apply'}
                    </PrimaryAction>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ padding: '0.9rem', borderRadius: '16px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {isRTL ? 'الحصة والكمية' : 'Serving & portion'}
              </span>
              <div role="radiogroup" aria-label={isRTL ? 'طريقة حساب الحصة' : 'Portion basis'} style={{ display: 'inline-flex', gap: '2px', padding: '2px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                {([
                  { value: 'serving' as const, label: isRTL ? 'بالحصة' : 'Per serving' },
                  { value: 'grams' as const, label: isRTL ? 'بالجرام' : 'Per weight' }
                ]).map(option => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={portionMode === option.value}
                    onClick={() => setPortionMode(option.value)}
                    style={{ padding: '0.28rem 0.65rem', borderRadius: '6px', border: 'none', background: portionMode === option.value ? '#10b981' : 'transparent', color: portionMode === option.value ? '#fff' : 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', minHeight: 30 }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {portionMode === 'serving' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {scannedProduct.servingSize}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => { setServingCount(prev => Math.max(0.5, Math.round((prev - 0.5) * 2) / 2)); gymAudio.triggerSubtleHaptic([15]); }}
                    aria-label={isRTL ? 'إنقاص الحصة' : 'Decrease servings'}
                    style={{ width: 36, height: 36, borderRadius: '9px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Minus size={15} />
                  </button>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, minWidth: 46, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                    {servingCount}×
                  </span>
                  <button
                    type="button"
                    onClick={() => { setServingCount(prev => prev + 0.5); gymAudio.triggerSubtleHaptic([15]); }}
                    aria-label={isRTL ? 'زيادة الحصة' : 'Increase servings'}
                    style={{ width: 36, height: 36, borderRadius: '9px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.6rem', flexWrap: 'wrap' }}>
                <InlineNumberField
                  id="barcode-grams"
                  label={isRTL ? 'الوزن' : 'Weight'}
                  value={customGrams}
                  onChange={value => {
                    setCustomGrams(value);
                    if (gramsError) setGramsError(undefined);
                  }}
                  suffix={massUnit}
                  inputMode="decimal"
                  min={1}
                  max={5000}
                  invalid={Boolean(gramsError)}
                  describedBy={gramsError ? 'barcode-grams-error' : undefined}
                  dir="ltr"
                />
                <UnitToggle
                  id="barcode-mass-unit"
                  label={isRTL ? 'الوحدة' : 'Unit'}
                  value={massUnit}
                  onChange={next => {
                    if (next === massUnit) return;
                    const grams = massToGrams(Number(customGrams) || 0, massUnit);
                    setMassUnit(next as MassUnit);
                    setCustomGrams(String(Math.round(gramsToMass(grams, next as MassUnit) * 10) / 10));
                  }}
                  options={[{ value: 'g', label: 'g' }, { value: 'oz', label: 'oz' }]}
                />
              </div>
            )}
            {gramsError && <FieldError id="barcode-grams-error" message={gramsError} />}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }} aria-label={isRTL ? 'الماكروز المحسوبة' : 'Computed macros'}>
            {([
              { label: isRTL ? 'السعرات' : 'Calories', value: effectiveCalories, unit: 'kcal', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.25)' },
              { label: isRTL ? 'بروتين' : 'Protein', value: effectiveProtein, unit: 'g', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.25)' },
              { label: isRTL ? 'كارب' : 'Carbs', value: effectiveCarbs, unit: 'g', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)' },
              { label: isRTL ? 'دهون' : 'Fats', value: effectiveFats, unit: 'g', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)', border: 'rgba(236, 72, 153, 0.25)' }
            ]).map(tile => (
              <div key={tile.label} style={{ padding: '0.6rem 0.3rem', borderRadius: '12px', background: tile.bg, border: `1px solid ${tile.border}` }}>
                <span style={{ fontSize: '0.68rem', color: tile.color, fontWeight: 800, display: 'block' }}>{tile.label}</span>
                <strong style={{ fontSize: '1.1rem', color: tile.color, display: 'block', fontVariantNumeric: 'tabular-nums' }}>{tile.value}</strong>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{tile.unit}</span>
              </div>
            ))}
          </div>

          <div role="radiogroup" aria-label={isRTL ? 'نوع الوجبة' : 'Meal category'} style={{ display: 'flex', gap: '0.35rem' }}>
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(type => (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={mealType === type}
                onClick={() => setMealType(type)}
                style={{ flex: 1, padding: '0.5rem 0.25rem', borderRadius: '10px', border: `1px solid ${mealType === type ? '#10b981' : 'var(--border-color)'}`, background: mealType === type ? 'rgba(16, 185, 129, 0.18)' : 'var(--bg-tertiary)', color: mealType === type ? '#10b981' : 'var(--text-secondary)', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer', minHeight: 40 }}
              >
                {t(type as never)}
              </button>
            ))}
          </div>
        </div>
      )}
    </ModalShell>
  );
}
