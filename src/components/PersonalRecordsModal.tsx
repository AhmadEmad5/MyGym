import { useState, useMemo } from 'react';
import { Trophy, Search, Calendar, Award } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import { computeAllPersonalRecords } from '../lib/api';
import { ModalShell, SecondaryAction } from './AIMealVisionModal';

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

    const elite = isLowerBody ? 2.2 : 1.5;
    const advanced = isLowerBody ? 1.7 : 1.15;
    const intermediate = isLowerBody ? 1.2 : 0.8;

    if (ratio >= elite) {
      return { tierLabel: isRTL ? 'نخبة الأبطال' : 'Elite', badgeColor: '#c084fc', bgBadge: 'rgba(192, 132, 252, 0.15)', ratio };
    }
    if (ratio >= advanced) {
      return { tierLabel: isRTL ? 'متقدم' : 'Advanced', badgeColor: '#f59e0b', bgBadge: 'rgba(245, 158, 11, 0.15)', ratio };
    }
    if (ratio >= intermediate) {
      return { tierLabel: isRTL ? 'متوسط' : 'Intermediate', badgeColor: '#38bdf8', bgBadge: 'rgba(56, 189, 248, 0.15)', ratio };
    }
    return { tierLabel: isRTL ? 'مبتدئ' : 'Novice', badgeColor: '#10b981', bgBadge: 'rgba(16, 185, 129, 0.15)', ratio };
  };

  const recordsMap = useMemo(() => {
    if (!data) return {};
    return computeAllPersonalRecords(data.history || [], data.sessions || []);
  }, [data?.history, data?.sessions]);

  const recordsList = useMemo(() => {
    return Object.values(recordsMap).sort((a, b) => b.estimated1RM - a.estimated1RM);
  }, [recordsMap]);

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return recordsList;
    const q = query.toLowerCase();
    return recordsList.filter(record =>
      record.exerciseName.toLowerCase().includes(q) ||
      tExercise(record.exerciseName).toLowerCase().includes(q)
    );
  }, [recordsList, searchQuery, tExercise]);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      titleId="personal-records-title"
      title={t('personalRecords')}
      subtitle={t('personalRecordsDesc')}
      icon={<Trophy size={19} />}
      accent="#f59e0b"
      maxWidth={620}
      footer={
        <SecondaryAction onClick={onClose} fullWidth>
          {isRTL ? 'إغلاق' : 'Close'}
        </SecondaryAction>
      }
    >
      <div style={{ position: 'relative' }}>
        <label htmlFor="pr-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {t('searchExercises')}
        </label>
        <Search
          size={16}
          aria-hidden="true"
          style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '0.8rem', color: 'var(--text-muted)', pointerEvents: 'none' }}
        />
        <input
          id="pr-search"
          type="search"
          autoComplete="off"
          value={searchQuery}
          onChange={event => setSearchQuery(event.target.value)}
          placeholder={t('searchExercises')}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            fontSize: '1rem',
            minHeight: 46,
            paddingInlineStart: '2.4rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            outline: 'none'
          }}
        />
      </div>

      {filteredRecords.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
          <Trophy size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <p style={{ margin: 0, fontSize: '0.88rem' }}>{t('noPRsYet')}</p>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.76rem' }}>
            {isRTL
              ? 'سجّل مجموعة قوية في أي تمرين ليظهر رقمك القياسي هنا.'
              : 'Log a strong set on any lift and your record will show up here.'}
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filteredRecords.map((record, index) => {
            const dateObj = new Date(record.date);
            const dateStr = !Number.isNaN(dateObj.getTime()) ? formatDate(dateObj, 'MMM d, yyyy') : '';
            const std = getStrengthStandard(record.exerciseName, record.estimated1RM, record.unit);

            return (
              <li
                key={record.exerciseName}
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      width: '2.1rem',
                      height: '2.1rem',
                      borderRadius: '10px',
                      backgroundColor: index === 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(67, 220, 255, 0.1)',
                      border: `1px solid ${index === 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(67, 220, 255, 0.2)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: index === 0 ? '#f59e0b' : 'var(--accent-primary)',
                      flexShrink: 0
                    }}
                  >
                    #{index + 1}
                  </span>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{tExercise(record.exerciseName)}</h4>
                      <span
                        style={{
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          padding: '0.12rem 0.45rem',
                          borderRadius: '6px',
                          background: std.bgBadge,
                          color: std.badgeColor,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}
                      >
                        <Award size={10} />
                        <span>{std.tierLabel} · {std.ratio}× BW</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginTop: '0.2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      {dateStr && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={12} />
                          {dateStr}
                        </span>
                      )}
                      <span>{record.maxWeight} {record.unit} × {record.reps} {t('reps')}</span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: isRTL ? 'left' : 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>{t('best1RM')}</span>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', justifyContent: isRTL ? 'flex-start' : 'flex-end' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 850, color: 'var(--accent-primary)', fontVariantNumeric: 'tabular-nums' }}>{record.estimated1RM}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{record.unit}</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ModalShell>
  );
}
