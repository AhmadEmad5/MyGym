import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';

interface SegmentedMacroPillProps {
  protein: number;
  targetProtein: number;
  carbs: number;
  targetCarbs: number;
  fats: number;
  targetFats: number;
  totalCalories: number;
  targetCalories: number;
}

export function SegmentedMacroPill({
  protein,
  targetProtein,
  carbs,
  targetCarbs,
  fats,
  targetFats,
  totalCalories,
  targetCalories
}: SegmentedMacroPillProps) {
  const { isRTL } = useTranslation();
  const [selectedMacro, setSelectedMacro] = useState<'protein' | 'carbs' | 'fats' | null>(null);

  // Macro calories contribution: Protein 4kcal/g, Carbs 4kcal/g, Fats 9kcal/g
  const proteinCals = protein * 4;
  const carbsCals = carbs * 4;
  const fatsCals = fats * 9;
  const macroCalsSum = proteinCals + carbsCals + fatsCals || 1;

  // Relative percentages of consumed macros
  const pShare = (proteinCals / macroCalsSum) * 100;
  const cShare = (carbsCals / macroCalsSum) * 100;
  const fShare = (fatsCals / macroCalsSum) * 100;

  // Overall fullness of the pill relative to target calories (capped at 100% for container)
  const totalPercent = targetCalories > 0 ? Math.min(100, Math.round((totalCalories / targetCalories) * 100)) : 0;

  // Remainder values
  const remProtein = Math.max(0, targetProtein - protein);
  const remCarbs = Math.max(0, targetCarbs - carbs);
  const remFats = Math.max(0, targetFats - fats);

  const handleSelect = (macro: 'protein' | 'carbs' | 'fats') => {
    gymAudio.triggerVibration([10]);
    setSelectedMacro(prev => prev === macro ? null : macro);
  };

  return (
    <div className="segmented-macro-pill-wrapper" style={{ marginTop: '0.85rem', marginBottom: '1.25rem' }}>
      {/* Top Bar Header with Active Macro Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem', minHeight: '24px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          {isRTL ? 'توزيع الماكروز التراكمي' : 'Segmented Macro Distribution'}
        </span>

        <AnimatePresence mode="wait">
          {selectedMacro ? (
            <motion.div
              key={selectedMacro}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: selectedMacro === 'protein' ? '#06b6d4' : selectedMacro === 'carbs' ? '#f59e0b' : '#ec4899',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              {selectedMacro === 'protein' && (
                <span>{isRTL ? `🥩 متبقي للهدف: ${remProtein}g بروتين` : `🥩 Remaining: ${remProtein}g Protein`}</span>
              )}
              {selectedMacro === 'carbs' && (
                <span>{isRTL ? `⚡ متبقي للهدف: ${remCarbs}g كارب` : `⚡ Remaining: ${remCarbs}g Carbs`}</span>
              )}
              {selectedMacro === 'fats' && (
                <span>{isRTL ? `🥑 متبقي للهدف: ${remFats}g دهون` : `🥑 Remaining: ${remFats}g Fats`}</span>
              )}
            </motion.div>
          ) : (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {isRTL ? 'المس أي جزء لعرض المتبقي' : 'Tap segment for remaining'}
            </span>
          )}
        </AnimatePresence>
      </div>

      {/* The Unified Segmented Capsule Bar */}
      <div
        style={{
          width: '100%',
          height: '22px',
          borderRadius: '9999px',
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '2px',
          display: 'flex',
          overflow: 'hidden',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
          cursor: 'pointer'
        }}
      >
        <div 
          style={{ 
            width: `${totalPercent}%`, 
            height: '100%', 
            borderRadius: '9999px',
            display: 'flex',
            overflow: 'hidden',
            transition: 'width 0.4s ease'
          }}
        >
          {/* Protein Segment */}
          {protein > 0 && (
            <motion.div
              onClick={() => handleSelect('protein')}
              whileHover={{ opacity: 1 }}
              style={{
                width: `${pShare}%`,
                height: '100%',
                backgroundColor: '#06b6d4',
                opacity: selectedMacro && selectedMacro !== 'protein' ? 0.35 : 1,
                transition: 'opacity 0.2s ease, width 0.3s ease',
                position: 'relative'
              }}
              title={`${isRTL ? 'بروتين' : 'Protein'}: ${protein}g (${Math.round(pShare)}%)`}
            />
          )}

          {/* Carbs Segment */}
          {carbs > 0 && (
            <motion.div
              onClick={() => handleSelect('carbs')}
              whileHover={{ opacity: 1 }}
              style={{
                width: `${cShare}%`,
                height: '100%',
                backgroundColor: '#f59e0b',
                opacity: selectedMacro && selectedMacro !== 'carbs' ? 0.35 : 1,
                transition: 'opacity 0.2s ease, width 0.3s ease',
                position: 'relative'
              }}
              title={`${isRTL ? 'كارب' : 'Carbs'}: ${carbs}g (${Math.round(cShare)}%)`}
            />
          )}

          {/* Fats Segment */}
          {fats > 0 && (
            <motion.div
              onClick={() => handleSelect('fats')}
              whileHover={{ opacity: 1 }}
              style={{
                width: `${fShare}%`,
                height: '100%',
                backgroundColor: '#ec4899',
                opacity: selectedMacro && selectedMacro !== 'fats' ? 0.35 : 1,
                transition: 'opacity 0.2s ease, width 0.3s ease',
                position: 'relative'
              }}
              title={`${isRTL ? 'دهون' : 'Fats'}: ${fats}g (${Math.round(fShare)}%)`}
            />
          )}
        </div>
      </div>

      {/* Interactive 3-Card Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginTop: '0.75rem' }}>
        {/* Protein Card */}
        <motion.div
          onClick={() => handleSelect('protein')}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: '0.75rem',
            background: selectedMacro === 'protein' ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-tertiary)',
            borderRadius: '12px',
            border: selectedMacro === 'protein' ? '1px solid #06b6d4' : '1px solid rgba(6, 182, 212, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
            <span style={{ fontWeight: 700, color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>🥩</span> {isRTL ? 'البروتين' : 'Protein'}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              {Math.round((protein / (targetProtein || 1)) * 100)}%
            </span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#06b6d4' }}>
            {protein}<small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>/{targetProtein}g</small>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', marginTop: '0.35rem' }}>
            <div style={{ width: `${Math.min(100, (protein / (targetProtein || 1)) * 100)}%`, height: '100%', background: '#06b6d4', borderRadius: '999px' }} />
          </div>
          <span style={{ fontSize: '0.66rem', color: selectedMacro === 'protein' ? '#06b6d4' : 'var(--text-muted)', display: 'block', marginTop: '0.3rem', fontWeight: 600 }}>
            {selectedMacro === 'protein' 
              ? (isRTL ? `متبقي ${remProtein}g` : `${remProtein}g left`) 
              : (isRTL ? 'بناء وتضخيم الأنسجة' : 'Tissue repair')}
          </span>
        </motion.div>

        {/* Carbs Card */}
        <motion.div
          onClick={() => handleSelect('carbs')}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: '0.75rem',
            background: selectedMacro === 'carbs' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-tertiary)',
            borderRadius: '12px',
            border: selectedMacro === 'carbs' ? '1px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
            <span style={{ fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>⚡</span> {isRTL ? 'الكارب' : 'Carbs'}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              {Math.round((carbs / (targetCarbs || 1)) * 100)}%
            </span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f59e0b' }}>
            {carbs}<small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>/{targetCarbs}g</small>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', marginTop: '0.35rem' }}>
            <div style={{ width: `${Math.min(100, (carbs / (targetCarbs || 1)) * 100)}%`, height: '100%', background: '#f59e0b', borderRadius: '999px' }} />
          </div>
          <span style={{ fontSize: '0.66rem', color: selectedMacro === 'carbs' ? '#f59e0b' : 'var(--text-muted)', display: 'block', marginTop: '0.3rem', fontWeight: 600 }}>
            {selectedMacro === 'carbs' 
              ? (isRTL ? `متبقي ${remCarbs}g` : `${remCarbs}g left`) 
              : (isRTL ? 'طاقة ووقود التمرين' : 'Glycogen & stamina')}
          </span>
        </motion.div>

        {/* Fats Card */}
        <motion.div
          onClick={() => handleSelect('fats')}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: '0.75rem',
            background: selectedMacro === 'fats' ? 'rgba(236, 72, 153, 0.15)' : 'var(--bg-tertiary)',
            borderRadius: '12px',
            border: selectedMacro === 'fats' ? '1px solid #ec4899' : '1px solid rgba(236, 72, 153, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
            <span style={{ fontWeight: 700, color: '#ec4899', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>🥑</span> {isRTL ? 'الدهون' : 'Fats'}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              {Math.round((fats / (targetFats || 1)) * 100)}%
            </span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ec4899' }}>
            {fats}<small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>/{targetFats}g</small>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', marginTop: '0.35rem' }}>
            <div style={{ width: `${Math.min(100, (fats / (targetFats || 1)) * 100)}%`, height: '100%', background: '#ec4899', borderRadius: '999px' }} />
          </div>
          <span style={{ fontSize: '0.66rem', color: selectedMacro === 'fats' ? '#ec4899' : 'var(--text-muted)', display: 'block', marginTop: '0.3rem', fontWeight: 600 }}>
            {selectedMacro === 'fats' 
              ? (isRTL ? `متبقي ${remFats}g` : `${remFats}g left`) 
              : (isRTL ? 'التوازن الهرموني' : 'Hormonal balance')}
          </span>
        </motion.div>
      </div>
    </div>
  );
}

export default SegmentedMacroPill;
