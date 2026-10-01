import { CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, Layers, List, Plus, Rows3, Sparkles, Trash2 } from 'lucide-react';

export type CalendarMode = 'week' | 'month' | 'list';

const MODES: { id: CalendarMode; icon: typeof Rows3; labelEn: string; labelAr: string }[] = [
  { id: 'week', icon: Rows3, labelEn: 'Week', labelAr: 'أسبوع' },
  { id: 'month', icon: LayoutGrid, labelEn: 'Month', labelAr: 'شهر' },
  { id: 'list', icon: List, labelEn: 'List', labelAr: 'قائمة' }
];

type CalendarHeaderProps = {
  isRTL: boolean;
  title: string;
  rangeLabel: string;
  isCurrentPeriod: boolean;
  periodLabel: string;
  mode: CalendarMode;
  plannedCount: number;
  t: (key: any) => string;
  onStep: (direction: -1 | 1) => void;
  onToday: () => void;
  onModeChange: (mode: CalendarMode) => void;
  onAddSession: () => void;
  onOpenAI: () => void;
  onClearPlanned: () => void;
  onOpenSplits?: () => void;
};

export function CalendarHeader({
  isRTL,
  title,
  rangeLabel,
  isCurrentPeriod,
  periodLabel,
  mode,
  plannedCount,
  t,
  onStep,
  onToday,
  onModeChange,
  onAddSession,
  onOpenAI,
  onClearPlanned,
  onOpenSplits
}: CalendarHeaderProps) {
  return (
    <header className="calendar-page-header">
      <div className="calendar-page-header-title">
        <h1>{title}</h1>
        <p className="calendar-page-header-range">
          <span className="calendar-range-label">{rangeLabel}</span>
          <span className={`calendar-period-chip ${isCurrentPeriod ? 'is-current' : ''}`}>{periodLabel}</span>
        </p>
      </div>

      <div className="calendar-page-header-tools">
        <div className="calendar-stepper" role="group" aria-label={isRTL ? 'التنقل بين الفترات' : 'Period navigation'}>
          <button
            type="button"
            className="calendar-stepper-btn"
            onClick={() => onStep(-1)}
            aria-label={t('previousWeek')}
          >
            <ChevronLeft
              width={16}
              height={16}
              aria-hidden="true"
              style={{ transform: isRTL ? 'scaleX(-1)' : undefined }}
            />
          </button>
          <button type="button" className="calendar-stepper-btn is-wide" onClick={onToday}>
            {t('today')}
          </button>
          <button
            type="button"
            className="calendar-stepper-btn"
            onClick={() => onStep(1)}
            aria-label={t('nextWeek')}
          >
            <ChevronRight
              width={16}
              height={16}
              aria-hidden="true"
              style={{ transform: isRTL ? 'scaleX(-1)' : undefined }}
            />
          </button>
        </div>

        <div className="calendar-mode-toggle" role="group" aria-label={isRTL ? 'نمط العرض' : 'Calendar view mode'}>
          {MODES.map(option => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                className="calendar-mode-btn"
                aria-pressed={mode === option.id}
                onClick={() => onModeChange(option.id)}
              >
                <Icon width={15} height={15} aria-hidden="true" />
                <span>{isRTL ? option.labelAr : option.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="calendar-page-header-actions">
        {onOpenSplits && (
          <button
            type="button"
            className="calendar-action-btn is-splits"
            onClick={onOpenSplits}
            style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.16) 0%, rgba(168, 85, 247, 0.14) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              fontWeight: 700
            }}
          >
            <Layers width={15} height={15} aria-hidden="true" />
            <span>{isRTL ? 'مكتبة الجداول' : 'Split Templates'}</span>
          </button>
        )}
        <button
          type="button"
          className="calendar-action-btn is-danger"
          onClick={onClearPlanned}
          disabled={plannedCount === 0}
        >
          <Trash2 width={15} height={15} aria-hidden="true" />
          <span>{isRTL ? 'مسح المجدول' : 'Clear planned'}</span>
          {plannedCount > 0 && <span className="calendar-action-count tabular-nums">{plannedCount}</span>}
        </button>
        <button type="button" className="calendar-action-btn is-ai" onClick={onOpenAI}>
          <Sparkles width={15} height={15} aria-hidden="true" />
          <span>{t('aiGenerator')}</span>
        </button>
        <button type="button" className="calendar-action-btn is-primary" onClick={onAddSession}>
          <Plus width={15} height={15} aria-hidden="true" />
          <span>{t('addSession')}</span>
        </button>
      </div>
    </header>
  );
}

export function MonthLegend({ isRTL }: { isRTL: boolean }) {
  return (
    <div className="calendar-density-legend" aria-hidden="true">
      <span className="calendar-density-legend-label">
        <CalendarDays width={14} height={14} />
        {isRTL ? 'كثافة التمارين' : 'Session density'}
      </span>
      <span className="calendar-density-legend-scale">
        <i data-level="0" /> {isRTL ? 'لا شيء' : 'None'}
        <i data-level="1" /> 1
        <i data-level="2" /> 2
        <i data-level="3" /> 3+
      </span>
    </div>
  );
}
