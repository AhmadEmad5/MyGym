import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { ArrowLeft, Plus, Check, Play, Square, Trash2, GripVertical, Camera, X, CirclePlay, ExternalLink, Bell } from 'lucide-react';
import { WorkoutSession, SetRecord, SessionExercise, estimateWorkoutCalories } from '../lib/api';
import { useData } from '../hooks/useData';
import { Modal } from '../components/Modal';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';

function ExerciseCard({ 
  exercise, 
  exIndex, 
  updateSet, 
  addSet,
  updateExercise,
  deleteExercise,
  deleteSet
}: { 
  exercise: SessionExercise, 
  exIndex: number, 
  updateSet: (exIndex: number, setIndex: number, field: keyof SetRecord, value: any) => void,
  addSet: (exIndex: number) => void,
  updateExercise: (exIndex: number, field: keyof SessionExercise, value: any) => void,
  deleteExercise: (exIndex: number) => void,
  deleteSet: (exIndex: number, setIndex: number) => void
}) {
  const { t, tExercise, tMuscle, isRTL } = useTranslation();
  const controls = useDragControls();
  
  const isCardio = exercise.targetMuscle === 'Cardio';
  const [cardioTimer, setCardioTimer] = useState<number | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const tutorialSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name} proper form tutorial`)}`;
  const embeddedTutorialUrl = exercise.videoUrl?.replace('www.youtube.com/embed/', 'www.youtube-nocookie.com/embed/');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cardioTimer !== null && cardioTimer > 0) {
      interval = setInterval(() => {
        setCardioTimer(t => (t ? t - 1 : 0));
      }, 1000);
    } else if (cardioTimer === 0) {
      gymAudio.playRestTimerChime();
      gymAudio.triggerVibration();
      setCardioTimer(null);
    }
    return () => clearInterval(interval);
  }, [cardioTimer]);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateExercise(exIndex, 'imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Reorder.Item 
      value={exercise}
      className="card" 
      style={{ backgroundColor: 'var(--bg-tertiary)' }}
      dragControls={controls}
      dragListener={false}
      whileDrag={{ scale: 1.02, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', padding: '0.25rem', cursor: 'grab', touchAction: 'none' }}
            title="Drag to reorder"
            onPointerDown={(e) => controls.start(e)}
          >
            <GripVertical className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{tExercise(exercise.name)}</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{tMuscle(exercise.targetMuscle)}</p>
          </div>
        </div>
        <button
          type="button"
          className="btn-icon btn-ghost"
          style={{ color: 'var(--danger, #ef4444)', padding: '0.35rem' }}
          title={t('deleteExercise')}
          onClick={() => deleteExercise(exIndex)}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="exercise-tutorial">
        <div><CirclePlay size={18} /><span><strong>{t('formGuideTutorial')}</strong></span></div>
        {embeddedTutorialUrl ? <button type="button" className="tutorial-trigger" onClick={() => setIsTutorialOpen(open => !open)}>{isTutorialOpen ? (isRTL ? 'إخفاء الفيديو' : 'Hide video') : (isRTL ? 'مشاهدة الشرح' : 'Watch tutorial')} <Play size={14} fill="currentColor" /></button> : <a className="tutorial-trigger" href={tutorialSearchUrl} target="_blank" rel="noreferrer">{isRTL ? 'بحث عن فيديو' : 'Find video'} <ExternalLink size={14} /></a>}
      </div>
      <AnimatePresence initial={false}>
        {isTutorialOpen && embeddedTutorialUrl && <motion.div className="tutorial-player" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}><iframe width="100%" height="100%" src={`${embeddedTutorialUrl}?rel=0&modestbranding=1`} title={`${exercise.name} video tutorial`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></motion.div>}
      </AnimatePresence>

      {isCardio ? (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('cardioDuration')}</label>
              <input 
                type="number" 
                className="input" 
                value={exercise.duration || 0} 
                onChange={e => updateExercise(exIndex, 'duration', parseInt(e.target.value) || 0)}
                disabled={cardioTimer !== null}
              />
            </div>
            {cardioTimer === null ? (
              <button className="btn btn-primary" onClick={() => setCardioTimer((exercise.duration || 0) * 60)} style={{ marginTop: '1.25rem' }}>
                {t('startTimer')}
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={() => setCardioTimer(null)} style={{ marginTop: '1.25rem' }}>
                {t('stopTimer')}
              </button>
            )}
          </div>

          {cardioTimer !== null && (
            <div style={{ fontSize: '3.5rem', fontWeight: 800, textAlign: 'center', margin: '2rem 0', color: 'var(--accent-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(cardioTimer)}
            </div>
          )}

          {(cardioTimer === 0 || exercise.imageUrl) && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t('treadmillCapture')}</h4>
              {exercise.imageUrl ? (
                <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <img src={exercise.imageUrl} alt="Treadmill screen" style={{ width: '100%', display: 'block' }} />
                  <button 
                    className="btn-icon" 
                    style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
                    onClick={() => updateExercise(exIndex, 'imageUrl', undefined)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <Camera className="w-4 h-4" /> {t('takePicture')}
                  <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleCapture} />
                </label>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRTL ? 'right' : 'left', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <th style={{ padding: '0.5rem 0', width: '2.5rem', textAlign: isRTL ? 'right' : 'left' }}>{t('setWord')}</th>
                <th style={{ padding: '0.5rem', textAlign: isRTL ? 'right' : 'left' }}>{t('weight')}</th>
                <th style={{ padding: '0.5rem', textAlign: isRTL ? 'right' : 'left' }}>{t('reps')}</th>
                <th style={{ padding: '0.5rem', width: '3rem', textAlign: 'center' }}>{t('done')}</th>
                <th style={{ padding: '0.5rem', width: '2.5rem', textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {exercise.sets.map((set, setIndex) => (
                  <motion.tr 
                    key={set.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ 
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: set.isCompleted ? 'var(--bg-secondary)' : 'transparent',
                      transition: 'background-color 0.3s ease'
                    }}
                  >
                    <td style={{ padding: '0.5rem 0', fontWeight: 500 }}>{setIndex + 1}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input 
                          type="number" 
                          className="input" 
                          style={{ width: '4rem', padding: '0.25rem 0.5rem' }} 
                          value={set.weight}
                          onChange={(e) => updateSet(exIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                          disabled={set.isCompleted}
                        />
                        <button 
                          className="btn-ghost" 
                          style={{ padding: '0.25rem', fontSize: '0.75rem', borderRadius: '4px' }}
                          onClick={() => updateSet(exIndex, setIndex, 'unit', set.unit === 'lb' ? 'kg' : 'lb')}
                          disabled={set.isCompleted}
                        >
                          {set.unit}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input 
                        type="number" 
                        className="input" 
                        style={{ width: '4rem', padding: '0.25rem 0.5rem' }} 
                        value={set.repsActual}
                        onChange={(e) => updateSet(exIndex, setIndex, 'repsActual', parseInt(e.target.value) || 0)}
                        disabled={set.isCompleted}
                      />
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <motion.button 
                        whileTap={{ scale: 0.8 }}
                        className={`btn-icon ${set.isCompleted ? '' : 'btn-ghost'}`}
                        style={{ 
                          backgroundColor: set.isCompleted ? 'var(--success)' : 'transparent',
                          color: set.isCompleted ? 'white' : 'inherit',
                          padding: '0.25rem' 
                        }}
                        onClick={() => updateSet(exIndex, setIndex, 'isCompleted', !set.isCompleted)}
                      >
                        <Check className="w-5 h-5" />
                      </motion.button>
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      {exercise.sets.length > 1 && (
                        <button
                          type="button"
                          className="btn-icon btn-ghost"
                          style={{ color: 'var(--text-muted)', padding: '0.2rem' }}
                          title={t('deleteSet')}
                          onClick={() => deleteSet(exIndex, setIndex)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          <button className="btn-ghost" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', color: 'var(--accent-primary)', fontWeight: 500 }} onClick={() => addSet(exIndex)}>
            <Plus className="w-4 h-4" /> {t('addSet')}
          </button>
        </>
      )}
    </Reorder.Item>
  );
}

const DEFAULT_EXERCISES = [
  { name: 'Treadmill', targetMuscle: 'Cardio' },
  { name: 'Stationary Bike', targetMuscle: 'Cardio' },
  { name: 'Stairmaster', targetMuscle: 'Cardio' },
  { name: 'Elliptical', targetMuscle: 'Cardio' },
  { name: 'Rowing Machine', targetMuscle: 'Cardio' },
  { 
    name: 'Seated Machine Chest Press', 
    targetMuscle: 'Chest', 
    notes: 'يستهدف هذا التمرين منتصف الصدر لبناء الكتلة العضلية الإجمالية. يوفر الجهاز مساراً ثابتاً للحركة مما يجعله آمناً لرفع أوزان ثقيلة دون الحاجة لتوازن الأوزان الحرة.\n\nنصيحة للأداء: اسحب كتفيك للخلف وللأسفل (ضم لوحي الكتف) وألصق ظهرك بالمسند. ادفع الوزن باستخدام عضلات صدرك، ولا تفرد كوعيك (Lockout) بالكامل في نهاية الحركة للحفاظ على الضغط المستمر على العضلة.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Machine Chest Press Form Short' 
  },
  { 
    name: 'Incline Machine Chest Press', 
    targetMuscle: 'Chest', 
    notes: 'تمرين لا غنى عنه لتطوير الجزء العلوي من الصدر، وهو الجزء الذي يعطي الصدر مظهراً ممتلئاً وبارزاً من الأعلى (عند عظمة الترقوة).\n\nنصيحة للأداء: اضبط ارتفاع المقعد بحيث تكون المقابض في مستوى الجزء العلوي من صدرك. حافظ على صدرك مرفوعاً وظهرك مقوساً قليلاً بشكل طبيعي طوال الرفعة.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Incline Machine Chest Press Form Short' 
  },
  { 
    name: 'High-to-Low Cable Crossover', 
    targetMuscle: 'Chest', 
    notes: 'هذا التمرين ممتاز لاستهداف الجزء السفلي من الصدر وإعطاء العضلة التحديد السفلي، بالإضافة إلى التركيز على الخط الداخلي. الكيبل يوفر مقاومة مستمرة من بداية التمدد حتى أقصى نقطة انقباض.\n\nنصيحة للأداء: قف في منتصف الجهاز وخذ خطوة صغيرة للأمام. اثن كوعيك قليلاً (كأنك تعانق شجرة ضخمة)، واسحب الكيابل للأسفل حتى تتلاقى يداك أمام حوضك، واعصر عضلة الصدر بقوة في هذه النقطة لتفعيل الجزء الداخلي.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن High to Low Cable Crossover Form Short' 
  },
  { name: 'Lat Pulldown', targetMuscle: 'Back' },
  { name: 'Barbell Row', targetMuscle: 'Back' },
  { 
    name: 'Wide-Grip Lat Pulldown', 
    targetMuscle: 'Back', 
    notes: 'يستهدف هذا التمرين العضلة الظهرية العريضة (المجنص - Lats) بشكل أساسي، وهو المسؤول الأول عن إعطاء الظهر المظهر العريض (V-Shape).\n\nنصيحة للأداء: اسحب البار باتجاه أعلى صدرك مع إرجاع كتفيك للخلف وللأسفل، واحرص على عدم الميل بجذعك للخلف بشكل مبالغ فيه.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Wide Grip Lat Pulldown Form Short'
  },
  { 
    name: 'Seated Cable Row', 
    targetMuscle: 'Back', 
    notes: 'يركز على عضلات منتصف الظهر (Rhomboids) وشبه المنحرف (Traps) بالإضافة للمجنص، مما يمنح الظهر سماكة وعمقاً عضلياً من الداخل.\n\nنصيحة للأداء: حافظ على استقامة أسفل ظهرك. عند سحب الوزن، تخيل أنك تحاول عصر قلم بين لوحي كتفك، واسمح لكتفيك بالتمدد للأمام عند العودة.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Seated Cable Row Form Short'
  },
  { 
    name: 'Chest-Supported Machine Row', 
    targetMuscle: 'Back', 
    notes: 'يوفر هذا الجهاز عزلاً تاماً لعضلات الظهر العلوية والوسطى. مسند الصدر يمنعك من استخدام قوة الدفع (الأرجحة) ويزيل الضغط تماماً عن فقرات أسفل الظهر، مما يجعله آمناً وفعالاً لرفع أوزان ثقيلة.\n\nنصيحة للأداء: ألصق صدرك بالمسند طوال الحركة. اسحب المقابض للخلف مع إبقاء كوعيك قريبين من جسمك لاستهداف المجنص، أو افتح كوعيك قليلاً لاستهداف أعلى الظهر.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Chest Supported Row Machine Form Short'
  },
  { 
    name: 'Back Extension', 
    targetMuscle: 'Back', 
    notes: 'تمرين أساسي لعزل وتقوية عضلات أسفل الظهر (Erector Spinae)، مما يحسن من استقامتك ويحميك من الإصابات.\n\nنصيحة للأداء: اضبط الوسادة لتكون أسفل حوضك مباشرة. انزل ببطء، ثم ارتفع للأعلى حتى يستقيم جسمك فقط (تجنب التقوس المفرط للخلف في أعلى نقطة).\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Back Extension Form Short'
  },
  { 
    name: 'Cable Reverse Curl', 
    targetMuscle: 'Forearms', 
    notes: 'يستهدف هذا التمرين العضلة العضدية الكعبرية (الجزء العلوي والجانبي من الساعد) بشكل أساسي، مما يعطي الساعد مظهراً عريضاً من الخارج.\n\nنصيحة للأداء: استخدم البار المستقيم أو المتعرج (EZ Bar) بالكيبل السفلي. امسك البار بقبضة علوية (راحة اليد تواجه الأرض)، وحافظ على ثبات كوعيك بجانبك أثناء سحب الوزن للأعلى.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Cable Reverse Curl Form Short'
  },
  { 
    name: 'Cable Wrist Curl', 
    targetMuscle: 'Forearms', 
    notes: 'يركز هذا التمرين على عضلات الثني (الجزء الداخلي من الساعد)، وهو الجزء المسؤول عن إعطاء الساعد الكتلة العضلية الأكبر والحجم الدائري.\n\nنصيحة للأداء: اسحب مقعداً أمام جهاز الكيبل السفلي، وضع ساعديك على فخذيك أو على المقعد بحيث تتدلى معاصمك خارج الحافة. دع البار ينزل حتى أطراف أصابعك للحصول على أقصى تمدد، ثم اقبض معصمك للأعلى بقوة.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Seated Cable Wrist Curl Form Short'
  },
  { 
    name: 'Cable Reverse Wrist Curl', 
    targetMuscle: 'Forearms', 
    notes: 'يستهدف عضلات التمديد (الجزء الخارجي والعلوي من الساعد). تقوية هذا الجزء ضرورية جداً لتوازن القوة في الذراع ومنع الإصابات أو آلام مفصل المعصم (مثل التهاب الأوتار).\n\nنصيحة للأداء: بنفس وضعية التمرين السابق، لكن اجعل راحة يدك تواجه الأرض. ارفع معصمك للأعلى باتجاه جسمك ببطء، وتحكم بالوزن أثناء النزول. لا تستخدم أوزاناً ثقيلة جداً هنا لتجنب إرهاق المفصل.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Cable Reverse Wrist Curl Form Short'
  },
  { name: 'Overhead Press', targetMuscle: 'Shoulders' },
  { name: 'Lateral Raises', targetMuscle: 'Shoulders' },
  {
    name: 'Machine Shoulder Press',
    targetMuscle: 'Shoulders',
    notes: 'يستهدف هذا الجهاز الرأس الأمامي والجانبي بشكل أساسي لبناء الحجم الإجمالي للكتف. الجهاز يوفر ثباتاً عالياً مما يسمح لك برفع أوزان ثقيلة بأمان تام مقارنة بالدمبلز.\n\nنصيحة للأداء: لا تجعل كوعيك مفتوحين للخارج بزاوية 90 درجة؛ بل اجعلهما يميلان للأمام قليلاً (حوالي 45 درجة) لحماية مفصل الكتف من الإصابة.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Machine Shoulder Press Form Short'
  },
  {
    name: 'Cable Lateral Raise',
    targetMuscle: 'Shoulders',
    notes: 'هذا التمرين هو السر للحصول على أكتاف عريضة ومكورة (3D). الكيبل يتفوق على الدمبل هنا لأنه يحافظ على الشد العضلي (Tension) من بداية الحركة في الأسفل وحتى نهايتها.\n\nنصيحة للأداء: اجعل الكيبل يمر من خلف ظهرك أو من أمامك، وارفع ذراعك للجانب مع ميلان بسيط للأمام. تخيل أنك تدفع الوزن بعيداً عنك وليس فقط للأعلى.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Cable Lateral Raise Form Short'
  },
  {
    name: 'Reverse Pec Deck Machine',
    targetMuscle: 'Shoulders',
    notes: 'الكتف الخلفي غالباً ما يتم إهماله، وتقويته ضرورية جداً لاستقامة المظهر (Posture) واكتمال شكل الكتف. هذا الجهاز يعزل الكتف الخلفي بفعالية دون تدخل عضلات الظهر.\n\nنصيحة للأداء: اضبط المقعد بحيث تكون يداك في مستوى كتفيك. ادفع المقابض للخارج، وتجنب عصر لوحي كتفك للخلف بقوة لضمان بقاء الضغط على الكتف الخلفي وليس على عضلات الظهر.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Reverse Pec Deck Rear Delt Form Short'
  },
  { name: 'Barbell Back Squat', targetMuscle: 'Legs' },
  { name: 'Leg Press', targetMuscle: 'Legs' },
  { name: 'Romanian Deadlift', targetMuscle: 'Legs' },
  { name: 'Bicep Curls', targetMuscle: 'Biceps' },
  { 
    name: 'Machine Preacher Curl', 
    targetMuscle: 'Biceps', 
    videoUrl: 'https://www.youtube.com/embed/S4dDLFp3e8w', 
    notes: 'هذا التمرين هو البديل المثالي للبار، حيث يعزل عضلة البايسيبس بالكامل ويمنعك من الأرجحة بفضل وسادة الارتكاز. يركز بشكل كبير على الرأس القصير (Short Head) لزيادة الكتلة الإجمالية للعضلة.\n\nنصيحة للأداء: ألصق إبطك جيداً بالوسادة ولا ترفع كوعك عن السطح أبداً أثناء سحب الوزن.'
  },
  { 
    name: 'Behind-The-Back Cable Curl', 
    targetMuscle: 'Biceps', 
    videoUrl: 'https://www.youtube.com/embed/unQKwAs4Svc', 
    notes: 'هذا هو البديل الأفضل للدمبلز على المقعد المائل. نظراً لأن الكيبل يسحب ذراعك للخلف، فإنه يضع "الرأس الطويل" (Long Head) تحت أقصى درجات التمدد، وهو أمر أساسي لبناء وتكوير قمة البايسيبس (Bicep Peak).\n\nنصيحة للأداء: خذ خطوة للأمام بعيداً عن جهاز الكيبل، وحافظ على ثبات كوعك خلف مستوى جسمك طوال الحركة.'
  },
  { 
    name: 'Rope Cable Hammer Curl', 
    targetMuscle: 'Biceps', 
    videoUrl: 'https://www.youtube.com/embed/wGukDGOJYAs', 
    notes: 'بديل ممتاز لتمرين المطرقة بالدمبل، حيث يوفر الكيبل مقاومة ثابتة لا تضعف في أي نقطة من الرفعة. يستهدف العضلة العضدية (Brachialis) الموجودة أسفل البايسيبس لزيادة سمك وعرض الذراع بشكل عام.\n\nنصيحة للأداء: ثبت كوعيك بجانبك تماماً، واحرص على المباعدة بين طرفي الحبل قليلاً عند الوصول لأعلى نقطة لزيادة الانقباض.'
  },
  { 
    name: 'Cable Rope Triceps Pushdown', 
    targetMuscle: 'Triceps', 
    notes: 'يستهدف هذا التمرين الرأس الجانبي (Lateral Head) بشكل رئيسي، وهو الجزء الذي يعطي الذراع العرض والمظهر الجانبي البارز. استخدام الحبل يسمح بمدى حركي أطول مقارنة بالبار.\n\nنصيحة للأداء: ثبت كوعيك بإحكام بجانب خصرك. ادفع الحبل للأسفل وعند الوصول لأدنى نقطة، باعد بين طرفي الحبل للخارج لزيادة الانقباض.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Cable Rope Triceps Pushdown Form Short' 
  },
  { 
    name: 'Overhead Cable Triceps Extension', 
    targetMuscle: 'Triceps', 
    notes: 'هذا التمرين ضروري لاستهداف "الرأس الطويل" (Long Head)، والذي يشكل الجزء الأكبر من حجم الترايسيبس. رفع الذراع فوق مستوى الرأس يضع العضلة تحت أقصى درجات التمدد.\n\nنصيحة للأداء: استخدم الحبل واسحب الكيبل من الأسفل أو من مستوى الكتف. حافظ على ثبات كوعيك واتجاههما للأمام، وافرد ذراعيك بالكامل مع ثبات الجذع.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Overhead Cable Triceps Extension Form Short' 
  },
  { 
    name: 'Triceps Dip Machine', 
    targetMuscle: 'Triceps', 
    notes: 'هذا الجهاز هو البديل الآمن لتمرين الغطس الحر (Dips). يستهدف الرؤوس الثلاثة معاً لبناء كتلة عضلية شاملة، ويسمح لك برفع أوزان ثقيلة دون المخاطرة بأربطة الكتف.\n\nنصيحة للأداء: حافظ على استقامة ظهرك والتصاقه بالمسند. ادفع المقابض للأسفل باستخدام الترايسيبس وتجنب الميل بجذعك للأمام حتى لا ينتقل الضغط إلى عضلات الصدر، وتحكم بالوزن أثناء العودة للأعلى.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Triceps Dip Machine Form Short' 
  },
  { 
    name: 'Kneeling Cable Crunch', 
    targetMuscle: 'Core', 
    notes: 'يستهدف هذا التمرين عضلات البطن الأمامية (Rectus Abdominis - العضلات السداسية). الكيبل يوفر مقاومة ممتازة تجبر عضلات البطن على العمل بجهد لثني الجذع.\n\nنصيحة للأداء: امسك الحبل خلف رقبتك أو بجانب أذنيك. ثبت حوضك تماماً (لا تجلس على كعبيك أثناء النزول)، وتخيل أنك تحاول تقريب قفصك الصدري من حوضك باستخدام عضلات بطنك فقط، وليس بسحب الحبل بذراعيك.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Kneeling Cable Crunch Form Short' 
  },
  { 
    name: 'Ab Crunch Machine', 
    targetMuscle: 'Core', 
    notes: 'بديل ممتاز للكرنش الأرضي، يوفر عزلاً عالياً جداً لعضلات البطن بالكامل ويحمي أسفل الظهر بفضل مسند الجهاز.\n\nنصيحة للأداء: اضبط المقعد بحيث يكون محور دوران الجهاز موازياً لأسفل صدرك أو بطنك (حسب تصميم الجهاز). أخرج الزفير (تنفس للخارج) بالكامل عند عصر عضلات بطنك للأسفل للحصول على أقصى انقباض عضلي.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Ab Crunch Machine Form Short' 
  },
  { 
    name: 'Cable Woodchopper', 
    targetMuscle: 'Core', 
    notes: 'هذا التمرين هو الأفضل لاستهداف العضلات الجانبية للبطن (الخواصر - Obliques) وتقوية الجذع بشكل عام من خلال الحركة الدورانية.\n\nنصيحة للأداء: اضبط الكيبل في أعلى نقطة أو في مستوى الكتف. حافظ على استقامة ذراعيك تقريباً، وقم بالدوران باستخدام جذعك (خصرك) وليس فقط بتحريك ذراعيك أو كتفيك، وحافظ على ثبات قدميك وحوضك قدر الإمكان.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Cable Woodchopper Form Short' 
  },
];

export function SessionDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, saveSession, deleteSession, saveHistory } = useData();
  const { t, formatDate, tTitle, tExercise, tMuscle, isRTL } = useTranslation();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  
  // Timer state
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [showRestCompleteToast, setShowRestCompleteToast] = useState(false);
  
  // Add Exercise state
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);

  const handleFinishWorkout = async () => {
    if (!session) return;
    const updatedSession = { ...session, isCompleted: true };
    await saveSession(updatedSession);
    setSession(updatedSession);

    const burnedCalories = estimateWorkoutCalories(updatedSession);
    await saveHistory({
      id: Date.now().toString(),
      sessionId: session.id,
      date: new Date().toISOString(),
      title: session.title,
      snapshot: updatedSession,
      burnedCalories
    });
    navigate('/history');
  };

  useEffect(() => {
    if (data) {
      const foundSession = data.sessions.find(s => s.id === id);
      if (foundSession) {
        setSession(foundSession);
      }
    }
  }, [data, id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer !== null && activeTimer > 0) {
      interval = setInterval(() => {
        setActiveTimer(t => (t ? t - 1 : 0));
      }, 1000);
    } else if (activeTimer === 0) {
      if (data?.settings?.soundAlerts !== false) {
        gymAudio.playRestTimerChime();
      }
      if (data?.settings?.vibrationAlerts !== false) {
        gymAudio.triggerVibration();
      }
      setShowRestCompleteToast(true);
      const toastTimeout = setTimeout(() => setShowRestCompleteToast(false), 4500);
      setActiveTimer(null);
      return () => clearTimeout(toastTimeout);
    }
    return () => clearInterval(interval);
  }, [activeTimer, data?.settings?.soundAlerts, data?.settings?.vibrationAlerts]);

  const handleUpdateSession = async (updatedSession: WorkoutSession) => {
    if (!data) return;
    await saveSession(updatedSession);
    setSession(updatedSession);
  };

  const deleteExercise = (exerciseIndex: number) => {
    if (!session) return;
    if (!confirm(t('deleteExerciseConfirm'))) return;
    const updatedExercises = (session.exercises || []).filter((_, idx) => idx !== exerciseIndex);
    handleUpdateSession({ ...session, exercises: updatedExercises });
  };

  const deleteSet = (exerciseIndex: number, setIndex: number) => {
    if (!session) return;
    const ex = session.exercises[exerciseIndex];
    if (!ex || !ex.sets || ex.sets.length <= 1) return;
    const updatedExercises = session.exercises.map((exercise, eIdx) => {
      if (eIdx !== exerciseIndex) return exercise;
      return {
        ...exercise,
        sets: exercise.sets.filter((_, sIdx) => sIdx !== setIndex)
      };
    });
    handleUpdateSession({ ...session, exercises: updatedExercises });
  };

  const addSet = (exerciseIndex: number) => {
    if (!session) return;
    const ex = session.exercises[exerciseIndex];
    const lastSet = ex.sets?.[ex.sets.length - 1];
    
    const newSet: SetRecord = {
      id: Date.now().toString(),
      weight: lastSet ? lastSet.weight : 0,
      repsTarget: lastSet ? lastSet.repsTarget : 10,
      repsActual: 0,
      unit: lastSet ? lastSet.unit : (data?.settings?.weightUnit || 'lb'),
      isCompleted: false
    };

    const updatedExercises = session.exercises.map((exercise, eIdx) => {
      if (eIdx !== exerciseIndex) return exercise;
      return {
        ...exercise,
        sets: [...(exercise.sets || []), newSet]
      };
    });
    handleUpdateSession({ ...session, exercises: updatedExercises });
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof SetRecord, value: any) => {
    if (!session) return;

    // If we're marking the set as completed, start rest timer
    if (field === 'isCompleted' && value === true) {
      setActiveTimer(session.exercises[exerciseIndex].restTime || 90);
    }

    const updatedExercises = session.exercises.map((exercise, eIdx) => {
      if (eIdx !== exerciseIndex) return exercise;
      const updatedSets = (exercise.sets || []).map((set, sIdx) => {
        if (sIdx !== setIndex) return set;
        return { ...set, [field]: value };
      });
      return { ...exercise, sets: updatedSets };
    });
    handleUpdateSession({ ...session, exercises: updatedExercises });
  };

  const updateExercise = (exerciseIndex: number, field: keyof SessionExercise, value: any) => {
    if (!session) return;
    const updatedExercises = session.exercises.map((exercise, eIdx) => {
      if (eIdx !== exerciseIndex) return exercise;
      return { ...exercise, [field]: value };
    });
    handleUpdateSession({ ...session, exercises: updatedExercises });
  };

  const handleReorderExercises = (newExercises: SessionExercise[]) => {
    if (!session) return;
    const updatedSession = { ...session, exercises: newExercises };
    handleUpdateSession(updatedSession);
  };
  
  // Add standard exercise
  const handleAddExercise = (exerciseTemplate: { name: string, targetMuscle: string, videoUrl?: string, notes?: string }) => {
    if (!session) return;
    const newExercise: SessionExercise = {
      id: Date.now().toString(),
      name: exerciseTemplate.name,
      targetMuscle: exerciseTemplate.targetMuscle,
      restTime: data?.settings?.restTimerSeconds || 90,
      videoUrl: exerciseTemplate.videoUrl,
      notes: exerciseTemplate.notes || '',
      sets: [
        {
          id: '1',
          weight: 0,
          repsTarget: 10,
          repsActual: 0,
          unit: data?.settings?.weightUnit || 'lb',
          isCompleted: false
        }
      ]
    };

    const updatedSession = {
      ...session,
      exercises: [...(session.exercises || []), newExercise]
    };

    handleUpdateSession(updatedSession);
    setIsAddExerciseModalOpen(false);
  };

  if (!session) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="page-surface session-detail-page flex-col"
      style={{ display: 'flex', flexDirection: 'column', paddingBottom: '3rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-icon btn-ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
          </button>
          <div>
            <h1 style={{ margin: 0 }}>{tTitle(session.title)}</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{formatDate(new Date(session.date), 'EEEE, d MMMM yyyy')}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {session.isCompleted ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
              padding: '0.45rem 0.85rem', borderRadius: '8px',
              fontSize: '0.875rem', fontWeight: 600
            }}>
              <Check className="w-4 h-4" /> {t('workoutCompleted')}
            </div>
          ) : (
            <button 
              type="button"
              className="btn btn-primary"
              onClick={handleFinishWorkout}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 0.9rem', fontSize: '0.875rem', borderRadius: '8px'
              }}
            >
              <Check className="w-4 h-4" /> {t('finishWorkout')}
            </button>
          )}
          <button 
            className="btn-icon btn-ghost" 
            onClick={async () => {
              if (confirm(t('deleteSessionConfirm'))) {
                await deleteSession(session.id);
                navigate(-1);
              }
            }} 
            style={{ color: 'var(--danger)' }}
            title={t('deleteSession')}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {activeTimer !== null && (
          <motion.div 
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            style={{ 
              backgroundColor: 'var(--accent-primary)', 
              color: 'white', 
              padding: '1rem', 
              borderRadius: 'var(--radius-md)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1.5rem',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Play className="w-5 h-5" />
              <span style={{ fontWeight: 600 }}>{t('restTimerActive')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(activeTimer)}
              </span>
              <button className="btn-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} onClick={() => setActiveTimer(null)}>
                <Square className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRestCompleteToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.16)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#10b981',
              padding: '0.85rem 1.2rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: 600, fontSize: '0.925rem' }}>
              <Bell className="w-5 h-5" />
              <span>{t('restCompleteNotification')}</span>
            </div>
            <button 
              type="button" 
              className="btn-icon btn-ghost" 
              style={{ padding: '0.2rem', color: '#10b981' }} 
              onClick={() => setShowRestCompleteToast(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Reorder.Group 
        axis="y" 
        values={session.exercises || []} 
        onReorder={handleReorderExercises} 
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', listStyle: 'none', padding: 0, margin: 0, paddingBottom: '1rem' }}
      >
        {session.exercises?.map((exercise, exIndex) => (
          <ExerciseCard 
            key={exercise.id} 
            exercise={exercise} 
            exIndex={exIndex} 
            updateSet={updateSet} 
            addSet={addSet} 
            updateExercise={updateExercise}
            deleteExercise={deleteExercise}
            deleteSet={deleteSet}
          />
        ))}
      </Reorder.Group>

      <button 
        className="btn-ghost" 
        style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '2px dashed var(--border-color)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
        onClick={() => setIsAddExerciseModalOpen(true)}
      >
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '50%' }}>
          <Plus className="w-5 h-5" />
        </div>
        <span style={{ fontWeight: 500 }}>{t('addExercise')}</span>
      </button>

      <Modal isOpen={isAddExerciseModalOpen} onClose={() => setIsAddExerciseModalOpen(false)} title={t('addExercise')}>
        <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '60vh', overflowY: 'auto' }} className="hide-scrollbar">
          {DEFAULT_EXERCISES.map((ex, i) => (
            <button 
              key={i} 
              className="card" 
              style={{ textAlign: isRTL ? 'right' : 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '1rem', transition: 'background-color 0.2s' }}
              onClick={() => handleAddExercise(ex)}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{tExercise(ex.name)}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tMuscle(ex.targetMuscle)}</div>
              </div>
              <Plus className="w-4 h-4 text-accent-primary" />
            </button>
          ))}
        </div>
      </Modal>
    </motion.div>
  );
}
