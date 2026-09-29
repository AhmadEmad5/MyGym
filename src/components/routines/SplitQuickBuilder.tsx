import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export type QuickSplit = {
  id: string;
  label: string;
  /** Saturday-first offsets (Sat = 0 ... Fri = 6), matching DAYS_OF_WEEK. */
  days: number[];
  daysLabelEn: string;
  daysLabelAr: string;
  accent: string;
};

export const QUICK_SPLITS: QuickSplit[] = [
  {
    id: 'ppl-routine',
    label: 'Push / Pull / Legs',
    days: [1, 3, 5],
    daysLabelEn: 'Sun • Tue • Thu',
    daysLabelAr: 'أحد • ثلاثاء • خميس',
    accent: '#38bdf8'
  },
  {
    id: 'upper-lower-routine',
    label: 'Upper / Lower',
    days: [0, 1, 3, 4],
    daysLabelEn: 'Sat • Sun • Tue • Wed',
    daysLabelAr: 'سبت • أحد • ثلاثاء • أربعاء',
    accent: '#a78bfa'
  },
  {
    id: 'arnold-split-6day',
    label: 'Arnold Split',
    days: [0, 2, 4],
    daysLabelEn: 'Sat • Mon • Wed',
    daysLabelAr: 'سبت • اثنين • أربعاء',
    accent: '#fbbf24'
  },
  {
    id: 'full-body-routine',
    label: 'Full Body 3x',
    days: [1, 3, 5],
    daysLabelEn: 'Sun • Tue • Thu',
    daysLabelAr: 'أحد • ثلاثاء • خميس',
    accent: '#34d399'
  }
];

type SplitQuickBuilderProps = {
  isRTL: boolean;
  onApplySplit: (split: QuickSplit) => void;
};

export function SplitQuickBuilder({ isRTL, onApplySplit }: SplitQuickBuilderProps) {
  return (
    <section className="split-quick-builder" aria-label={isRTL ? 'منشئ التقسيمات بنقرة واحدة' : 'One-tap split builder'}>
      <div className="split-quick-builder-head">
        <span className="split-quick-builder-icon" aria-hidden="true">
          <Zap width={20} height={20} />
        </span>
        <div>
          <h2 className="split-quick-builder-title">
            {isRTL ? 'منشئ التقسيمات بنقرة واحدة' : '1-Tap Split Builder'}
            <span className="split-quick-builder-tag">VIP INSTANT</span>
          </h2>
          <p className="split-quick-builder-sub">
            {isRTL
              ? 'اختر أي تقسيم عالمي بنقرة واحدة ليتم ضبط أيام التمرين وأوقات الاستشفاء آلياً'
              : 'Deploy any world-class split with 1 tap — auto-populates the schedule with optimal recovery days'}
          </p>
        </div>
      </div>

      <ul className="split-quick-builder-grid">
        {QUICK_SPLITS.map(split => (
          <li key={split.id}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onApplySplit(split)}
              className="split-quick-button"
              style={{ '--split-accent': split.accent } as CSSProperties}
            >
              <span className="split-quick-button-head">
                <span className="split-quick-button-label">{split.label}</span>
                <span className="split-quick-button-days tabular-nums">
                  {split.days.length} {isRTL ? 'أيام' : 'days'}
                </span>
              </span>
              <span className="split-quick-button-meta">
                {isRTL ? split.daysLabelAr : split.daysLabelEn}
              </span>
            </motion.button>
          </li>
        ))}
      </ul>
    </section>
  );
}
