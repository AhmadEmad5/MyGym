import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Search, X, Calendar, Award } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import { computeAllPersonalRecords } from '../lib/api';

interface PersonalRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PersonalRecordsModal({ isOpen, onClose }: PersonalRecordsModalProps) {
  const { data } = useData();
  const { t, isRTL, formatDate, tExercise } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const userBodyweight = useMemo(() => {
    const latestMetric = data?.bodyMetrics?.[data.bodyMetrics.length - 1];
    if (latestMetric?.weight && latestMetric.weight > 0) {
      return { weight: latestMetric.weight, unit: latestMetric.unit || 'kg' };
    }
    return { weight: 75, unit: 'kg' as const };
  }, [data?.bodyMetrics]);

  const getStrengthStandard = (exerciseName: string, est1RM: number, unit: 'kg' | 'lb') => {
    const est1RMkg = unit === 'lb' ? est1RM * 0.453592 : est1RM;
    const bwKg = userBodyweight.unit === 'lb' ? userBodyweight.weight * 0.453592 : userBodyweight.weight;
    const ratio = bwKg > 0 ? Number((est1RMkg / bwKg).toFixed(2)) : 1.0;

    const lowerName = exerciseName.toLowerCase();
    const isLowerBody = lowerName.includes('squat') || lowerName.includes('deadlift') || lowerName.includes('leg');

    let tierLabel = '';
    let badgeColor = '';
    let bgBadge = '';

    if (isLowerBody) {
      if (ratio >= 2.2) {
        tierLabel = isRTL ? 'نخبة الأبطال' : 'Elite';
        badgeColor = '#c084fc';
        bgBadge = 'rgba(192, 132, 252, 0.15)';
      } else if (ratio >= 1.7) {
        tierLabel = isRTL ? 'متقدم' : 'Advanced';
        badgeColor = '#f59e0b';
        bgBadge = 'rgba(245, 158, 11, 0.15)';
      } else if (ratio >= 1.2) {
        tierLabel = isRTL ? 'متوسط' : 'Intermediate';
        badgeColor = '#38bdf8';
        bgBadge = 'rgba(56, 189, 248, 0.15)';
      } else {
        tierLabel = isRTL ? 'مبتدئ' : 'Novice';
        badgeColor = '#10b981';
        bgBadge = 'rgba(16, 185, 129, 0.15)';
      }
    } else {
      if (ratio >= 1.5) {
        tierLabel = isRTL ? 'نخبة الأبطال' : 'Elite';
        badgeColor = '#c084fc';
        bgBadge = 'rgba(192, 132, 252, 0.15)';
      } else if (ratio >= 1.15) {
        tierLabel = isRTL ? 'متقدم' : 'Advanced';
        badgeColor = '#f59e0b';
        bgBadge = 'rgba(245, 158, 11, 0.15)';
      } else if (ratio >= 0.8) {
        tierLabel = isRTL ? 'متوسط' : 'Intermediate';
        badgeColor = '#38bdf8';
        bgBadge = 'rgba(56, 189, 248, 0.15)';
      } else {
        tierLabel = isRTL ? 'مبتدئ' : 'Novice';
        badgeColor = '#10b981';
        bgBadge = 'rgba(16, 185, 129, 0.15)';
      }
    }

    return { tierLabel, badgeColor, bgBadge, ratio };
  };

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const recordsMap = useMemo(() => {
    if (!data) return {};
    return computeAllPersonalRecords(data.history || [], data.sessions || []);
  }, [data?.history, data?.sessions]);

  const recordsList = useMemo(() => {
    const list = Object.values(recordsMap);
    // Sort by estimated 1RM descending
    return list.sort((a, b) => b.estimated1RM - a.estimated1RM);
  }, [recordsMap]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return recordsList;
    const q = searchQuery.toLowerCase().trim();
    return recordsList.filter(r => 
      r.exerciseName.toLowerCase().includes(q) ||
      tExercise(r.exerciseName).toLowerCase().includes(q)
    );
  }, [recordsList, searchQuery, tExercise]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="portal-modal-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.75rem'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="modal-card"
          style={{
            width: '100%',
            maxWidth: '620px',
            maxHeight: '85vh',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-xl, 20px)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            direction: isRTL ? 'rtl' : 'ltr'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-tertiary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Trophy className="w-5 h-5" style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  {t('personalRecords')}
                </h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {t('personalRecordsDesc')}
                </p>
              </div>
            </div>

            <button
              className="btn-icon btn-ghost"
              onClick={onClose}
              style={{ padding: '0.4rem' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative' }}>
              <Search
                className="w-4 h-4"
                style={{
                  position: 'absolute',
                  [isRTL ? 'right' : 'left']: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                className="input"
                style={{
                  width: '100%',
                  paddingTop: '0.6rem',
                  paddingBottom: '0.6rem',
                  [isRTL ? 'paddingRight' : 'paddingLeft']: '2.4rem'
                }}
                placeholder={t('searchExercises')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Records List */}
          <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{t('noPRsYet')}</p>
              </div>
            ) : (
              filteredRecords.map((record, index) => {
                const dateObj = new Date(record.date);
                const dateStr = !isNaN(dateObj.getTime()) ? formatDate(dateObj, 'MMM d, yyyy') : '';
                const std = getStrengthStandard(record.exerciseName, record.estimated1RM, record.unit);

                return (
                  <motion.div
                    key={record.exerciseName}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    style={{
                      padding: '1rem 1.25rem',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg, 14px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '2.2rem',
                          height: '2.2rem',
                          borderRadius: '10px',
                          backgroundColor: index === 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(67, 220, 255, 0.1)',
                          border: `1px solid ${index === 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(67, 220, 255, 0.2)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: index === 0 ? '#f59e0b' : 'var(--accent-primary)'
                        }}
                      >
                        #{index + 1}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600 }}>
                            {tExercise(record.exerciseName)}
                          </h4>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.12rem 0.45rem',
                            borderRadius: '6px',
                            background: std.bgBadge,
                            color: std.badgeColor,
                            border: `1px solid ${std.badgeColor}40`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}>
                            <Award size={10} />
                            <span>{std.tierLabel} · {std.ratio}x BW</span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {dateStr && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Calendar className="w-3.5 h-3.5" />
                              {dateStr}
                            </span>
                          )}
                          <span>
                            {record.maxWeight} {record.unit} × {record.reps} {t('reps')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                        {t('best1RM')}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', justifyContent: isRTL ? 'flex-start' : 'flex-end' }}>
                        <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-primary)', fontVariantNumeric: 'tabular-nums' }}>
                          {record.estimated1RM}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {record.unit}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
