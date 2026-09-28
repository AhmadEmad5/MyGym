import { AnimatePresence, motion } from 'framer-motion';
import { ProgramDeck3DCard } from '../ProgramDeck3DCard';
import type { PredefinedRoutine } from '../ProgramDeck3DCard';
import { ProgramEmptyState } from './ProgramEmptyState';

type ProgramListProps = {
  customPrograms: PredefinedRoutine[];
  templatePrograms: PredefinedRoutine[];
  isFiltered: boolean;
  isRTL: boolean;
  t: (key: any) => string;
  tTitle: (name: string) => string;
  onApply: (routine: PredefinedRoutine) => void;
  onEdit: (routine: PredefinedRoutine) => void;
  onDelete: (routine: PredefinedRoutine) => void;
  onCreateBlank: () => void;
  onOpenAI: () => void;
  onResetFilters: () => void;
};

function ProgramGrid({
  label,
  routines,
  custom,
  isRTL,
  t,
  tTitle,
  onApply,
  onEdit,
  onDelete
}: {
  label: string;
  routines: PredefinedRoutine[];
  custom: boolean;
  isRTL: boolean;
  t: (key: any) => string;
  tTitle: (name: string) => string;
  onApply: (routine: PredefinedRoutine) => void;
  onEdit: (routine: PredefinedRoutine) => void;
  onDelete: (routine: PredefinedRoutine) => void;
}) {
  if (routines.length === 0) return null;
  return (
    <section className="routine-program-section">
      <h2 className="routine-program-section-title">{label}</h2>
      <ul className="routines-card-grid" aria-label={label}>
        <AnimatePresence initial={false} mode="popLayout">
          {routines.map(routine => (
            <li key={routine.id} className="routine-program-list-item">
              <ProgramDeck3DCard
                routine={routine}
                onApply={onApply}
                onEdit={onEdit}
                onDelete={custom ? onDelete : undefined}
                isCustom={custom}
                isRTL={isRTL}
                t={t}
                tTitle={tTitle}
              />
            </li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}

export function ProgramList({
  customPrograms,
  templatePrograms,
  isFiltered,
  isRTL,
  t,
  tTitle,
  onApply,
  onEdit,
  onDelete,
  onCreateBlank,
  onOpenAI,
  onResetFilters
}: ProgramListProps) {
  if (customPrograms.length === 0 && templatePrograms.length === 0) {
    return (
      <ProgramEmptyState
        isRTL={isRTL}
        isFiltered={isFiltered}
        onResetFilters={onResetFilters}
        onOpenAI={onOpenAI}
        onCreateBlank={onCreateBlank}
      />
    );
  }

  return (
    <motion.div className="routine-program-deck" layout={false}>
      <ProgramGrid
        label={isRTL ? 'برامجك المخصصة' : 'Your custom programs'}
        routines={customPrograms}
        custom
        isRTL={isRTL}
        t={t}
        tTitle={tTitle}
        onApply={onApply}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <ProgramGrid
        label={isRTL ? 'مكتبة البرامج الجاهزة' : 'Program library'}
        routines={templatePrograms}
        custom={false}
        isRTL={isRTL}
        t={t}
        tTitle={tTitle}
        onApply={onApply}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </motion.div>
  );
}
