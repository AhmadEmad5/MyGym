import { Dumbbell, Layers, Plus, Sparkles } from 'lucide-react';
import { EmptyState } from '../ui';

type ProgramEmptyStateProps = {
  isRTL: boolean;
  isFiltered: boolean;
  onResetFilters: () => void;
  onOpenAI: () => void;
  onCreateBlank: () => void;
};

export function ProgramEmptyState({
  isRTL,
  isFiltered,
  onResetFilters,
  onOpenAI,
  onCreateBlank
}: ProgramEmptyStateProps) {
  if (isFiltered) {
    return (
      <EmptyState
        icon={<Layers width={26} height={26} />}
        title={isRTL ? 'لا توجد برامج مطابقة' : 'No programs match these filters'}
        description={
          isRTL
            ? 'جرّب توسيع البحث أو مسح عوامل التصفية لرؤية جميع البرامج التدريبية.'
            : 'Widen the search or clear the active filters to see every training program again.'
        }
        action={
          <button type="button" className="btn btn-secondary" onClick={onResetFilters}>
            {isRTL ? 'مسح عوامل التصفية' : 'Clear filters'}
          </button>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={<Dumbbell width={26} height={26} />}
      title={isRTL ? 'مكتبة البرامج فارغة' : 'Your program library is empty'}
      description={
        isRTL
          ? 'ابدأ بقالب جاهز أو دع الذكاء الاصطناعي يبني برنامجاً مخصصاً لأهدافك.'
          : 'Start from a proven template, or let the AI generator draft a program around your goals.'
      }
      action={
        <button type="button" className="btn btn-primary" onClick={onCreateBlank}>
          <Plus width={16} height={16} aria-hidden="true" />
          <span>{isRTL ? 'برنامج فارغ' : 'Blank program'}</span>
        </button>
      }
      secondaryAction={
        <button type="button" className="btn btn-secondary" onClick={onOpenAI}>
          <Sparkles width={16} height={16} aria-hidden="true" />
          <span>{isRTL ? 'توليد بالذكاء الاصطناعي' : 'Generate with AI'}</span>
        </button>
      }
    />
  );
}
