import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Dumbbell, Trophy, Flame, Clock3, Sparkles, Check, CheckCircle2, Award, Camera, Trash2, AlertCircle } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import type { WorkoutSession, PersonalRecord } from '../lib/api';
import { validateClientFile, MAX_IMAGE_UPLOAD_BYTES, ALLOWED_IMAGE_MIME_TYPES } from '../lib/fileValidation';
import { ModalShell, PrimaryAction, SecondaryAction, StatusCallout } from './AIMealVisionModal';

interface WorkoutShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: WorkoutSession;
  burnedCalories?: number;
  userName?: string;
  unit?: 'kg' | 'lb';
  newPRs?: PersonalRecord[];
}

export function WorkoutShareCardModal({
  isOpen,
  onClose,
  session,
  burnedCalories,
  userName = 'Athlete',
  unit = 'kg',
  newPRs = []
}: WorkoutShareCardModalProps) {
  const { t, formatDate, tTitle, tExercise, isRTL } = useTranslation();
  const [aspectRatio, setAspectRatio] = useState<'story' | 'square'>('story');
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [workoutPhoto, setWorkoutPhoto] = useState<string | null>(null);
  const [cachedPhotoImg, setCachedPhotoImg] = useState<HTMLImageElement | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    if (!workoutPhoto) {
      setCachedPhotoImg(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setCachedPhotoImg(img);
    img.onerror = () => setPhotoError(isRTL ? 'تعذّر قراءة الصورة المرفقة' : 'Could not read the attached photo');
    img.src = workoutPhoto;
  }, [workoutPhoto, isRTL]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const validation = validateClientFile(file, {
      maxSizeBytes: MAX_IMAGE_UPLOAD_BYTES,
      allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES
    });
    if (!validation.valid) {
      setPhotoError(validation.error ?? null);
      return;
    }
    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = e => setWorkoutPhoto(e.target?.result as string);
    reader.onerror = () => setPhotoError(isRTL ? 'تعذّرت قراءة الملف' : 'Could not read that file');
    reader.readAsDataURL(file);
  };

  // Compute Volume, Sets, Reps, and Top Lifts
  const stats = useMemo(() => {
    let totalVol = 0;
    let completedSets = 0;
    let totalReps = 0;
    const topLifts: { name: string; weight: number; reps: number; unit: string }[] = [];

    (session.exercises || []).forEach(ex => {
      let maxWeightInEx = 0;
      let repsAtMax = 0;
      let exUnit = unit;

      ex.sets?.forEach(s => {
        if (s.isCompleted || (s.weight > 0 && s.repsActual > 0)) {
          completedSets++;
          const w = s.unit === 'lb' ? s.weight * 0.453592 : s.weight;
          const r = s.repsActual || s.repsTarget || 0;
          totalReps += r;
          totalVol += Math.round(w * r);

          if (s.weight > maxWeightInEx) {
            maxWeightInEx = s.weight;
            repsAtMax = r;
            exUnit = s.unit || unit;
          }
        }
      });

      if (maxWeightInEx > 0) {
        topLifts.push({
          name: ex.name,
          weight: maxWeightInEx,
          reps: repsAtMax,
          unit: exUnit
        });
      }
    });

    topLifts.sort((a, b) => b.weight - a.weight);

    const tonnes = (totalVol / 1000).toFixed(1);

    return {
      totalVol,
      tonnes,
      completedSets,
      totalReps,
      topLifts: topLifts.slice(0, 4)
    };
  }, [session, unit]);

  const { totalVol, tonnes, completedSets, totalReps, topLifts } = stats;

  const sessionDuration = session.duration || Math.max(25, Math.round((session.exercises?.length || 3) * 8));
  const calories = burnedCalories || Math.round(sessionDuration * 7.8);

  // Top PR or peak lift
  const topPR = useMemo(() => {
    if (newPRs && newPRs.length > 0) {
      return newPRs[0];
    }
    return null;
  }, [newPRs]);

  // Generate 1080x1920 (9:16) or 1080x1080 (1:1) Canvas
  const generateCanvas = (): HTMLCanvasElement => {
    const isStory = aspectRatio === 'story';
    const width = 1080;
    const height = isStory ? 1920 : 1080;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const safeRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
      } else {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      }
    };

    // 1. Photo or Deep Space Obsidian Background
    if (cachedPhotoImg) {
      const imgW = cachedPhotoImg.naturalWidth || cachedPhotoImg.width;
      const imgH = cachedPhotoImg.naturalHeight || cachedPhotoImg.height;
      const scale = Math.max(width / imgW, height / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const drawX = (width - drawW) / 2;
      const drawY = (height - drawH) / 2;

      ctx.save();
      ctx.drawImage(cachedPhotoImg, drawX, drawY, drawW, drawH);

      const darkGrad = ctx.createLinearGradient(0, 0, 0, height);
      darkGrad.addColorStop(0, 'rgba(6, 9, 19, 0.72)');
      darkGrad.addColorStop(0.5, 'rgba(6, 9, 19, 0.82)');
      darkGrad.addColorStop(1, 'rgba(6, 9, 19, 0.94)');
      ctx.fillStyle = darkGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#060913');
      bgGrad.addColorStop(0.45, '#0c1322');
      bgGrad.addColorStop(1, '#05070e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Cinematic Ambient Glow Orbs
    // Top-Right Cyan Glow
    const orbCyan = ctx.createRadialGradient(880, 260, 20, 880, 260, 520);
    orbCyan.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
    orbCyan.addColorStop(1, 'transparent');
    ctx.fillStyle = orbCyan;
    ctx.fillRect(0, 0, width, height);

    // Bottom-Left Violet Glow
    const orbViolet = ctx.createRadialGradient(200, isStory ? 1620 : 900, 20, 200, isStory ? 1620 : 900, 560);
    orbViolet.addColorStop(0, 'rgba(139, 92, 246, 0.24)');
    orbViolet.addColorStop(1, 'transparent');
    ctx.fillStyle = orbViolet;
    ctx.fillRect(0, 0, width, height);

    // Golden Halo in Center for PR / Volume
    const orbGold = ctx.createRadialGradient(540, isStory ? 700 : 420, 10, 540, isStory ? 700 : 420, 420);
    orbGold.addColorStop(0, 'rgba(245, 158, 11, 0.16)');
    orbGold.addColorStop(1, 'transparent');
    ctx.fillStyle = orbGold;
    ctx.fillRect(0, 0, width, height);

    // 3. Double Border Aesthetic Frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    safeRoundRect(35, 35, width - 70, height - 70, 32);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 3;
    safeRoundRect(45, 45, width - 90, height - 90, 28);
    ctx.stroke();

    // 4. Header: Brand Badge & Localized Date
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.font = '800 34px "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif';
    ctx.fillText('⚡ FORMA ELITE ATHLETE', width / 2, isStory ? 125 : 105);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 25px "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif';
    const dateFormatted = formatDate(new Date(session.date || new Date()), 'EEEE، d MMMM yyyy');
    ctx.fillText(dateFormatted, width / 2, isStory ? 172 : 145);

    // 5. Workout Title & Athlete Name
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 56px "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif';
    const displayTitle = tTitle(session.title || 'Daily Workout');
    ctx.fillText(displayTitle.slice(0, 32), width / 2, isStory ? 255 : 215);

    ctx.fillStyle = '#facc15';
    ctx.font = '700 26px "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`ATHLETE: ${userName.toUpperCase()}`, width / 2, isStory ? 305 : 255);

    // Horizontal Glass Divider
    const divY = isStory ? 345 : 285;
    const divGrad = ctx.createLinearGradient(120, divY, width - 120, divY);
    divGrad.addColorStop(0, 'transparent');
    divGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
    divGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(120, divY);
    ctx.lineTo(width - 120, divY);
    ctx.stroke();

    // 6. HERO TONNAGE LIFTED BANNER (Dark Glassmorphism)
    const heroY = isStory ? 385 : 315;
    const heroH = isStory ? 280 : 190;
    const heroW = width - 180;
    const heroX = 90;

    // Glass panel fill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    safeRoundRect(heroX, heroY, heroW, heroH, 26);
    ctx.fill();

    // Glowing border
    const heroBorderGrad = ctx.createLinearGradient(heroX, heroY, heroX + heroW, heroY + heroH);
    heroBorderGrad.addColorStop(0, 'rgba(250, 204, 21, 0.6)');
    heroBorderGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.3)');
    heroBorderGrad.addColorStop(1, 'rgba(250, 204, 21, 0.6)');
    ctx.strokeStyle = heroBorderGrad;
    ctx.lineWidth = 3;
    safeRoundRect(heroX, heroY, heroW, heroH, 26);
    ctx.stroke();

    // Subtitle
    ctx.fillStyle = '#facc15';
    ctx.font = '800 24px "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif';
    const heroSub = isRTL ? '🏋️‍♂️ إجمالي الحجم المرفوع اليوم' : '🏋️‍♂️ TOTAL VOLUME LIFTED TODAY';
    ctx.fillText(heroSub, width / 2, heroY + (isStory ? 55 : 42));

    // Big Tonnage Hero Text
    ctx.fillStyle = '#ffffff';
    ctx.font = `950 ${isStory ? '76px' : '54px'} "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif`;
    const heroMainText = totalVol >= 1000
      ? (isRTL ? `رفع ${tonnes} أطنان اليوم` : `Lifted ${tonnes} Tons Today`)
      : (isRTL ? `رفع ${totalVol.toLocaleString()} كغ اليوم` : `Lifted ${totalVol.toLocaleString()} KG Today`);
    ctx.fillText(heroMainText, width / 2, heroY + (isStory ? 145 : 105));

    // Extra volume detail pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    const pillW = isStory ? 480 : 380;
    const pillH = isStory ? 48 : 38;
    safeRoundRect((width - pillW) / 2, heroY + (isStory ? 190 : 130), pillW, pillH, 24);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.font = `700 ${isStory ? '23px' : '18px'} "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif`;
    const pillText = isRTL 
      ? `ما يعادل ${totalVol.toLocaleString()} كغ من الحديد الصافي 🔥` 
      : `${totalVol.toLocaleString()} kg total iron moved 🔥`;
    ctx.fillText(pillText, width / 2, heroY + (isStory ? 222 : 156));

    // 7. RECORD BROKEN / PEAK LIFT HIGHLIGHT BANNER
    const prY = heroY + heroH + (isStory ? 35 : 25);
    const prH = isStory ? 160 : 110;
    const prW = width - 180;
    const prX = 90;

    ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
    safeRoundRect(prX, prY, prW, prH, 22);
    ctx.fill();

    ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
    ctx.lineWidth = 2.5;
    safeRoundRect(prX, prY, prW, prH, 22);
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.font = '800 24px "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif';
    const prTitle = topPR
      ? (isRTL ? '🔥 رقم قياسي جديد تم تحطيمه اليوم!' : '🔥 NEW PERSONAL RECORD BROKEN!')
      : (isRTL ? '⚡ أقوى رفعة مسجلة في التمرين' : '⚡ PEAK LIFT RECORDED TODAY');
    ctx.fillText(prTitle, width / 2, prY + (isStory ? 52 : 38));

    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${isStory ? '34px' : '26px'} "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif`;
    let prDetail = '';
    if (topPR) {
      prDetail = `${tExercise(topPR.exerciseName)}: ${topPR.maxWeight} ${topPR.unit} × ${topPR.reps}`;
    } else if (topLifts.length > 0) {
      prDetail = `${tExercise(topLifts[0].name)}: ${topLifts[0].weight} ${topLifts[0].unit} × ${topLifts[0].reps}`;
    } else {
      prDetail = `${displayTitle} · Elite Level Performance`;
    }
    ctx.fillText(prDetail, width / 2, prY + (isStory ? 112 : 82));

    // 8. 4-STAT GRID (Duration, Calories, Sets, Reps)
    const gridY = prY + prH + (isStory ? 35 : 25);
    const cardW = 430;
    const cardH = isStory ? 150 : 85;
    const col1X = 90;
    const col2X = width - 90 - cardW;

    const drawGridCard = (x: number, y: number, iconLabel: string, value: string, color: string) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      safeRoundRect(x, y, cardW, cardH, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = `600 ${isStory ? '23px' : '17px'} "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif`;
      ctx.fillText(iconLabel, x + (cardW / 2), y + (isStory ? 50 : 32));

      ctx.fillStyle = color;
      ctx.font = `850 ${isStory ? '42px' : '28px'} "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif`;
      ctx.fillText(value, x + (cardW / 2), y + (isStory ? 112 : 68));
    };

    // Row 1
    drawGridCard(col1X, gridY, isRTL ? '⏱️ مدة الجلسة' : '⏱️ TRAINING TIME', `${sessionDuration} ${isRTL ? 'دقيقة' : 'MIN'}`, '#38bdf8');
    drawGridCard(col2X, gridY, isRTL ? '🔥 السعرات المحروقة' : '🔥 BURNED CALORIES', `${calories} ${isRTL ? 'سعرة' : 'KCAL'}`, '#f87171');

    // Row 2
    drawGridCard(col1X, gridY + cardH + 20, isRTL ? '✅ الجولات المكتملة' : '✅ COMPLETED SETS', `${completedSets} ${isRTL ? 'جولات' : 'SETS'}`, '#34d399');
    drawGridCard(col2X, gridY + cardH + 20, isRTL ? '💪 إجمالي التكرارات' : '💪 TOTAL REPS', `${totalReps} ${isRTL ? 'تكرار' : 'REPS'}`, '#c084fc');

    // 9. TOP LIFTS SECTION (Story format gets 3 lifts, Square gets 2)
    const liftsStartY = gridY + (cardH * 2) + (isStory ? 60 : 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${isStory ? '32px' : '24px'} "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif`;
    ctx.fillText(isRTL ? '🏆 أبرز الرفعات في الجلسة' : '🏆 TOP LIFTS & MOVEMENTS', width / 2, liftsStartY);

    let liftY = liftsStartY + (isStory ? 35 : 20);
    const maxLifts = isStory ? 3 : 2;

    topLifts.slice(0, maxLifts).forEach((l) => {
      const rowH = isStory ? 82 : 55;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      safeRoundRect(90, liftY, width - 180, rowH, 16);
      ctx.fill();
      ctx.stroke();

      if (isRTL) {
        // Exercise Name (Right side)
        ctx.textAlign = 'right';
        ctx.fillStyle = '#e2e8f0';
        ctx.font = `700 ${isStory ? '25px' : '18px'} "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif`;
        ctx.fillText(tExercise(l.name).slice(0, 30), width - 130, liftY + (isStory ? 52 : 36));

        // Weight & Reps (Left side)
        ctx.textAlign = 'left';
        ctx.fillStyle = '#38bdf8';
        ctx.font = `800 ${isStory ? '28px' : '20px'} "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif`;
        ctx.fillText(`${l.weight} ${l.unit} × ${l.reps}`, 130, liftY + (isStory ? 52 : 36));
      } else {
        // Exercise Name (Left side)
        ctx.textAlign = 'left';
        ctx.fillStyle = '#e2e8f0';
        ctx.font = `700 ${isStory ? '25px' : '18px'} system-ui, sans-serif`;
        ctx.fillText(tExercise(l.name).slice(0, 30), 130, liftY + (isStory ? 52 : 36));

        // Weight & Reps (Right side)
        ctx.textAlign = 'right';
        ctx.fillStyle = '#38bdf8';
        ctx.font = `800 ${isStory ? '28px' : '20px'} system-ui, sans-serif`;
        ctx.fillText(`${l.weight} ${l.unit} × ${l.reps}`, width - 130, liftY + (isStory ? 52 : 36));
      }

      liftY += rowH + (isStory ? 18 : 12);
    });

    // 10. Footer Branding Watermark
    ctx.textAlign = 'center';
    const footerY = height - (isStory ? 80 : 45);
    ctx.fillStyle = '#64748b';
    ctx.font = `600 ${isStory ? '24px' : '18px'} "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif`;
    ctx.fillText(
      isRTL ? 'FORMA · تدرّب كالمحترفين · OWN YOUR MOMENT' : 'FORMA ELITE · TRACK LIKE A PRO · OWN YOUR MOMENT',
      width / 2,
      footerY
    );

    return canvas;
  };

  // Download High-Res PNG to Phone Photos
  const handleDownload = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const canvas = generateCanvas();
        const link = document.createElement('a');
        const dateStr = formatDate(new Date(session.date || new Date()), 'yyyy-MM-dd');
        link.download = `forma-story-${dateStr}-${session.id || Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      } catch (err) {
        console.error('Error generating card image:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 150);
  };

  // Share via Web Share API
  const handleShare = async () => {
    setIsGenerating(true);
    try {
      const canvas = generateCanvas();
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsGenerating(false);
          return;
        }

        const dateStr = formatDate(new Date(session.date || new Date()), 'yyyy-MM-dd');
        const file = new File([blob], `forma-story-${dateStr}.png`, { type: 'image/png' });

        const shareTitle = isRTL ? 'تمرين أسطوري على تطبيق FORMA 🔥' : 'Crushed my workout on FORMA! 🔥';
        const shareText = isRTL
          ? `أنهيت تمرين ${tTitle(session.title || 'اليوم')}! الحجم المرفوع: ${totalVol >= 1000 ? `${tonnes} طن` : `${totalVol} كغ`} · المدة: ${sessionDuration} دقيقة 💥`
          : `Crushed ${tTitle(session.title || 'Workout')} on FORMA! Total Volume: ${totalVol >= 1000 ? `${tonnes} Tons` : `${totalVol}kg`}, Duration: ${sessionDuration}min 💥`;

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: shareTitle,
            text: shareText
          });
        } else {
          // Fallback: Download file & copy text to clipboard
          const link = document.createElement('a');
          link.download = `forma-story-${dateStr}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();

          if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareText);
          }
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 3500);
        }
        setIsGenerating(false);
      }, 'image/png');
    } catch (err) {
      console.warn('Share not completed or cancelled:', err);
      setIsGenerating(false);
    }
  };

  const aspectSwitch = (
    <div role="radiogroup" aria-label={isRTL ? 'أبعاد البطاقة' : 'Card aspect ratio'} style={{ display: 'inline-flex', gap: '2px', padding: '2px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
      {([
        { value: 'story' as const, label: '9:16' },
        { value: 'square' as const, label: '1:1' }
      ]).map(option => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={aspectRatio === option.value}
          onClick={() => setAspectRatio(option.value)}
          style={{
            padding: '0.25rem 0.6rem',
            borderRadius: '999px',
            border: 'none',
            background: aspectRatio === option.value ? '#facc15' : 'transparent',
            color: aspectRatio === option.value ? '#0f172a' : 'var(--text-muted)',
            fontSize: '0.7rem',
            fontWeight: 850,
            cursor: 'pointer',
            minHeight: 28
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  const photoPicker = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
      <label
        style={{
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.35rem 0.6rem',
          borderRadius: '10px',
          background: workoutPhoto ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
          border: workoutPhoto ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
          color: workoutPhoto ? '#38bdf8' : 'var(--text-secondary)',
          fontSize: '0.72rem',
          fontWeight: 750,
          minHeight: 32
        }}
      >
        <Camera size={13} />
        <span>{workoutPhoto ? (isRTL ? 'تغيير' : 'Change') : (isRTL ? 'صورة' : 'Photo')}</span>
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} aria-label={isRTL ? 'إرفاق صورة التمرين' : 'Attach workout photo'} />
      </label>
      {workoutPhoto && (
        <button
          type="button"
          onClick={() => { setWorkoutPhoto(null); setPhotoError(null); }}
          aria-label={isRTL ? 'إزالة الصورة' : 'Remove photo'}
          style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '9px', padding: '0.3rem 0.45rem', cursor: 'pointer', display: 'inline-flex', minHeight: 32, minWidth: 32, alignItems: 'center', justifyContent: 'center' }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </span>
  );

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      titleId="share-card-title"
      title={t('cinematicStoryCard')}
      subtitle={t('cinematicStorySubtitle')}
      icon={<Sparkles size={19} />}
      accent="#facc15"
      maxWidth={480}
      headerAccessory={
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {aspectSwitch}
          {photoPicker}
        </span>
      }
      footer={
        <>
          <SecondaryAction onClick={handleDownload} disabled={isGenerating} icon={savedSuccess ? <Check size={16} color="#34d399" /> : <Download size={16} />}>
            {savedSuccess ? (isRTL ? 'تم الحفظ!' : 'Saved to gallery!') : t('saveToPhotos')}
          </SecondaryAction>
          <PrimaryAction onClick={() => void handleShare()} loading={isGenerating} accent="linear-gradient(135deg, #0284c7, #38bdf8)" icon={<Share2 size={16} />}>
            {isGenerating ? t('sharing') : t('shareToSocial')}
          </PrimaryAction>
        </>
      }
    >
      <AnimatePresence>
        {savedSuccess && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '12px', padding: '0.6rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#34d399', fontSize: '0.8rem', fontWeight: 750 }}>
              <CheckCircle2 size={15} />
              <span>{t('saveSuccess')}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {photoError && (
        <StatusCallout tone="error" title={isRTL ? 'الصورة المرفقة غير صالحة' : 'Attached photo rejected'} icon={<AlertCircle size={15} />}>
          {photoError}
        </StatusCallout>
      )}

      <div
        aria-label={isRTL ? 'معاينة بطاقة التمرين' : 'Workout card preview'}
        style={{
          width: '100%',
          maxWidth: aspectRatio === 'story' ? '290px' : '330px',
          margin: '0 auto',
          aspectRatio: aspectRatio === 'story' ? '9/16' : '1/1',
          borderRadius: '24px',
          background: workoutPhoto
            ? `linear-gradient(180deg, rgba(6,9,19,0.72) 0%, rgba(6,9,19,0.9) 100%), url(${workoutPhoto}) center/cover no-repeat`
            : 'linear-gradient(145deg, #060913 0%, #0c1322 50%, #05070e 100%)',
          border: '1.5px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 35px rgba(56, 189, 248, 0.18)',
          padding: '1.1rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <span aria-hidden="true" style={{ position: 'absolute', top: '-40px', insetInlineEnd: '-40px', width: '130px', height: '130px', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, transparent 70%)', filter: 'blur(25px)' }} />
        <span aria-hidden="true" style={{ position: 'absolute', bottom: '-40px', insetInlineStart: '-40px', width: '130px', height: '130px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)', filter: 'blur(25px)' }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem', gap: '0.4rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#38bdf8', fontWeight: 850, fontSize: '0.75rem' }}>
              <Dumbbell size={13} />
              <span>FORMA ELITE</span>
            </span>
            <span style={{ fontSize: '0.64rem', color: '#94a3b8' }}>{formatDate(new Date(session.date || new Date()), 'd MMM yyyy')}</span>
          </div>

          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            {tTitle(session.title || 'Daily Workout')}
          </h4>
          <span style={{ fontSize: '0.66rem', color: '#facc15', fontWeight: 700 }}>ATHLETE: {userName.toUpperCase()}</span>
        </div>

        <div style={{ borderRadius: '16px', background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.12), rgba(56, 189, 248, 0.08))', border: '1.5px solid rgba(250, 204, 21, 0.4)', padding: '0.6rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#facc15', display: 'block' }}>
            {isRTL ? 'إجمالي الحجم المرفوع' : 'TOTAL VOLUME'}
          </span>
          <strong style={{ fontSize: '1.2rem', fontWeight: 950, color: '#ffffff', display: 'block', lineHeight: 1.15 }}>
            {totalVol >= 1000
              ? (isRTL ? `رفع ${tonnes} أطنان اليوم` : `Lifted ${tonnes} Tons Today`)
              : (isRTL ? `رفع ${totalVol.toLocaleString()} كغ` : `Lifted ${totalVol.toLocaleString()} KG`)}
          </strong>
          <span style={{ fontSize: '0.6rem', color: '#38bdf8', fontWeight: 700 }}>{totalVol.toLocaleString()} kg total</span>
        </div>

        <div style={{ borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(250, 204, 21, 0.35)', padding: '0.45rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: '8px', background: 'rgba(250, 204, 21, 0.2)', color: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trophy size={13} />
          </span>
          <div style={{ minWidth: 0, flex: 1, textAlign: 'start' }}>
            <span style={{ display: 'block', fontSize: '0.6rem', color: '#facc15', fontWeight: 800 }}>
              {topPR ? (isRTL ? 'رقم قياسي محطم!' : 'PR record crushed!') : (isRTL ? 'أعلى رفعة اليوم' : 'Peak lift today')}
            </span>
            <span style={{ display: 'block', fontSize: '0.7rem', color: '#ffffff', fontWeight: 750, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {topPR
                ? `${tExercise(topPR.exerciseName)}: ${topPR.maxWeight}${topPR.unit}`
                : topLifts[0] ? `${tExercise(topLifts[0].name)}: ${topLifts[0].weight}${topLifts[0].unit}` : tTitle(session.title)}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
          {([
            { label: isRTL ? 'المدة' : 'Time', value: `${sessionDuration}m`, icon: <Clock3 size={10} />, color: '#38bdf8' },
            { label: isRTL ? 'السعرات' : 'Calories', value: `${calories} kcal`, icon: <Flame size={10} />, color: '#f87171' },
            { label: isRTL ? 'الجولات' : 'Sets', value: `${completedSets} sets`, icon: <CheckCircle2 size={10} />, color: '#34d399' },
            { label: isRTL ? 'التكرارات' : 'Reps', value: `${totalReps} reps`, icon: <Award size={10} />, color: '#c084fc' }
          ]).map(tile => (
            <div key={tile.label} style={{ padding: '0.4rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.6rem' }}>
                {tile.icon}
                <span>{tile.label}</span>
              </div>
              <strong style={{ fontSize: '0.86rem', color: tile.color, fontVariantNumeric: 'tabular-nums' }}>{tile.value}</strong>
            </div>
          ))}
        </div>

        {topLifts.length > 0 && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.28rem' }}>
            {topLifts.slice(0, aspectRatio === 'story' ? 2 : 1).map((lift, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', padding: '0.28rem 0.5rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '0.66rem' }}>
                <span style={{ color: '#cbd5e1', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                  {tExercise(lift.name)}
                </span>
                <strong style={{ color: '#38bdf8', fontVariantNumeric: 'tabular-nums' }}>{lift.weight}{lift.unit} × {lift.reps}</strong>
              </li>
            ))}
          </ul>
        )}

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.58rem', color: '#64748b' }}>FORMA · OWN YOUR MOMENT</span>
        </div>
      </div>
    </ModalShell>
  );
}

