export interface CatalogExerciseItem {
  id: string;
  name: string;
  nameAr: string;
  muscle: string;
  defaultSets: number;
  defaultReps: number;
  restTime: number;
  notes?: string;
  notesAr?: string;
}

export const MUSCLE_GROUPS = [
  'All',
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Core',
  'Cardio'
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];

export const CATALOG_EXERCISES: CatalogExerciseItem[] = [
  // Chest
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    nameAr: 'ضغط بنش مستوٍ بالبار',
    muscle: 'Chest',
    defaultSets: 3,
    defaultReps: 8,
    restTime: 120,
    notes: 'Keep feet planted and retract scapulae for a solid foundation.',
    notesAr: 'ثبّت قدميك واعتمد على انقباض لوحي الكتف لقاعدة صلبة.'
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    nameAr: 'ضغط مائل بالدمبلز',
    muscle: 'Chest',
    defaultSets: 3,
    defaultReps: 10,
    restTime: 90,
    notes: 'Set bench to 30 degrees to target the clavicular upper head.',
    notesAr: 'اضبط المقعد بزاوية 30 درجة لاستهداف أعلى الصدر.'
  },
  {
    id: 'cable-crossover-high-low',
    name: 'High-to-Low Cable Crossover',
    nameAr: 'سحب كيبل متقاطع للأسفل',
    muscle: 'Chest',
    defaultSets: 3,
    defaultReps: 12,
    restTime: 90,
    notes: 'Squeeze inner and lower chest at the bottom of the motion.',
    notesAr: 'اعصر أسفل وداخل الصدر بقوة عند تلاقي اليدين.'
  },
  {
    id: 'seated-machine-chest-press',
    name: 'Seated Machine Chest Press',
    nameAr: 'ضغط صدر بالجهاز',
    muscle: 'Chest',
    defaultSets: 3,
    defaultReps: 10,
    restTime: 90,
    notes: 'Controlled eccentric phase for optimal muscle hypertrophy.',
    notesAr: 'تحكم بمرحلة النزول لتحقيق أقصى تفعيل للألياف.'
  },
  {
    id: 'dumbbell-chest-flyes',
    name: 'Dumbbell Chest Flyes',
    nameAr: 'تفتيح صدر بالدمبلز',
    muscle: 'Chest',
    defaultSets: 3,
    defaultReps: 12,
    restTime: 60,
    notes: 'Maintain slight elbow bend and feel a deep chest stretch.',
    notesAr: 'حافظ على ثني خفيف بالكوع واستشعر تمدد ألياف الصدر.'
  },

  // Back
  {
    id: 'wide-grip-lat-pulldown',
    name: 'Wide-Grip Lat Pulldown',
    nameAr: 'سحب ظهر عريض بالجهاز',
    muscle: 'Back',
    defaultSets: 3,
    defaultReps: 10,
    restTime: 90,
    notes: 'Drive elbows down and back towards your ribs.',
    notesAr: 'اسحب الكوعين للأسفل وباتجاه أضلاعك لتوسيع الظهر.'
  },
  {
    id: 'bent-over-barbell-row',
    name: 'Bent-Over Barbell Row',
    nameAr: 'تجديف بالبار منحني الظهر',
    muscle: 'Back',
    defaultSets: 3,
    defaultReps: 8,
    restTime: 120,
    notes: 'Hinge at hips, brace core, pull bar to upper waist.',
    notesAr: 'اثنِ الجذع من الورك وثبت الجذع واسحب البار لأسفل البطن.'
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    nameAr: 'سحب كيبل جالس',
    muscle: 'Back',
    defaultSets: 3,
    defaultReps: 10,
    restTime: 90,
    notes: 'Squeeze shoulder blades together at peak contraction.',
    notesAr: 'اعصر لوحي الكتف معاً بقوة عند وصول المقبض لجسمك.'
  },
  {
    id: 'chest-supported-machine-row',
    name: 'Chest-Supported Machine Row',
    nameAr: 'سحب ظهر بالجهاز مع دعم الصدر',
    muscle: 'Back',
    defaultSets: 3,
    defaultReps: 10,
    restTime: 90,
    notes: 'Zero lower-back strain with isolated mid-back focus.',
    notesAr: 'حماية كاملة لأسفل الظهر مع عزل ممتاز لعضلات أعلى ومنتصف الظهر.'
  },
  {
    id: 'back-extension',
    name: 'Back Extension',
    nameAr: 'تمديد الظهر على الجهاز',
    muscle: 'Back',
    defaultSets: 3,
    defaultReps: 12,
    restTime: 90,
    notes: 'Strengthen erector spinae and posterior chain.',
    notesAr: 'تقوية عضلات أسفل الظهر وسلسلة العضلات الخلفية.'
  },

  // Legs
  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    nameAr: 'سكوات بالبار الخلفي',
    muscle: 'Legs',
    defaultSets: 3,
    defaultReps: 8,
    restTime: 150,
    notes: 'Push knees out over toes, maintain upright torso.',
    notesAr: 'ادفع الركبتين للخارج وحافظ على استقامة واستقرار الصدر.'
  },
  {
    id: 'machine-leg-press',
    name: 'Machine Leg Press',
    nameAr: 'دفع أرجل بالجهاز',
    muscle: 'Legs',
    defaultSets: 3,
    defaultReps: 12,
    restTime: 90,
    notes: 'Do not fully lock knees out at the top of the movement.',
    notesAr: 'لا تفرد ركبتيك للآخر (Lockout) عند أعلى نقطة حمايةً للمفاصل.'
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    nameAr: 'رفعة ميتة رومانية (RDL)',
    muscle: 'Legs',
    defaultSets: 3,
    defaultReps: 10,
    restTime: 120,
    notes: 'Push hips backward until deep hamstring stretch is felt.',
    notesAr: 'ادفع الحوض للخلف حتى تستشعر تمدداً عميقاً في أوتار الفخذ.'
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    nameAr: 'تمديد أرجل أمامي بالجهاز',
    muscle: 'Legs',
    defaultSets: 3,
    defaultReps: 12,
    restTime: 60,
    notes: 'Isolate quadriceps with a 1-second pause at the peak.',
    notesAr: 'عزل عضلات الفخذ الأمامية مع توقف ثانية عند القمة.'
  },
  {
    id: 'lying-leg-curl',
    name: 'Lying Leg Curl',
    nameAr: 'ثني أرجل خلفي بالجهاز',
    muscle: 'Legs',
    defaultSets: 3,
    defaultReps: 12,
    restTime: 60,
    notes: 'Controlled knee flexion focusing on hamstrings.',
    notesAr: 'حركة انثناء متحكم بها تركز على أوتار الركبة وخلفية الفخذ.'
  },
  {
    id: 'standing-calf-raises',
    name: 'Calf Raises',
    nameAr: 'رفع السمانة (الكافز)',
    muscle: 'Legs',
    defaultSets: 4,
    defaultReps: 15,
    restTime: 60,
    notes: 'Full ankle dorsiflexion and plantarflexion range.',
    notesAr: 'مدى حركي كامل من أقصى تمدد لأسفل إلى أقصى رفعة لأعلى.'
  },

  // Shoulders
  {
    id: 'machine-shoulder-press',
    name: 'Machine Shoulder Press',
    nameAr: 'ضغط أكتاف بالجهاز',
    muscle: 'Shoulders',
    defaultSets: 3,
    defaultReps: 10,
    restTime: 90,
    notes: 'Tuck elbows 45 degrees forward to protect rotator cuffs.',
    notesAr: 'أمِل الكوعين للأمام 45 درجة لحماية مفصل وأوتار الكتف.'
  },
  {
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    nameAr: 'رفرفة أكتاف جانبية بالكيبل',
    muscle: 'Shoulders',
    defaultSets: 3,
    defaultReps: 12,
    restTime: 60,
    notes: 'Continuous resistance creates 3D lateral deltoid roundness.',
    notesAr: 'السر للحصول على أكتاف عريضة وبارزة بفضل الشد المتواصل.'
  },
  {
    id: 'reverse-pec-deck-machine',
    name: 'Reverse Pec Deck Machine',
    nameAr: 'رفرفة عكسية بالماكينة للكتف الخلفي',
    muscle: 'Shoulders',
    defaultSets: 3,
    defaultReps: 15,
    restTime: 60,
    notes: 'Isolate posterior deltoids without upper back overtaking.',
    notesAr: 'عزل الكتف الخلفي بامتياز لتحسين استقامة الوقفة وتوازن الكتف.'
  },
  {
    id: 'seated-dumbbell-press',
    name: 'Seated Dumbbell Press',
    nameAr: 'ضغط أكتاف بالدمبلز جالساً',
    muscle: 'Shoulders',
    defaultSets: 3,
    defaultReps: 10,
    restTime: 90,
    notes: 'Press straight overhead with stable core engagement.',
    notesAr: 'ادفع الدمبلز للأعلى مباشرة مع تثبيت الظهر والبطن.'
  },

  // Biceps
  {
    id: 'machine-preacher-curl',
    name: 'Machine Preacher Curl',
    nameAr: 'كيرل بايسبس على مسند بريتشر',
    muscle: 'Biceps',
    defaultSets: 3,
    defaultReps: 10,
    restTime: 90,
    notes: 'Eliminates momentum for pure short-head biceps mass.',
    notesAr: 'عزل البايسبس بالكامل ومنع الأرجحة لزيادة الحجم والكتلة.'
  },
  {
    id: 'behind-the-back-cable-curl',
    name: 'Behind-The-Back Cable Curl',
    nameAr: 'كيرل بايسبس خلف الظهر بالكيبل',
    muscle: 'Biceps',
    defaultSets: 3,
    defaultReps: 12,
    restTime: 90,
    notes: 'Extreme stretch on long head creates peak definition.',
    notesAr: 'تمدد قوي للرأس الطويل لبناء وتكوير قمة عضلة البايسبس.'
  },
  {
    id: 'rope-cable-hammer-curl',
    name: 'Rope Cable Hammer Curl',
    nameAr: 'كيرل مطرقة بالحبل على الكيبل',
    muscle: 'Biceps',
    defaultSets: 3,
    defaultReps: 12,
    restTime: 60,
    notes: 'Targets brachialis to broaden and thicken arm profile.',
    notesAr: 'استهداف العضلة العضدية لزيادة سمك وعرض مظهر الذراع.'
  },
  {
    id: 'alternating-dumbbell-curl',
    name: 'Alternating Dumbbell Curl',
    nameAr: 'كيرل تبادلي بالدمبلز',
    muscle: 'Biceps',
    defaultSets: 3,
    defaultReps: 12,
    restTime: 60,
    notes: 'Supinate wrists at the top for maximal peak contraction.',
    notesAr: 'قم بلف المعصم للخارج عند القمة لأقصى انقباض.'
  },

  // Triceps
  {
    id: 'cable-rope-triceps-pushdown',
    name: 'Cable Rope Triceps Pushdown',
    nameAr: 'ضغط تراي بالحبل للأسفل',
    muscle: 'Triceps',
    defaultSets: 3,
    defaultReps: 12,
    restTime: 60,
    notes: 'Flare ends apart at the bottom to maximize lateral head horseshoe.',
    notesAr: 'باعد بين طرفي الحبل بالأسفل لإبراز مظهر حدوة الحصان.'
  },
  {
    id: 'overhead-cable-triceps-extension',
    name: 'Overhead Cable Triceps Extension',
    nameAr: 'مد تراي فوق الرأس بالكيبل',
    muscle: 'Triceps',
    defaultSets: 3,
    defaultReps: 12,
    restTime: 90,
    notes: 'Full stretch of long head, which accounts for majority of arm size.',
    notesAr: 'تمدد كامل للرأس الطويل المسؤول عن الحجم الأكبر للذراع.'
  },
  {
    id: 'triceps-dip-machine',
    name: 'Triceps Dip Machine',
    nameAr: 'غطس ترايسيبس بالجهاز',
    muscle: 'Triceps',
    defaultSets: 3,
    defaultReps: 10,
    restTime: 90,
    notes: 'Safe compound overload for all 3 tricep heads.',
    notesAr: 'تحميل آمن وفعال يستهدف جميع رؤوس الترايسيبس الثلاثة.'
  },

  // Forearms
  {
    id: 'cable-reverse-curl',
    name: 'Cable Reverse Curl',
    nameAr: 'كيرل عكسي للساعد بالكيبل',
    muscle: 'Forearms',
    defaultSets: 3,
    defaultReps: 12,
    restTime: 60,
    notes: 'Overhand grip thickens brachioradialis forearm ridge.',
    notesAr: 'قبضة علوية لبناء سمك وعرض الجزء العلوي من الساعد.'
  },
  {
    id: 'cable-wrist-curl',
    name: 'Cable Wrist Curl',
    nameAr: 'ثني المعصم للساعد بالكيبل',
    muscle: 'Forearms',
    defaultSets: 3,
    defaultReps: 15,
    restTime: 60,
    notes: 'Forearm flexors build dense lower-arm mass.',
    notesAr: 'استهداف عضلات الثني لبناء كتلة الساعد الدائرية.'
  },

  // Core
  {
    id: 'kneeling-cable-crunch',
    name: 'Kneeling Cable Crunch',
    nameAr: 'طحن بطن بالكيبل من وضع الركوع',
    muscle: 'Core',
    defaultSets: 3,
    defaultReps: 15,
    restTime: 60,
    notes: 'Flex spine with abdominal tension without sitting back on heels.',
    notesAr: 'اثنِ الجذع بعضلات البطن فقط مع ثبات الحوض لبناء العضلات السداسية.'
  },
  {
    id: 'ab-crunch-machine',
    name: 'Ab Crunch Machine',
    nameAr: 'طحن بطن بالجهاز',
    muscle: 'Core',
    defaultSets: 3,
    defaultReps: 15,
    restTime: 60,
    notes: 'Exhale fully upon peak flexion for maximum core engagement.',
    notesAr: 'أخرج الزفير بالكامل عند أقصى انقباض لحماية الظهر وتفعيل البطن.'
  },
  {
    id: 'cable-woodchopper',
    name: 'Cable Woodchopper',
    nameAr: 'حركة الحطاب للخواصر بالكيبل',
    muscle: 'Core',
    defaultSets: 3,
    defaultReps: 15,
    restTime: 60,
    notes: 'Rotational core power targeting obliques and athletic stability.',
    notesAr: 'حركة دورانية تقوي الخواصر وتمنح الجذع قوة واستقراراً رياضياً.'
  },
  {
    id: 'plank',
    name: 'Plank',
    nameAr: 'تمرين البلانك (الثبات)',
    muscle: 'Core',
    defaultSets: 3,
    defaultReps: 60,
    restTime: 60,
    notes: 'Maintain neutral spine and rigid glute/abdominal brace.',
    notesAr: 'حافظ على استقامة الظهر وعصر عضلات البطن والمؤخرة.'
  },

  // Cardio
  {
    id: 'treadmill-incline-walk',
    name: 'Treadmill Incline Walk',
    nameAr: 'مشي مائل على جهاز المشي (12-3-30)',
    muscle: 'Cardio',
    defaultSets: 1,
    defaultReps: 1,
    restTime: 0,
    notes: '12% incline, 3 mph (4.8 km/h) for low-impact fat burn.',
    notesAr: 'انحدار 12% وسرعة 4.8 كم/س لحرق الدهون وحماية المفاصل.'
  },
  {
    id: 'stationary-bike',
    name: 'Stationary Bike',
    nameAr: 'دراجة ثابتة',
    muscle: 'Cardio',
    defaultSets: 1,
    defaultReps: 1,
    restTime: 0,
    notes: 'Smooth aerobic pacing to build cardiovascular endurance.',
    notesAr: 'تمرين هوائي سلس لتعزيز اللياقة وصحة القلب.'
  },
  {
    id: 'stairmaster',
    name: 'Stairmaster',
    nameAr: 'جهاز صعود الدرج',
    muscle: 'Cardio',
    defaultSets: 1,
    defaultReps: 1,
    restTime: 0,
    notes: 'High-intensity calorie burn targeting glutes and calves.',
    notesAr: 'حرق سعرات مكثف مع تقوية عضلات الساقين والمؤخرة.'
  }
];

export function filterCatalog(search: string, muscleFilter: MuscleGroup = 'All'): CatalogExerciseItem[] {
  const query = search.trim().toLowerCase();
  return CATALOG_EXERCISES.filter(item => {
    const matchesMuscle = muscleFilter === 'All' || item.muscle === muscleFilter;
    if (!matchesMuscle) return false;
    if (!query) return true;
    return (
      item.name.toLowerCase().includes(query) ||
      item.nameAr.toLowerCase().includes(query) ||
      item.muscle.toLowerCase().includes(query)
    );
  });
}
