import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GalleryHorizontal, LayoutGrid } from 'lucide-react';
import { ProgramDeck3DCard } from '../ProgramDeck3DCard';
import type { PredefinedRoutine } from '../ProgramDeck3DCard';
import { ProgramEmptyState } from './ProgramEmptyState';
import { Stagger, StaggerItem } from '../motion/Stagger';
import { Carousel } from '../ui/carousel';

type ProgramListProps = {
  customPrograms: PredefinedRoutine[];
  templatePrograms: PredefinedRoutine[];
  isFiltered: boolean;
  isRTL: boolean;
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
  tTitle,
  onApply,
  onEdit,
  onDelete,
  viewMode = 'carousel',
  onViewModeChange
}: {
  label: string;
  routines: PredefinedRoutine[];
  custom: boolean;
  isRTL: boolean;
  tTitle: (name: string) => string;
  onApply: (routine: PredefinedRoutine) => void;
  onEdit: (routine: PredefinedRoutine) => void;
  onDelete: (routine: PredefinedRoutine) => void;
  viewMode?: 'carousel' | 'grid';
  onViewModeChange?: (mode: 'carousel' | 'grid') => void;
}) {
  if (routines.length === 0) return null;
  return (
    <section className="routine-program-section">
      <div className="routine-program-section-header">
        <h2 className="routine-program-section-title">{label}</h2>
        {onViewModeChange && (
          <div className="routine-view-toggle" role="group" aria-label={isRTL ? 'نمط العرض' : 'View mode'}>
            <button
              type="button"
              className={`routine-view-toggle-btn ${viewMode === 'carousel' ? 'is-active' : ''}`}
              onClick={() => onViewModeChange('carousel')}
              aria-pressed={viewMode === 'carousel'}
              aria-label={isRTL ? 'عرض المعرض ثلاثي الأبعاد' : '3D Carousel'}
            >
              <GalleryHorizontal size={14} aria-hidden="true" />
              <span>{isRTL ? 'معرض ثلاثي الأبعاد' : '3D Carousel'}</span>
            </button>
            <button
              type="button"
              className={`routine-view-toggle-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
              onClick={() => onViewModeChange('grid')}
              aria-pressed={viewMode === 'grid'}
              aria-label={isRTL ? 'عرض الشبكة' : 'Grid'}
            >
              <LayoutGrid size={14} aria-hidden="true" />
              <span>{isRTL ? 'شبكة' : 'Grid'}</span>
            </button>
          </div>
        )}
      </div>

      {viewMode === 'carousel' ? (
        <Carousel isRTL={isRTL} cardWidth={360}>
          {routines.map(routine => (
            <div key={routine.id} className="w-full h-full pb-2">
              <ProgramDeck3DCard
                routine={routine}
                onApply={onApply}
                onEdit={onEdit}
                onDelete={custom ? onDelete : undefined}
                isCustom={custom}
                isRTL={isRTL}
                tTitle={tTitle}
              />
            </div>
          ))}
        </Carousel>
      ) : (
        <ul className="routines-card-grid" aria-label={label}>
          <Stagger>
            <AnimatePresence initial={false} mode="popLayout">
              {routines.map((routine, index) => (
                <StaggerItem key={routine.id} as="li" index={index} className="routine-program-list-item">
                  <ProgramDeck3DCard
                    routine={routine}
                    onApply={onApply}
                    onEdit={onEdit}
                    onDelete={custom ? onDelete : undefined}
                    isCustom={custom}
                    isRTL={isRTL}
                    tTitle={tTitle}
                  />
                </StaggerItem>
              ))}
            </AnimatePresence>
          </Stagger>
        </ul>
      )}
    </section>
  );
}

export function ProgramList({
  customPrograms,
  templatePrograms,
  isFiltered,
  isRTL,
  tTitle,
  onApply,
  onEdit,
  onDelete,
  onCreateBlank,
  onOpenAI,
  onResetFilters
}: ProgramListProps) {
  const [templateViewMode, setTemplateViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [customViewMode, setCustomViewMode] = useState<'carousel' | 'grid'>('grid');

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
        tTitle={tTitle}
        onApply={onApply}
        onEdit={onEdit}
        onDelete={onDelete}
        viewMode={customViewMode}
        onViewModeChange={customPrograms.length > 2 ? setCustomViewMode : undefined}
      />
      <ProgramGrid
        label={isRTL ? 'مكتبة البرامج الجاهزة' : 'Program library'}
        routines={templatePrograms}
        custom={false}
        isRTL={isRTL}
        tTitle={tTitle}
        onApply={onApply}
        onEdit={onEdit}
        onDelete={onDelete}
        viewMode={templateViewMode}
        onViewModeChange={setTemplateViewMode}
      />
    </motion.div>
  );
}
