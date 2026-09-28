import { motion } from 'framer-motion';
import { Droplet, Plus } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { gymAudio } from '../../lib/audio';
import { useFormaReducedMotion } from '../TodayBentoGrid';

interface MobileFloorVitalsProps {
  waterAmount: number;
  waterGoal?: number;
  onQuickWater: (amount: number) => void | Promise<void>;
  calories: number;
  calorieGoal?: number;
  protein: number;
  proteinGoal?: number;
  onOpenNutrition?: () => void;
  isBusy?: boolean;
  errorMessage?: string;
}

const percent = (value: number, goal: number) => (goal > 0 ? Math.min(100, Math.max(0, Math.round((value / goal) * 100))) : 0);

export function MobileFloorVitals({
  waterAmount,
  waterGoal = 3000,
  onQuickWater,
  calories,
  calorieGoal = 2500,
  protein,
  proteinGoal = 150,
  onOpenNutrition,
  isBusy = false,
  errorMessage,
}: MobileFloorVitalsProps) {
  const { isRTL } = useTranslation();
  const reduceMotion = useFormaReducedMotion();

  const waterPercent = percent(waterAmount, waterGoal);
  const calPercent = percent(calories, calorieGoal);
  const tapProps = reduceMotion ? {} : { whileTap: { scale: 0.98 } as const };

  const handleAddWater = (event: React.MouseEvent) => {
    event.stopPropagation();
    gymAudio.triggerSubtleHaptic([20]);
    void onQuickWater(250);
  };

  return (
    <div className="mobile-floor-vitals" role="group" aria-label={isRTL ? 'مؤشرات سريعة' : 'Quick vitals'}>
      <div className="mobile-vital-tile is-water">
        <div
          className="mobile-vital-fill"
          style={{ blockSize: `${Math.max(6, waterPercent)}%` }}
          aria-hidden="true"
        />
        <div className="mobile-vital-copy">
          <span className="mobile-vital-icon" aria-hidden="true">
            <Droplet size={16} className="fill-current" />
          </span>
          <div>
            <p className="mobile-vital-value tabular-nums" dir="ltr">
              {waterAmount}
              <small>ml</small>
            </p>
            <p className="mobile-vital-label">
              <span
                className="mobile-vital-progress"
                role="img"
                aria-label={isRTL ? `الماء ${waterPercent} بالمئة من الهدف` : `Water ${waterPercent} percent of goal`}
              >
                {isRTL ? 'الماء' : 'Goal'} {waterPercent}%
              </span>
            </p>
          </div>
        </div>
        <motion.button
          type="button"
          className="mobile-vital-action"
          whileTap={reduceMotion ? undefined : { scale: 0.88 }}
          onClick={handleAddWater}
          disabled={isBusy}
          aria-label={isRTL ? 'أضف 250 مل ماء' : 'Add 250 ml of water'}
        >
          <Plus size={15} aria-hidden="true" />
        </motion.button>
      </div>

      <motion.button
        type="button"
        className="mobile-vital-tile is-nutrition"
        {...tapProps}
        onClick={onOpenNutrition}
        disabled={!onOpenNutrition}
        aria-label={
          isRTL
            ? `السعرات ${calories} من ${calorieGoal}، بروتين ${protein} من ${proteinGoal} جرام. فتح التغذية.`
            : `${calories} of ${calorieGoal} calories, ${protein} of ${proteinGoal} grams protein. Open nutrition.`
        }
      >
        <span className="mobile-vital-row">
          <span className="mobile-vital-value tabular-nums" dir="ltr">
            {calories}
            <small>kcal</small>
          </span>
          <span className="mobile-vital-value is-protein tabular-nums" dir="ltr">
            {protein}
            <small>/{proteinGoal}g</small>
          </span>
        </span>
        <span className="mobile-vital-track" aria-hidden="true">
          <span style={{ inlineSize: `${calPercent}%` }} />
        </span>
        <span className="mobile-vital-label">{isRTL ? 'التغذية' : 'Nutrition'}</span>
      </motion.button>

      {errorMessage && (
        <p className="mobile-vital-error" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
