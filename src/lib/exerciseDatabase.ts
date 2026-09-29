export type MotionPatternType = 
  | 'bench_press' 
  | 'incline_press' 
  | 'squat' 
  | 'deadlift' 
  | 'overhead_press' 
  | 'lateral_raise' 
  | 'pull_down' 
  | 'row' 
  | 'bicep_curl' 
  | 'tricep_extension' 
  | 'leg_extension' 
  | 'leg_curl' 
  | 'calf_raise' 
  | 'core' 
  | 'cardio';

export type MuscleGroupKey = 
  | 'chest' 
  | 'shoulders' 
  | 'biceps' 
  | 'abs' 
  | 'quads' 
  | 'traps' 
  | 'lats' 
  | 'triceps' 
  | 'lowerBack' 
  | 'glutes' 
  | 'hamstrings' 
  | 'calves';

export interface AngleCue {
  label: string;
  labelAr: string;
  value: string;
}

export interface BiomechanicalProfile {
  pattern: MotionPatternType;
  primaryMuscle: MuscleGroupKey;
  secondaryMuscles: MuscleGroupKey[];
  activationScore: number;
  tempo: string;
  tempoAr: string;
  cues: AngleCue[];
}

export type ExerciseTutorial = {
  id: string;
  name: string;
  nameAr: string;
  targetMuscle: string;
  targetMuscleAr: string;
  targetMuscleId?: MuscleGroupKey;
  secondaryMuscles: string[];
  secondaryMusclesAr: string[];
  secondaryMuscleIds?: MuscleGroupKey[];
  motionPattern?: MotionPatternType;
  activationScore?: number;
  angleCues?: AngleCue[];
  equipment: string;
  equipmentAr: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  difficultyAr: string;
  overview: string;
  overviewAr: string;
  steps: string[];
  stepsAr: string[];
  commonMistakes: string[];
  commonMistakesAr: string[];
  breathingTip: string;
  breathingTipAr: string;
  proTip: string;
  proTipAr: string;
  videoUrl?: string;
  youtubeSearchQuery: string;
};

export const EXERCISE_DATABASE: Record<string, ExerciseTutorial> = {
  // ==================== CHEST ====================
  'barbell-bench-press': {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    nameAr: 'بنش برس مستوي بالبار',
    targetMuscle: 'Chest',
    targetMuscleAr: 'الصدر الأوسط والشامل',
    secondaryMuscles: ['Triceps', 'Front Delts'],
    secondaryMusclesAr: ['الترايسبس', 'الكتف الأمامي'],
    equipment: 'Barbell & Flat Bench',
    equipmentAr: 'بار حر ومقعد مستوٍ',
    difficulty: 'Intermediate',
    difficultyAr: 'متوسط',
    overview: 'The king of upper body pressing movements. Develops overall pectoral mass, pressing power, and anterior chain strength.',
    overviewAr: 'التمرين الأساسي الأول والأقوى لبناء كتلة وقوة عضلات الصدر، ويوفر تحفيزاً عصبياً وعضلياً هائلاً للجزء العلوي من الجسم.',
    steps: [
      'Lie flat on the bench with eyes directly under the racked bar. Plant your feet flat and drive through the floor.',
      'Retract and depress your shoulder blades (pinch them together and slide them down into the bench).',
      'Grip the bar slightly wider than shoulder-width. Unrack with straight arms and stabilize over your chest.',
      'Inhale deeply and lower the bar under control until it lightly touches your mid-sternum, keeping elbows tucked at roughly 45–75 degrees.',
      'Drive the bar back up explosively to the start position while exhaling, pressing your upper back firmly into the pad without flaring elbows.'
    ],
    stepsAr: [
      'استلقِ على المقعد بحيث تكون عيناك مباشرة تحت البار، واغرس قدميك بالكامل في الأرض بثبات.',
      'اسحب لوحي كتفك للخلف وللأسفل بقوة داخل المقعد (Retraction) لحماية مفصل الكتف وتثبيت الصدر.',
      'امسك البار بقبضة أوسع قليلاً من عرض الكتفين، وارفع البار بأذرع مستقيمة فوق الصدر.',
      'انزل بالبار بهدوء وتحكم حتى يلامس منتصف صدرك برفق، مع الحفاظ على زاوية الكوعين 45 إلى 70 درجة (لا تفتح كوعيك بزاوية 90).',
      'ادفع البار للأعلى بقوة وثبات عائداً لنقطة البداية مع إخراج الزفير، وتجنب رفع مؤخرتك عن المقعد.'
    ],
    commonMistakes: [
      'Flaring elbows out at 90 degrees, which places excessive shearing stress on the rotator cuff.',
      'Bouncing the barbell off the ribcage using momentum rather than muscular control.',
      'Lifting the glutes off the bench, risking lower back hyper-extension.'
    ],
    commonMistakesAr: [
      'فتح الكوعين للجانبين بزاوية 90 درجة مما يضع ضغطاً مدمراً على أوتار الكتف.',
      'ضرب البار بالقفص الصدري وارتداده بالقوة الدافعة بدلاً من النزول المتحكم.',
      'رفع الحوض والمؤخرة عن المقعد أثناء دفع الوزن الثقيل.'
    ],
    breathingTip: 'Inhale deeply on the descent to create intra-abdominal thoracic stability; exhale powerfully through the sticking point on the push.',
    breathingTipAr: 'خذ شهيقاً عميقاً أثناء النزول لملء الصدر بالهواء وتثبيت الجذع، وأخرج الزفير بقوة عند تجاوز منتصف مسار الدفع.',
    proTip: 'Think of bending the bar like a horseshoe to engage your lats and lock your shoulders into an unshakeable position.',
    proTipAr: 'تخيل أنك تحاول ثني البار بين يديك لتفعيل عضلات الظهر العلوية وتأمين مفصل الكتف في أقصى درجات الثبات.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/_FkbD0FhgVE',
    youtubeSearchQuery: 'Barbell Bench Press Proper Form Short'
  },

  'incline-dumbbell-press': {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    nameAr: 'تجميع صدر مائل بالدمبلز',
    targetMuscle: 'Chest',
    targetMuscleAr: 'الصدر العلوي (Clavicular Head)',
    secondaryMuscles: ['Front Delts', 'Triceps'],
    secondaryMusclesAr: ['الكتف الأمامي', 'الترايسبس'],
    equipment: 'Dumbbells & Incline Bench (30°)',
    equipmentAr: 'دمبلز ومقعد مائل بزاوية 30 درجة',
    difficulty: 'Beginner',
    difficultyAr: 'مبتدئ إلى متوسط',
    overview: 'Essential movement for targeting the clavicular head of the pectoralis major to build a thick, shelf-like upper chest.',
    overviewAr: 'التمرين الذهبي لعزل وبناء الجزء العلوي من الصدر (تحت عظمة الترقوة)، ويمنح الصدر مظهراً ممتلئاً وبارزاً من الأعلى.',
    steps: [
      'Set the incline bench to 30 degrees (higher angles recruit more front delt and less chest).',
      'Sit down and kick the dumbbells up onto your shoulders using your knees, then lean back.',
      'Pinch your shoulder blades and arch your thoracic spine slightly while keeping your feet flat.',
      'Lower the dumbbells slowly until you feel a deep stretch in your upper chest, elbows at 45-60 degrees.',
      'Press the dumbbells up and slightly inward in a gentle arc without clanking them together at the top.'
    ],
    stepsAr: [
      'اضبط المقعد المائل على زاوية 30 درجة (الزوايا المرتفعة كـ 45° أو أكثر تنقل الحمل للكتف الأمامي).',
      'اجلس وارفع الدمبلز بركبتيك بهدوء إلى مستوى صدرك واستند بظهرك للمقعد.',
      'ثبت لوحي كتفك للخلف والصدر مرفوع، وحافظ على زاوية كوعيك مائلة 45 إلى 60 درجة.',
      'انزل بالدمبلز بتحكم حتى تشعر بتمدد كامل في أعلى الصدر بمحاذاة الترقوة.',
      'ادفع الوزن للأعلى في مسار قوسي خفيف مع عصر عضلات الصدر العلوية في الأعلى دون ضرب الدمبلز ببعضها.'
    ],
    commonMistakes: [
      'Setting the bench too steep (45° or 60°), transforming it into a shoulder press.',
      'Banging the dumbbells together at the top, which relieves muscular tension.',
      'Allowing elbows to flare wide, stressing the shoulder joint.'
    ],
    commonMistakesAr: [
      'رفع زاوية المقعد بشكل حاد جداً مما يجعله تمريناً للكتف بدلاً من الصدر العلوي.',
      'ضرب الدمبلين ببعضهما في القمة مما يفقد العضلة الشد والتوتر المستمر.',
      'النزول السريع والمفاجئ الذي يعرض أوتار الصدر للإصابة.'
    ],
    breathingTip: 'Inhale on the way down; exhale forcefully as you drive the dumbbells upward.',
    breathingTipAr: 'شهيق عميق أثناء نزول الدمبلز للأسفل، وزفير متواصل مع الدفع للأعلى.',
    proTip: 'Focus on bringing your inner biceps toward each other at the peak of the press rather than just pushing the dumbbells.',
    proTipAr: 'ركز على تقريب عضلات البايسبس من بعضها عند نهاية الرفعة لعصر الصدر العلوي بأقصى كفاءة.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/8fXfwG4ftaQ',
    youtubeSearchQuery: 'Incline Dumbbell Press Form Short'
  },

  'seated-machine-chest-press': {
    id: 'seated-machine-chest-press',
    name: 'Seated Machine Chest Press',
    nameAr: 'جهاز دفع الصدر جالس',
    targetMuscle: 'Chest',
    targetMuscleAr: 'الصدر الأوسط والشامل',
    secondaryMuscles: ['Triceps', 'Front Delts'],
    secondaryMusclesAr: ['الترايسبس', 'الكتف الأمامي'],
    equipment: 'Chest Press Machine',
    equipmentAr: 'جهاز دفع الصدر الثابت',
    difficulty: 'Beginner',
    difficultyAr: 'مبتدئ',
    overview: 'Provides a fixed, guided path of motion that isolates the chest safely without requiring balance stabilizers, perfect for progressive overload to failure.',
    overviewAr: 'يوفر مسار حركة موجه ومستقر تماماً يتيح عزل الصدر بأمان عالٍ ورفع أوزان تدريجية حتى الفشل العضلي دون قلق من فقدان التوازن.',
    steps: [
      'Adjust seat height so the handles align directly with the middle of your chest (nipple line).',
      'Sit firmly with your back and head glued to the pad, feet flat on the floor.',
      'Grip the handles, retract your shoulders, and press smoothly forward without locking your elbows.',
      'Return slowly, allowing your chest muscles to stretch fully behind the handles before the weight stack touches.'
    ],
    stepsAr: [
      'اضبط ارتفاع المقعد بحيث تكون المقابض في مستوى منتصف صدرك تماماً.',
      'ألصق ظهرك ورأسك بالمسند، واغرس قدميك في الأرض لثبات الجذع.',
      'امسك المقابض وادفع للأمام بسلاسة بقوة الصدر مع تجنب قفل مفصل الكوع بالكامل في النهاية.',
      'ارجع ببطء وتحكم واشعر بتمدد عضلة الصدر بالكامل قبل أن تلامس أوزان الجهاز بعضها.'
    ],
    commonMistakes: [
      'Setting seat too high or too low, forcing shoulders into an unnatural position.',
      'Shrugging shoulders forward off the back pad to push extra weight.',
      'Letting the weight plates crash at the bottom of the movement.'
    ],
    commonMistakesAr: [
      'ضبط المقعد بارتفاع غير مناسب مما يجهد مفصل الكتف.',
      'فصل الظهر والكتف عن المسند للأمام من أجل دفع الوزن.',
      'ترك الأوزان تصطدم ببعضها وفقدان الشد العضلي.'
    ],
    breathingTip: 'Inhale during the controlled negative; exhale steadily as you press forward.',
    breathingTipAr: 'شهيق أثناء رجوع المقابض للخلف؛ وزفير تدريجي أثناء الدفع للأمام.',
    proTip: 'Never let your shoulders roll forward at the end of the press; keep your shoulder blades pinned against the pad throughout.',
    proTipAr: 'حافظ على التصاق لوحي كتفك بالمسند الخلفي طوال الحركة وتجنب مد كتفيك للأمام عند نهاية الدفع.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/5SSdbmIjNj4',
    youtubeSearchQuery: 'Machine Chest Press Form Short'
  },

  'high-to-low-cable-crossover': {
    id: 'high-to-low-cable-crossover',
    name: 'High-to-Low Cable Crossover',
    nameAr: 'تفتيح كيبل من الأعلى للأسفل',
    targetMuscle: 'Chest',
    targetMuscleAr: 'الصدر السفلي والداخلي (Sternal Head)',
    secondaryMuscles: ['Front Delts'],
    secondaryMusclesAr: ['الكتف الأمامي'],
    equipment: 'Dual Cable Pulley Station',
    equipmentAr: 'جهاز الكيبل المزدوج (بكرات علوية)',
    difficulty: 'Intermediate',
    difficultyAr: 'متوسط',
    overview: 'Isolates the lower and inner chest fibers with continuous constant tension throughout the entire range of motion.',
    overviewAr: 'أحد أفضل التمارين لعزل ورسم خط الصدر السفلي والداخلي، حيث يوفر الكيبل توتراً عضلياً مستمراً من أقصى تمدد حتى أقصى عصرة.',
    steps: [
      'Set pulleys to the highest notch. Grab handles with a slight bend in your elbows and step forward into a staggered stance.',
      'Lean your torso slightly forward with chest high and core braced.',
      'Keeping elbows slightly bent like hugging a barrel, sweep your hands down and together in front of your hips.',
      'Squeeze your lower chest intensely at the bottom, then reverse slowly under tension.'
    ],
    stepsAr: [
      'ضع بكرات الكيبل في أعلى مستوى، وامسك المقابض مع ثني خفيف وثابت في الكوعين، وخذ خطوة للأمام.',
      'مل بجذعك قليلاً للأمام مع بقاء الصدر مرفوعاً وعضلات البطن مشدودة.',
      'تخيل أنك تعانق شجرة ضخمة، واسحب الكيابل للأسفل وللداخل حتى تتلاقى يداك أمام حوضك.',
      'اعصر عضلات صدرك بقوة لمدة ثانية في الأسفل، ثم ارجع ببطء حتى تشعر بالتمدد الكامل.'
    ],
    commonMistakes: [
      'Turning the fly into a press by bending and extending elbows excessively.',
      'Using body momentum / swinging torso to jerk the cables down.',
      'Letting shoulders shrug up toward the ears.'
    ],
    commonMistakesAr: [
      'تحويل التفتيح إلى تمرين دفع عبر ثني وفرد الكوعين بشكل مفرط.',
      'استخدام حركة الأرجحة بالجذع لإنزال الوزن بدلاً من عضلات الصدر.',
      'رفع الكتفين للأعلى باتجاه الأذنين أثناء الحركة.'
    ],
    breathingTip: 'Inhale as arms open wide; exhale forcefully as hands meet at the bottom.',
    breathingTipAr: 'شهيق أثناء فتح الذراعين للأعلى والجانب؛ وزفير قوي عند تلاقي اليدين في الأسفل.',
    proTip: 'Cross your wrists slightly at the bottom for an even deeper, peak contraction of the sternal chest fibers.',
    proTipAr: 'تقاطع خفيف بالمعصمين في أقصى نقطة بالأسفل يمنحك انقباضاً استثنائياً للخط الأوسط للصدر.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/I-Ue34qLxc4',
    youtubeSearchQuery: 'High to Low Cable Fly Form Short'
  },

  'chest-cable-fly': {
    id: 'chest-cable-fly',
    name: 'Chest Cable Fly',
    nameAr: 'تفتيح صدر بالكيبل (فلاي)',
    targetMuscle: 'Chest',
    targetMuscleAr: 'عضلات الصدر (الأوسط والداخلي)',
    secondaryMuscles: ['Front Delts'],
    secondaryMusclesAr: ['الكتف الأمامي'],
    equipment: 'Dual Cable Pulley Station',
    equipmentAr: 'جهاز الكيبل المزدوج',
    difficulty: 'Beginner',
    difficultyAr: 'مبتدئ إلى متوسط',
    overview: 'Delivers continuous tension throughout the entire pectoral contraction arc, producing superior chest fiber recruitment and deep hypertrophy stretch.',
    overviewAr: 'يوفر توتراً عضلياً متواصلاً طوال مدى حركة التفتيح والضم، مما يمنح عضلات الصدر تمدداً عميقاً وعصرة مركزة للألياف الداخلية دون إجهاد المفاصل.',
    steps: [
      'Set pulleys at chest height or slightly above. Grab handles and step forward into a solid staggered stance.',
      'Maintain a slight bend in your elbows and brace your core with chest held high.',
      'Bring the handles together in front of your chest in a wide hugging arc motion.',
      'Squeeze your chest hard at the peak for 1-2 seconds, then slowly return under full control.'
    ],
    stepsAr: [
      'اضبط بكرات الكيبل على مستوى الصدر أو أعلى قليلاً، وامسك المقابض وتقدم بخطوة ثابتة للأمام.',
      'حافظ على انحناء خفيف وثابت في الكوعين وشد عضلات البطن مع إبراز الصدر.',
      'اسحب المقابض للأمام في حركة دائرية واسعة كأنك تعانق أسطوانة ضخمة حتى تتلاقى يداك أمام منتصف صدرك.',
      'اعصر عضلات صدرك بقوة في قمة الحركة لثانية أو ثانيتين، ثم عد ببطء وتحكم لمرحلة التمدد.'
    ],
    commonMistakes: [
      'Bending and extending elbows, turning the fly into a press.',
      'Letting the weight yank arms too far back at the stretch.',
      'Using momentum or torso rocking to swing the cables.'
    ],
    commonMistakesAr: [
      'ثني وفرد الكوعين مما يحول التفتيح إلى تمرين دفع.',
      'ترك الأوزان تسحب الذراعين للخلف بشكل مبالغ فيه مما يجهد أوتار الكتف.',
      'أرجحة الجذع واستخدام قوة الاندفاع بدلاً من التركيز على الصدر.'
    ],
    breathingTip: 'Inhale smoothly as you open your arms; exhale forcefully as your hands meet together.',
    breathingTipAr: 'شهيق هادئ أثناء تمدد الذراعين للخارج؛ وزفير قوي ومتفجر عند تلاقي اليدين وعصر الصدر.',
    proTip: 'Focus on driving your inner elbows toward each other, not just touching the hands, to maximally engage the sternal chest.',
    proTipAr: 'ركز على تقريب باطن كوعيك من بعضهما وليس فقط ملامسة الكفين لتحقيق أقصى تفعيل ممكن لمركز الصدر.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/I-Ue34qLxc4',
    youtubeSearchQuery: 'Chest Cable Fly Form Short'
  },

  'push-ups': {
    id: 'push-ups',
    name: 'Push-ups',
    nameAr: 'تمرين الضغط (Push-ups)',
    targetMuscle: 'Chest',
    targetMuscleAr: 'الصدر الشامل وعضلات الدفع',
    secondaryMuscles: ['Triceps', 'Front Delts', 'Core'],
    secondaryMusclesAr: ['الترايسبس', 'الكتف الأمامي', 'عضلات الجذع والبطن'],
    equipment: 'Bodyweight',
    equipmentAr: 'وزن الجسم',
    difficulty: 'Beginner',
    difficultyAr: 'مبتدئ إلى متوسط',
    overview: 'The definitive bodyweight compound press for developing dense chest muscle, triceps strength, and anterior core stability with zero equipment.',
    overviewAr: 'التمرين الأساسي الأول بوزن الجسم لبناء قوة وضخامة عضلات الصدر، وتكثيف ألياف الجزء العلوي مع تعزيز ثبات واستقامة الجذع والكتفين.',
    steps: [
      'Place hands on the floor slightly wider than shoulder-width, fingers pointing slightly outward.',
      'Form a straight, rigid plank from head to heels by contracting glutes, quads, and abdominal core.',
      'Lower your chest under control until it is about 1 inch from the floor, keeping elbows tucked at 45 to 60 degrees.',
      'Drive powerfully through your palms back up to full lockout while maintaining flat spine alignment.'
    ],
    stepsAr: [
      'ضع كفيك على الأرض بمسافة أوسع قليلاً من عرض الكتفين مع توجيه الأصابع للأمام وللخارج قليلاً.',
      'حافظ على استقامة الجسم في خط واحد كلوح خشبي صلب من الرأس إلى الكعبين عبر شد البطن والمؤخرة والفخذين.',
      'انزل بصدرك ببطء وتحكم حتى يقترب من ملامسة الأرض مع الحفاظ على زاوية الكوعين 45-60 درجة.',
      'ادفع الأرض بكفيك بقوة وثبات للأعلى حتى تفرد ذراعيك مع الحفاظ على استقامة الحوض دون هبوطه.'
    ],
    commonMistakes: [
      'Flaring elbows outward at 90 degrees, creating destructive shearing forces on the rotator cuffs.',
      'Sagging hips or piking glutes in the air, removing tension from the chest and core.',
      'Bobbing the head forward instead of lowering the entire chest.'
    ],
    commonMistakesAr: [
      'فتح الكوعين للجانبين بزاوية 90 درجة مما يضع حملاً ضاراً على مفصل وأوتار الكتف.',
      'هبوط الحوض وتقوس أسفل الظهر لأسفل أثناء الحركة مما يفقد الجذع ثباته.',
      'إنزال الرأس والرقبة فقط بدلاً من النزول بالصدر كاملاً نحو الأرض.'
    ],
    breathingTip: 'Inhale deeply as you lower your body; exhale powerfully through the sticking point on the push up.',
    breathingTipAr: 'شهيق عميق ومتحكم أثناء النزول للأسفل؛ وزفير قوي ومتفجر أثناء دفع الجسم للأعلى.',
    proTip: 'Torque your palms into the floor as if trying to rip the floor apart outward to engage the lats and lock the shoulders in place.',
    proTipAr: 'تخيل أنك تدير كفيك داخل الأرض للخارج لتفعيل عضلات الظهر وتأمين مفصل الكتف في أقصى درجات الثبات والحماية.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/pKZ-lkKKMws',
    youtubeSearchQuery: 'Push ups proper form tutorial short'
  },

  'chest-dips': {
    id: 'chest-dips',
    name: 'Dips (Chest Dips)',
    nameAr: 'غطس متوازي للصدر (Dips)',
    targetMuscle: 'Chest',
    targetMuscleAr: 'الصدر السفلي والجانبي (Lower Pecs)',
    secondaryMuscles: ['Triceps', 'Front Delts'],
    secondaryMusclesAr: ['الترايسبس', 'الكتف الأمامي'],
    equipment: 'Dip Station / Parallel Bars',
    equipmentAr: 'جهاز المتوازي (Parallel Bars)',
    difficulty: 'Intermediate',
    difficultyAr: 'متوسط إلى متقدم',
    overview: 'The upper-body squat. Forward torso angle shifts mechanical load directly into the lower and outer pectoralis for massive chest thickness.',
    overviewAr: 'سكوات الجزء العلوي الأقوى لتفجير وضخامة الصدر السفلي والجانبي وتوسيع محيط الصدر عند إمالة الجذع للأمام أثناء النزول.',
    steps: [
      'Mount the parallel bars with arms locked and wrists straight over the bars.',
      'Lean your torso forward roughly 25 to 30 degrees and bend knees slightly backwards.',
      'Descend smoothly until your upper arms are parallel with the floor (90 degree elbow bend).',
      'Drive upward through the palms and squeeze your lower chest together to push back up to the starting lockout.'
    ],
    stepsAr: [
      'امسك قضيبي المتوازي واصعد بذراعيك مستقيمتين وثبت وزن جسمك بأمان.',
      'مل بجذعك وصدرك للأمام بزاوية 25 إلى 30 درجة واثنِ ركبتيك للخلف لتركيز الحمل على الصدر بدلاً من الترايسبس.',
      'انزل بجسمك ببطء وتحكم حتى تصبح ذراعاك موازيتين للأرض بزاوية 90 درجة عند الكوع.',
      'ادفع بكفيك للأعلى بقوة مع التركيز على عصر عضلات الصدر السفلية حتى تستقيم الذراعان.'
    ],
    commonMistakes: [
      'Staying fully upright, which transfers almost all tension onto the triceps.',
      'Descending past 90 degrees, causing severe anterior shoulder capsule impingement.',
      'Kicking legs or using momentum to jerk out of the bottom position.'
    ],
    commonMistakesAr: [
      'البقاء مستقيماً تماماً بشكل عمودي مما يحول التمرين بالكامل إلى الترايسبس ويقلل تفعيل الصدر.',
      'النزول المفرط لأسفل أكثر من 90 درجة مما يضع ضغطاً هائلاً على أوتار ومحفظة الكتف الأمامي.',
      'أرجحة الساقين واستخدام قوة الدفع بدلاً من قوة الصدر النقية.'
    ],
    breathingTip: 'Inhale smoothly during the descent; exhale steadily as you drive yourself up.',
    breathingTipAr: 'شهيق عميق ومتحكم أثناء النزول؛ وزفير متواصل مع الدفع والصعود لنقطة البداية.',
    proTip: 'A slight flare of the elbows (45 degrees) combined with a forward chest tilt places direct tensile stress on pectoral insertion fibers.',
    proTipAr: 'الميلان للأمام مع فتح الكوعين قليلاً بزاوية 45 درجة يضع الحمل الميكانيكي الأكبر على الصدر مع راحة تامة للمرفق.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/eicOUO9WaJc',
    youtubeSearchQuery: 'Chest Dips proper form short'
  },

  'dips': {
    id: 'dips',
    name: 'Dips',
    nameAr: 'تمرين المتوازي (دبس)',
    targetMuscle: 'Chest',
    targetMuscleAr: 'الصدر والترايسبس',
    secondaryMuscles: ['Triceps', 'Front Delts'],
    secondaryMusclesAr: ['الترايسبس', 'الكتف الأمامي'],
    equipment: 'Dip Station / Parallel Bars',
    equipmentAr: 'جهاز المتوازي',
    difficulty: 'Intermediate',
    difficultyAr: 'متوسط',
    overview: 'Essential compound movement targeting lower chest, triceps, and anterior shoulders.',
    overviewAr: 'التمرين المركب الأساسي لبناء الصدر السفلي وقوة الترايسبس وأكتاف الدفع.',
    steps: [
      'Hold onto dip bars with arms straight.',
      'Lean slightly forward to bias chest engagement.',
      'Lower until elbows are at 90 degrees.',
      'Push up back to start position with controlled power.'
    ],
    stepsAr: [
      'امسك قضيبي المتوازي بذراعين مفرودتين.',
      'مل بجذعك للأمام قليلاً لتركيز الجهد على الصدر.',
      'انزل ببطء حتى يصل كوعك لزاوية 90 درجة.',
      'ادفع بقوة وثبات للأعلى لنقطة البداية.'
    ],
    commonMistakes: [
      'Going excessively deep beyond shoulder comfort.',
      'Swinging body during repetitions.'
    ],
    commonMistakesAr: [
      'النزول لعمق مفرط يجهد مفصل الكتف.',
      'الأرجحة وفقدان السيطرة على مسار الحركة.'
    ],
    breathingTip: 'Inhale on the descent; exhale on the push up.',
    breathingTipAr: 'شهيق أثناء النزول؛ وزفير أثناء الدفع للأعلى.',
    proTip: 'Squeeze the dip handles hard to radiate stability into upper arm joints.',
    proTipAr: 'اقبض على قضيبي المتوازي بقوة لزيادة ثبات المفاصل العلوية.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/eicOUO9WaJc',
    youtubeSearchQuery: 'Dips form short'
  },

  // ==================== BACK ====================
  'lat-pulldown': {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    nameAr: 'سحب ظهر عالي واسع (المجنص)',
    targetMuscle: 'Back',
    targetMuscleAr: 'عضلة الظهر العريضة (المجنص - Lats)',
    secondaryMuscles: ['Biceps', 'Rhomboids', 'Rear Delts'],
    secondaryMusclesAr: ['البايسبس', 'منتصف الظهر', 'الكتف الخلفي'],
    equipment: 'Cable Lat Pulldown Machine',
    equipmentAr: 'جهاز سحب الظهر العالي',
    difficulty: 'Beginner',
    difficultyAr: 'مبتدئ',
    overview: 'The definitive vertical pulling exercise for developing back width and that classic athletic V-taper physique.',
    overviewAr: 'التمرين الأساسي الأول لتوسيع الظهر وبناء الشكل الرياضي V-Taper، ويستهدف المجنص وأعلى الظهر بدقة.',
    steps: [
      'Adjust thigh pad so legs are locked firmly in place with feet flat.',
      'Grip the bar with hands just outside shoulder width with overhand grip.',
      'Sit down, arch upper back slightly, pull shoulders down and back away from your ears.',
      'Drive elbows straight down toward your ribs to pull the bar smoothly to your upper chest / collarbone.',
      'Pause for a split second, then slowly control the bar upward until arms and lats are fully stretched.'
    ],
    stepsAr: [
      'اضبط وسادة الفخذين لتثبيت رجليك بإحكام دون حركة مع ملامسة القدمين للأرض.',
      'امسك البار بقبضة أوسع قليلاً من الكتفين وتوجه راحتي اليدين للأمام.',
      'اجلس واسحب لوحي كتفك للأسفل مع ميلان بسيط جداً بالجذع للخلف (حوالي 10-15 درجة).',
      'اسحب البار من خلال قيادة كوعيك للأسفل وللداخل باتجاه أضلاعك حتى يصل البار لأعلى صدرك.',
      'اثبت لجزء من الثانية ثم ارجع ببطء وتحكم حتى يتمدد الظهر بالكامل للأعلى.'
    ],
    commonMistakes: [
      'Leaning back excessively and turning the pulldown into a sloppy horizontal row.',
      'Pulling the bar behind the neck, causing severe strain on the cervical spine and shoulders.',
      'Yanking with arms and biceps instead of leading with the elbows and back.'
    ],
    commonMistakesAr: [
      'الميلان المفرط بالجذع للخلف مما يحول التمرين إلى تجديف أفقي.',
      'سحب البار خلف الرقبة مما يضع فقرات الرقبة والكتف في خطر بالغ.',
      'السحب بقوة الذراع والبايسبس بدلاً من قيادة الحركة بالكوعين وعضلات الظهر.'
    ],
    breathingTip: 'Inhale as the bar goes up to expand ribcage and lats; exhale as you pull down to your collarbone.',
    breathingTipAr: 'شهيق أثناء صعود البار وتمدد الظهر؛ وزفير أثناء سحب البار لأسفل الصدر.',
    proTip: 'Visualize having hooks on your elbows and pulling with your elbows rather than squeezing with your hands.',
    proTipAr: 'تخيل أن كفيك مجرد خطافات وأنك تسحب الوزن من كوعيك مباشرة لتفادي إرهاق البايسبس.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/CAwf7n6Luuc',
    youtubeSearchQuery: 'Lat Pulldown Proper Form Short'
  },

  'barbell-row': {
    id: 'barbell-row',
    name: 'Barbell Bent-Over Row',
    nameAr: 'تجديف مائل بالبار (بنت أوفر)',
    targetMuscle: 'Back',
    targetMuscleAr: 'سماكة الظهر ومنتصفه (Rhomboids & Lats)',
    secondaryMuscles: ['Biceps', 'Erector Spinae', 'Rear Delts'],
    secondaryMusclesAr: ['البايسبس', 'أسفل الظهر', 'الكتف الخلفي'],
    equipment: 'Barbell & Plates',
    equipmentAr: 'بار أولمبي وأوزان',
    difficulty: 'Intermediate',
    difficultyAr: 'متوسط إلى متقدم',
    overview: 'Unmatched builder for overall back thickness, density, and rear posterior chain strength.',
    overviewAr: 'أقوى تمرين لبناء سماكة وكثافة عضلات الظهر وربط الظهر العلوي بأسفل الظهر بقوة استثنائية.',
    steps: [
      'Stand with feet shoulder-width apart, grip the bar slightly wider than knees.',
      'Hinge at hips, bending knees slightly, keeping spine neutral and chest at roughly a 45-degree angle.',
      'Pull the bar smoothly toward your lower belly/navel, driving elbows back and retracting shoulder blades.',
      'Squeeze the back muscles hard at the top, then lower the bar under control with a flat back.'
    ],
    stepsAr: [
      'قف مع مباعدة القدمين بعرض الكتفين، وامسك البار بقبضة أوسع قليلاً من الركبتين.',
      'اثنِ ركبتيك قليلاً وادفع مؤخرتك للخلف (Hip Hinge) مع استقامة الظهر التامة وزاوية ميل 45 درجة.',
      'اسحب البار باتجاه أسفل بطنك وقرب السرة مع سحب كوعيك للخلف وعصر لوحي الكتف بقوة.',
      'اثبت في القمة لثانية ثم انزل بالبار ببطء وتحكم دون تقويس أسفل ظهرك.'
    ],
    commonMistakes: [
      'Rounding the lower back, which risks disc herniation under load.',
      'Standing too upright and turning it into a shrug.',
      'Using leg jerk and momentum to launch the barbell.'
    ],
    commonMistakesAr: [
      'تقويس أو انحناء أسفل الظهر مما يعرض فقرات القطنية للإصابة.',
      'الوقوف بشكل مستقيم تقريباً مما يحول التمرين إلى ترابيس.',
      'النتر واستخدام ارتداد الركبتين لرفع الوزن.'
    ],
    breathingTip: 'Inhale and brace core before initiating the pull; exhale as you pull the bar into your torso.',
    breathingTipAr: 'شهيق وتثبيت للبطن قبل الرفع؛ وزفير قوي أثناء سحب البار لملامسة أسفل البطن.',
    proTip: 'Keep your neck in line with your spine by looking at a spot on the floor about 4-6 feet in front of you, not in the mirror.',
    proTipAr: 'حافظ على استقامة رقبتك بالنظر للأرض على بعد مترين أمامك بدلاً من رفع رأسك للأعلى في المرآة.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/G8l_8chR5BE',
    youtubeSearchQuery: 'Barbell Row Proper Form Short'
  },

  'seated-cable-row': {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    nameAr: 'سحب كيبل جالس (تجديف أرضي)',
    targetMuscle: 'Back',
    targetMuscleAr: 'منتصف الظهر وسماكته (Rhomboids & Traps)',
    secondaryMuscles: ['Lats', 'Biceps', 'Rear Delts'],
    secondaryMusclesAr: ['المجنص', 'البايسبس', 'الكتف الخلفي'],
    equipment: 'Low Row Cable Machine with V-Bar',
    equipmentAr: 'جهاز السحب الأرضي بمقبض V ضيق',
    difficulty: 'Beginner',
    difficultyAr: 'مبتدئ',
    overview: 'Builds impressive mid-back depth and strengthens scapular retraction with constant cable tension.',
    overviewAr: 'يبني عمقاً وسماكة واضحة في منتصف الظهر ويحسن من استقامة الجسم والكتفين بفضل الشد المستمر للكيبل.',
    steps: [
      'Sit on the bench with feet on footrests and knees slightly flexed.',
      'Grab the V-handle and sit upright with chest tall and core braced.',
      'Let your shoulders stretch forward slightly on the negative to lengthen the back muscles.',
      'Pull the handle into your abdomen, driving elbows back and pinching shoulder blades together tightly.',
      'Hold the squeeze, then return smoothly with a flat back.'
    ],
    stepsAr: [
      'اجلس وضع قدميك على المساند مع ثني الركبتين قليلاً (لا تقفل الركبة تماماً).',
      'امسك المقبض واجلس بظهر مستقيم وصدر مرفوع.',
      'اسمح لكتفيك بالامتداد للأمام بهدوء للحصول على تمدد كامل لعضلات الظهر.',
      'اسحب المقبض باتجاه أسفل بطنك مع إرجاع كوعيك للخلف وتخيل أنك تعصر قلماً بين لوحي كتفك.',
      'اثبت للحظة ثم ارجع ببطء دون أن يتقوس ظهرك.'
    ],
    commonMistakes: [
      'Swinging torso back and forth like a rowboat to move heavy weights.',
      'Rounding shoulders and hunching forward at the contraction point.',
      'Pulling too high toward the chest instead of the belly button.'
    ],
    commonMistakesAr: [
      'التأرجح المستمر بالجذع للأمام والخلف كقارب تجديف لرفع وزن أثقل.',
      'تقويس الظهر عند سحب الوزن بدلاً من فتح الصدر.',
      'سحب المقبض لارتفاع عالي عند الصدر بدلاً من أسفل البطن.'
    ],
    breathingTip: 'Exhale as you row the handle toward your stomach; inhale as you slowly extend arms forward.',
    breathingTipAr: 'زفير أثناء سحب المقبض لبطنك؛ وشهيق تدريجي أثناء عودة الوزن للأمام.',
    proTip: 'Initiate the movement by retracting your scapulae first before your arms even start bending.',
    proTipAr: 'ابدأ الحركة بسحب لوحي الكتف للخلف أولاً قبل أن يبدأ كوعاك بالانثناء لعزل الظهر التام.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/GZbfZ033f74',
    youtubeSearchQuery: 'Seated Cable Row Form Short'
  },

  // ==================== LEGS ====================
  'barbell-back-squat': {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    nameAr: 'سكوات خلفي بالبار (القرفصاء)',
    targetMuscle: 'Legs',
    targetMuscleAr: 'الفخذ الأمامي والأرداف (Quads & Glutes)',
    secondaryMuscles: ['Hamstrings', 'Core', 'Calves'],
    secondaryMusclesAr: ['الفخذ الخلفي', 'عضلات الجذع والبطن', 'السمانة'],
    equipment: 'Barbell & Squat Rack',
    equipmentAr: 'بار أولمبي وقفص السكوات',
    difficulty: 'Intermediate',
    difficultyAr: 'متوسط إلى متقدم',
    overview: 'The indisputable gold standard for full-body and lower-body development, building explosive leg power and muscular mass.',
    overviewAr: 'التمرين الأقوى على الإطلاق لبناء عضلات الجزء السفلي وكامل الجسم، وزيادة القوة والكتلة العضلية وإفراز الهرمونات البنائية.',
    steps: [
      'Step under the bar, resting it across your upper traps (high bar) or rear delts (low bar).',
      'Step back, placing feet slightly wider than shoulder-width with toes turned out 15-30 degrees.',
      'Take a deep belly breath, brace your core like preparing for a punch, and unlock hips and knees together.',
      'Squat down by pushing knees outward in line with toes until hip crease drops below the top of the knee (parallel or deeper).',
      'Drive aggressively through mid-foot and heels back to standing while keeping chest proud.'
    ],
    stepsAr: [
      'ادخل تحت البار وثبته على عضلات أعلى الظهر والترابيس، وامسكه بقبضة متوازنة.',
      'خذ خطوتين للخلف وضع قدميك باتساع الكتفين مع توجيه أطراف الأصابع للخارج بزاوية 15 إلى 30 درجة.',
      'خذ شهيقاً عميقاً في بطنك واشد عضلات البطن (Brace) كأن أحداً سيلكمك.',
      'انزل بالجلوس بين رجليك مع دفع ركبتيك للخارج باتجاه أصابعك حتى يصبح فخذاك موازيين للأرض على الأقل.',
      'ادفع الأرض بمنتصف كعبك وقدمك بقوة عائداً للوقوف مع الحفاظ على الصدر مرفوعاً.'
    ],
    commonMistakes: [
      'Knees caving inward (valgus collapse) during the ascent.',
      'Heels lifting off the ground due to poor ankle mobility or wrong center of gravity.',
      'Half-reps / failing to reach parallel, missing peak quad and glute recruitment.'
    ],
    commonMistakesAr: [
      'دخول الركبتين للداخل أثناء الصعود مما يعرض أربطة الركبة للخطر.',
      'ارتفاع الكعبين عن الأرض أثناء النزول.',
      'عدم النزول للعمق الموازي (Half Squat) مما يحرم العضلات من أقصى تفعيل.'
    ],
    breathingTip: 'Take a massive diaphragmatic breath at the top and hold it throughout the descent (Valsalva maneuver); exhale as you finish standing.',
    breathingTipAr: 'شهيق عميق جداً في البطن وحبسه لتثبيت العمود الفقري أثناء النزول؛ وإخراج الزفير بعد تجاوز ثلثي مسار الصعود.',
    proTip: 'Screw your feet into the floor like you are trying to spread the floor apart to fire up your glutes automatically.',
    proTipAr: 'تخيل أنك تحاول شق الأرض بين قدميك للخارج لتفعيل عضلات المؤخرة وحماية الركبتين فورياً.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/bEv6CCg2BC8',
    youtubeSearchQuery: 'Barbell Back Squat Form Short'
  },

  'leg-press': {
    id: 'leg-press',
    name: 'Leg Press',
    nameAr: 'مكبس الأرجل (ليج برس)',
    targetMuscle: 'Legs',
    targetMuscleAr: 'الفخذ الأمامي والشامل (Quadriceps & Glutes)',
    targetMuscleId: 'quads',
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Calves'],
    secondaryMusclesAr: ['الأرداف والمؤخرة', 'الفخذ الخلفي', 'السمانة'],
    secondaryMuscleIds: ['glutes', 'hamstrings'],
    motionPattern: 'squat',
    activationScore: 95,
    angleCues: [
      { label: 'Knee Depth', labelAr: 'عمق ثني الركبة', value: '90° Parallel Angle' },
      { label: 'Lockout Safety', labelAr: 'أمان المفصل', value: 'Slight Soft Bend at Top' },
      { label: 'Pelvis Flat', labelAr: 'ثبات الحوض', value: 'Pinned Flat to Seat' }
    ],
    equipment: '45-Degree Leg Press Machine',
    equipmentAr: 'جهاز مكبس الأرجل 45 درجة',
    difficulty: 'Beginner',
    difficultyAr: 'مبتدئ إلى متوسط',
    overview: 'Allows massive overload on the quadriceps without spinal compression, ideal for pushing legs to true muscular failure safely.',
    overviewAr: 'يتيح وضع أحمال عالية جداً وتحدي الفخذين حتى الفشل العضلي دون تسليط أي ضغط محوري على فقرات العمود الفقري.',
    steps: [
      'Sit fully back in the seat with your glutes and lower back pinned to the pad.',
      'Place feet shoulder-width apart on the platform in the center, toes turned slightly outward.',
      'Release safety pins and lower the sled smoothly until knees reach roughly 90 degrees without lower back peeling off.',
      'Press the sled back up through your heels and mid-foot, stopping just short of locking your knees.'
    ],
    stepsAr: [
      'اجلس مع التصاق تام لأسفل ظهرك وحوضك بالمسند ومسك المقابض الجانبية لتثبيت جسمك.',
      'ضع قدميك بمنتصف اللوح بعرض الكتفين مع اتجاه أصابع طفيف للخارج (10-15 درجة).',
      'حرر قفل الأمان وانزل بالوزن بهدوء حتى تنثني الركبتان بزاوية 90 درجة تقريباً دون أن يرتفع حوضك عن الكرسي.',
      'ادفع اللوح للأعلى بكعبيك ومنتصف قدمك وتوقف قبل قفل مفصل الركبة تماماً.'
    ],
    commonMistakes: [
      'Locking out knees aggressively at the top (hyperextension can cause catastrophic joint damage).',
      'Letting the lower back round off the seat at the bottom of the press.',
      'Placing hands on knees to cheat during pushing.'
    ],
    commonMistakesAr: [
      'فرد وقفل مفصل الركبة تماماً في القمة (Lockout) مما ينقل الوزن الثقيل للمفصل ويسبب إصابات خطيرة.',
      'ارتفاع أسفل الظهر عن الكرسي أثناء النزول العميق مما يضغط على الفقرات القطنية.',
      'وضع اليدين على الركبتين لدفع الوزن بدلاً من عضلات الأرجل.'
    ],
    breathingTip: 'Inhale as the platform descends toward your chest; exhale powerfully as you push the sled up.',
    breathingTipAr: 'شهيق عميق أثناء نزول اللوح باتجاهك؛ وزفير قوي ومندفع أثناء الدفع للأعلى.',
    proTip: 'Hold the side handles firmly to pull your hips down hard into the seat cushion.',
    proTipAr: 'امسك المقابض الجانبية للجهاز واسحب جسمك بها لأسفل لتثبيت حوضك في المقعد ومنع رفعه.',
    videoUrl: 'https://www.youtube.com/shorts/BnacvXdaxq8',
    youtubeSearchQuery: 'Leg Press Proper Form Short'
  },

  'leg-extension': {
    id: 'leg-extension',
    name: 'Leg Extension',
    nameAr: 'جهاز تمديد الأرجل الأمامية (ليج إكستنشن)',
    targetMuscle: 'Legs',
    targetMuscleAr: 'الفخذ الأمامي المعزول (Quadriceps - Rectus Femoris)',
    targetMuscleId: 'quads',
    secondaryMuscles: ['Vastus Medialis', 'Vastus Lateralis'],
    secondaryMusclesAr: ['عضلة الفخذ الداخلية (الدمعة)', 'عضلة الفخذ الخارجية'],
    secondaryMuscleIds: ['quads'],
    motionPattern: 'leg_extension',
    activationScore: 94,
    angleCues: [
      { label: 'Pivot Axis', labelAr: 'محور الركبة', value: 'Aligned with Cam Axle' },
      { label: 'Peak Contraction', labelAr: 'الانقباض في القمة', value: '1s Full Isometric Squeeze' },
      { label: 'Descent Tempo', labelAr: 'النزول السلبي', value: '3s Strict Tempo' }
    ],
    equipment: 'Leg Extension Machine',
    equipmentAr: 'جهاز تمديد الأرجل (Leg Extension)',
    difficulty: 'Beginner',
    difficultyAr: 'مبتدئ',
    overview: 'The premier isolation movement for the quadriceps, specifically overloading the shortened position and sculpting direct definition across the rectus femoris.',
    overviewAr: 'أفضل تمرين عزل مباشر للفخذ الأمامي، يركز على قمة الانقباض العضلي ويمنح الفخذ تفاصيل عضلية دقيقة وتحديداً بارزاً (دمعة الفخذ).',
    steps: [
      'Adjust the backrest so the pivot point of the machine aligns exactly with your knee joints.',
      'Position the pad across the lower part of your shins, just above the ankles.',
      'Grip the handles tightly to secure your hips down into the seat pad.',
      'Exhale and extend your legs smoothly upward until your knees are straight and quads are locked in full contraction.',
      'Pause at the peak for 1 second, then lower under a slow 3-second eccentric tempo.'
    ],
    stepsAr: [
      'اضبط مسند الظهر بحيث يكون محور دوران ركبتيك متطابقاً تماماً مع محور دوران الجهاز الدائري.',
      'اضبط الوسادة السفلية لتستقر بنعومة على أسفل ساقيك، فوق مفصل الكاحل مباشرة.',
      'أمسك بمقابض الجهاز الجانبية بقوة واسحب نفسك لأسفل لضمان بقاء فخذيك ومؤخرتك ملتصقين بالمقعد.',
      'أخرج الزفير وارفع ساقيك للأعلى بحركة سلسة ومتحكم بها حتى تستقيم ركبتك وينقبض الفخذ الأمامي بالكامل (دون ركل أو نتر).',
      'اثبت في القمة لثانية كاملة مع عصر الفخذ الأمامي بقوة، ثم انزل بالوزن بنزول سلبي بطيء (3 ثوانٍ).'
    ],
    commonMistakes: [
      'Kicking the weight violently using momentum instead of smooth quad tension.',
      'Not aligning knees with machine axis, creating shearing pressure on the patella.',
      'Letting the weight slam down at the bottom of the rep.'
    ],
    commonMistakesAr: [
      'ركل الوزن ونتره للأعلى بسرعة بدلاً من رفعه بالانقباض العضلي الصافي.',
      'عدم محاذاة مفصل الركبة مع محور دوران الجهاز مما يضع ضغطاً مؤلماً على صابونة الركبة وأوتارها.',
      'إفلات الوزن ليهبط ويرتطم في أسفل المسار بدلاً من التحكم في النزول السلبي.'
    ],
    breathingTip: 'Exhale forcefully as you extend and squeeze your quads; inhale as you lower the weight slowly.',
    breathingTipAr: 'أخرج الزفير بقوة أثناء رفع الساقين وعصر الفخذ في القمة؛ وخذ شهيقاً هادئاً أثناء النزول البطيء.',
    proTip: 'Point your toes slightly upward (dorsiflexion) to maximize recruitment through the rectus femoris.',
    proTipAr: 'اسحب أصابع قدميك للأعلى باتجاه ساقك (Dorsiflexion) أثناء التمديد لمضاعفة التوتر العضلي على كامل الفخذ الأمامي.',
    videoUrl: 'https://www.youtube.com/shorts/uM86QE59Tgc',
    youtubeSearchQuery: 'Leg Extension Proper Form Short'
  },

  'romanian-deadlift': {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift (RDL)',
    nameAr: 'ديدليفت روماني (RDL)',
    targetMuscle: 'Legs',
    targetMuscleAr: 'الفخذ الخلفي والأرداف (Hamstrings & Glutes)',
    secondaryMuscles: ['Lower Back', 'Forearms', 'Core'],
    secondaryMusclesAr: ['أسفل الظهر', 'الساعد وقوة القبضة', 'الجذع'],
    equipment: 'Barbell or Dumbbells',
    equipmentAr: 'بار أولمبي أو دمبلز',
    difficulty: 'Intermediate',
    difficultyAr: 'متوسط',
    overview: 'The premier hip-hinge exercise for lengthening and overloading the hamstrings and glutes under deep eccentric stretch.',
    overviewAr: 'التمرين الأكثر فاعلية علمياً لبناء وتطويل عضلات الفخذ الخلفي وتقوية أوتار الركبة والأرداف من خلال التمدد العميق.',
    steps: [
      'Stand upright holding the barbell with a double-overhand grip, feet hip-width apart.',
      'Soften your knees slightly (do not keep them locked, but do not squat).',
      'Push your hips directly backward as if trying to touch a wall behind you with your glutes.',
      'Slide the bar closely down your thighs and shins until you feel an intense stretch in hamstrings.',
      'Drive hips forward to return to standing, squeezing glutes hard at the top.'
    ],
    stepsAr: [
      'قف مستقيماً ممسكاً بالبار بقبضة محكمة، والقدمان بعرض الحوض.',
      'اثنِ ركبتيك ثنية بسيطة جداً وثابتة طوال الرفعة (لا تقفل الركبة ولا تنزل كسكوات).',
      'ادفع حوضك ومؤخرتك للخلف كأنك تحاول لمس جدار خلفك مع استقامة الظهر التامة.',
      'اجعل البار ينزلق ملاصقاً لفخذيك وساقيك حتى تشعر بتمدد قوي في الفخذ الخلفي (عادة تحت الركبة بقليل).',
      'ادفع حوضك للأمام للعودة للوقوف مع عصر عضلات المؤخرة في الأعلى.'
    ],
    commonMistakes: [
      'Squatting the weight down instead of hinging back at the hips.',
      'Allowing the barbell to drift away from the shins, placing heavy torque on the lumbar spine.',
      'Rounding the upper or lower back.'
    ],
    commonMistakesAr: [
      'ثني الركبتين والنزول كأسلوب السكوات بدلاً من إرجاع الحوض للخلف.',
      'ابتعاد البار عن الساقين للأمام مما يضع حملاً هائلاً على فقرات الظهر.',
      'تقويس الظهر للنزول لمستوى أخفض.'
    ],
    breathingTip: 'Inhale and brace core at the top; hold breath during the hinge descent; exhale as hips lock out.',
    breathingTipAr: 'شهيق وتثبيت للبطن في الأعلى؛ الحفاظ عليه أثناء النزول؛ وزفير عند العودة للوقوف.',
    proTip: 'Stop descending the moment your hips stop moving backward. Going lower only bends your spine, not your hamstrings.',
    proTipAr: 'توقف عن النزول في اللحظة التي يتوقف فيها حوضك عن التحرك للخلف؛ أي نزول إضافي سيكون من ظهرك وليس من فخذك الخلفي.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/JCXUYuzwNrM',
    youtubeSearchQuery: 'Romanian Deadlift Form Short'
  },

  // ==================== SHOULDERS ====================
  'overhead-press': {
    id: 'overhead-press',
    name: 'Overhead Press (OHP)',
    nameAr: 'دفع كتف عسكري بالبار (OHP)',
    targetMuscle: 'Shoulders',
    targetMuscleAr: 'الكتف الأمامي والجانبي (Deltoids)',
    secondaryMuscles: ['Triceps', 'Upper Chest', 'Core'],
    secondaryMusclesAr: ['الترايسبس', 'أعلى الصدر', 'عضلات الجذع'],
    equipment: 'Barbell & Rack',
    equipmentAr: 'بار أولمبي وقفص أوزان',
    difficulty: 'Intermediate',
    difficultyAr: 'متوسط إلى متقدم',
    overview: 'The fundamental vertical press building broad, boulder shoulders, overhead stability, and core rigidity.',
    overviewAr: 'التمرين الأساسي الأول لبناء أكتاف عريضة وضخمة، وتطوير قوة الدفع العمودي وثبات الجذع بالكامل.',
    steps: [
      'Rest the bar across front delts and clavicles with hands just outside shoulders, forearms vertical.',
      'Squeeze glutes, quads, and abs tight to create a rigid base.',
      'Tilt head back slightly to clear the chin and press the bar straight up.',
      'Once the bar clears the forehead, push your head forward back to neutral and lock out arms overhead.',
      'Lower the bar under control back to the clavicle shelf.'
    ],
    stepsAr: [
      'ضع البار على عضلات الكتف الأمامي وأعلى الصدر، مع قبض البار بمحاذاة الكتفين وساعدين عموديين.',
      'شد عضلات بطنك والمؤخرة والفخذين بقوة لعمل قاعدة فولاذية ثابتة.',
      'مل برأسك قليلاً للخلف لإفساح المجال للبار، ثم ادفع البار في خط مستقيم للأعلى.',
      'بمجرد تجاوز البار لجبهتك، أعد رأسك للأمام واقفل ذراعيك فوق رأسك بثبات.',
      'انزل بالبار بهدوء عائداً إلى أعلى صدرك.'
    ],
    commonMistakes: [
      'Excessively arching the lower back to turn it into an incline chest press.',
      'Flaring elbows out horizontally instead of keeping forearms directly beneath the bar.',
      'Bending the knees to push-press the weight when performing strict press.'
    ],
    commonMistakesAr: [
      'تقويس أسفل الظهر بشكل مفرط مما يعرض الفقرات للإصابة ويحوله لتمرين صدر مائل.',
      'فتح الكوعين للجانبين بدلاً من إبقائهما تحت البار مباشرة.',
      'ثني الركبتين للنتر أثناء أداء الرفعة الصارمة.'
    ],
    breathingTip: 'Inhale deeply at the bottom; exhale as the bar locks out overhead.',
    breathingTipAr: 'شهيق عميق في الأسفل مع تثبيت البطن؛ وزفير عند وصول البار لأعلى نقطة فوق الرأس.',
    proTip: 'Squeeze your glutes as hard as humanly possible during the press to prevent your lower back from overarching.',
    proTipAr: 'اعصر عضلات المؤخرة بأقصى قوة أثناء الدفع؛ هذا يمنع انحناء أسفل ظهرك ويمنحك قوة دفع مضاعفة.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/Gkk-6q7Rq-s',
    youtubeSearchQuery: 'Overhead Shoulder Press Proper Form Short'
  },

  'cable-lateral-raise': {
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    nameAr: 'طيران جانبي بالكيبل',
    targetMuscle: 'Shoulders',
    targetMuscleAr: 'الكتف الجانبي (Lateral Deltoid)',
    secondaryMuscles: ['Traps'],
    secondaryMusclesAr: ['الترابيس العلوية'],
    equipment: 'Cable Pulley Station & D-Handle',
    equipmentAr: 'جهاز الكيبل السفلي مع مقبض فردي',
    difficulty: 'Beginner',
    difficultyAr: 'مبتدئ',
    overview: 'The single most effective isolation exercise for 3D capped side delts, maintaining constant resistance through the entire movement.',
    overviewAr: 'التمرين السري والأفضل عالمياً للحصول على أكتاف دائرية وعريضة (3D)، بفضل الحفاظ على الشد العضلي من أول سنتيمتر حتى القمة.',
    steps: [
      'Set pulley to wrist or knee height. Stand sideways and hold the handle with the outside hand.',
      'Lean slightly away from the cable station for an optimal resistance curve.',
      'Lead with your elbow and raise your arm outward and slightly forward in the scapular plane (30° forward).',
      'Raise until parallel to the floor, pause briefly, then lower slowly with tension.'
    ],
    stepsAr: [
      'اضبط بكرة الكيبل على ارتفاع الركبة أو أسفل قليلاً، وقف جانباً ممسكاً بالمقبض باليد البعيدة.',
      'مل بجسمك قليلاً بعيداً عن الجهاز لزيادة المدى الحركي والشد العضلي في بداية الحركة.',
      'ارفع ذراعك للجانب مع ميلان للأمام قليلاً (في مستوى لوح الكتف 30 درجة) بقيادة الكوع.',
      'ارفع حتى مستوى الكتف، اثبت لثانية، ثم انزل ببطء وتحكم شديد.'
    ],
    commonMistakes: [
      'Shrugging traps to lift the arm instead of isolating the side delt.',
      'Swinging torso to generate momentum.',
      'Raising hands above shoulder level, transferring tension directly to upper traps.'
    ],
    commonMistakesAr: [
      'رفع الترابيس للأعلى عند الرفع بدلاً من عزل الكتف الجانبي.',
      'أرجحة الجذع لتحريك الوزن.',
      'رفع اليد لأعلى بكثير من مستوى الكتف مما ينقل الحمل للترابيس.'
    ],
    breathingTip: 'Exhale as you raise the arm laterally; inhale as you control the cable back down.',
    breathingTipAr: 'زفير أثناء رفع الذراع للجانب؛ وشهيق أثناء النزول المتحكم به.',
    proTip: 'Think of pushing your knuckle and elbow toward the wall far away from you, not just lifting up.',
    proTipAr: 'تخيل أنك تدفع كوعك ويدك بعيداً باتجاه الجدار الجانبي وليس فقط للأعلى.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/Kl3LEzQ5Zqs',
    youtubeSearchQuery: 'Dumbbell Lateral Raise Proper Form Short'
  },

  'face-pull': {
    id: 'face-pull',
    name: 'Face Pulls',
    nameAr: 'سحب للوجه بالكيبل (فيس بول)',
    targetMuscle: 'Shoulders',
    targetMuscleAr: 'الكتف الخلفي (Rear Deltoids)',
    secondaryMuscles: ['Traps', 'Rhomboids', 'Rotator Cuff'],
    secondaryMusclesAr: ['الترابيس', 'منتصف الظهر', 'أوتار الكتف'],
    equipment: 'Cable Station with Rope',
    equipmentAr: 'جهاز الكيبل العلوي بحبل',
    difficulty: 'Beginner',
    difficultyAr: 'مبتدئ',
    overview: 'The most underrated shoulder exercise for building thick rear delts, improving posture, and protecting rotator cuff health.',
    overviewAr: 'التمرين الأكثر أهمية وإهمالاً لبناء الكتف الخلفي وتصحيح الوضعية وحماية أوتار الكتف من الإصابات المزمنة.',
    steps: [
      'Set the cable pulley above head height and attach a rope handle.',
      'Grab both ends of the rope with an overhand grip, step back and stand with soft knees.',
      'Pull the rope toward your face, keeping upper arms parallel to the floor and elbows flared high.',
      'As the rope reaches your face, externally rotate your shoulders so hands end up beside your ears.',
      'Squeeze your rear delts and rhomboids hard for a second, then slowly return under tension.'
    ],
    stepsAr: [
      'اضبط بكرة الكيبل لمستوى أعلى من الرأس وثبت الحبل بها.',
      'امسك طرفي الحبل بقبضة فوقية، وتأخر للخلف وقف بركبتين مثنيتين قليلاً.',
      'اسحب الحبل باتجاه وجهك مع بقاء ذراعيك العلويتين مواجيتين للأرض والكوعين مرتفعين.',
      'عند وصول الحبل لوجهك، دوّر كتفيك للخارج حتى تنتهي يداك بجانب أذنيك.',
      'اعصر عضلات الكتف الخلفي ومنتصف الظهر بقوة لثانية ثم ارجع ببطء.'
    ],
    commonMistakes: [
      'Pulling the rope to the neck or chest instead of directly toward the face.',
      'Letting elbows drop below shoulder height, removing rear delt tension.',
      'Using too much weight and turning it into a bicep pull.'
    ],
    commonMistakesAr: [
      'سحب الحبل للرقبة أو الصدر بدلاً من الوجه مباشرة.',
      'انخفاض الكوعين دون مستوى الكتف مما يفقد التوتر عن الكتف الخلفي.',
      'استخدام أوزان ثقيلة جداً تحول التمرين لسحب بالبايسبس.'
    ],
    breathingTip: 'Exhale as you pull the rope toward your face; inhale as you return it forward under control.',
    breathingTipAr: 'زفير أثناء سحب الحبل لوجهك؛ وشهيق أثناء العودة ببطء للأمام.',
    proTip: 'Keep your elbows high and think about pointing them toward the ceiling as you pull, not toward the walls.',
    proTipAr: 'ارفع كوعيك عالياً وتخيل أنك تشيرهما للسقف وليس للجدار الجانبي لعزل تام للكتف الخلفي.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/IeOqdw9WI90',
    youtubeSearchQuery: 'Face Pulls Proper Form Short'
  },

  'front-dumbbell-raise': {
    id: 'front-dumbbell-raise',
    name: 'Front Dumbbell Raise',
    nameAr: 'رفع دمبلز للأمام (فرونت ريز)',
    targetMuscle: 'Shoulders',
    targetMuscleAr: 'الكتف الأمامي (Anterior Deltoid)',
    secondaryMuscles: ['Upper Chest', 'Traps'],
    secondaryMusclesAr: ['أعلى الصدر', 'الترابيس العلوية'],
    equipment: 'Dumbbells',
    equipmentAr: 'دمبلز',
    difficulty: 'Beginner',
    difficultyAr: 'مبتدئ',
    overview: 'Directly isolates the anterior deltoid to build front shoulder mass and improve overhead pressing strength.',
    overviewAr: 'يعزل الكتف الأمامي بشكل مباشر لبناء ضخامة الجزء الأمامي من الكتف وتحسين قوة الدفع العمودي.',
    steps: [
      'Stand with feet shoulder-width apart, holding dumbbells in front of your thighs with a neutral or pronated grip.',
      'Keep a slight bend in your elbows and brace your core.',
      'Raise one or both dumbbells forward in a controlled arc until arms are parallel to the floor (shoulder height).',
      'Hold briefly at the top with tension, then lower slowly back to the starting position.'
    ],
    stepsAr: [
      'قف بعرض الكتفين ممسكاً بالدمبلز أمام فخذيك بقبضة محايدة أو أمامية.',
      'حافظ على ثني خفيف ثابت في الكوعين واشد عضلات البطن للثبات.',
      'ارفع الدمبل أو الدمبلين للأمام في قوس متحكم حتى تصبح الذراع موازية للأرض على مستوى الكتف.',
      'اثبت للحظة في القمة مع إبقاء الشد العضلي، ثم انزل ببطء وتحكم.'
    ],
    commonMistakes: [
      'Swinging the torso backward to throw the weight up with momentum.',
      'Raising dumbbells above shoulder height, stressing the AC joint.',
      'Using too heavy a weight and sacrificing form for load.'
    ],
    commonMistakesAr: [
      'أرجحة الجذع للخلف لرفع الدمبل بقوة الدفع بدلاً من العضلة.',
      'رفع الدمبل فوق مستوى الكتف مما يجهد مفصل قمة الكتف (AC Joint).',
      'استخدام أوزان ثقيلة على حساب الشكل الصحيح للتمرين.'
    ],
    breathingTip: 'Exhale as you raise the dumbbells forward; inhale as you lower them back down.',
    breathingTipAr: 'زفير أثناء رفع الدمبلز للأمام؛ وشهيق أثناء إنزالها ببطء.',
    proTip: 'Tilt your pinky finger slightly upward at the top of the raise to pour more tension directly onto the front delt fibers.',
    proTipAr: 'ادوّر أصابعك الصغيرة قليلاً للأعلى عند قمة الحركة لتوجيه الشد العضلي بدقة على ألياف الكتف الأمامي.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/9ThlTL25DH8',
    youtubeSearchQuery: 'Front Dumbbell Raise Proper Form Short'
  },

  'reverse-pec-deck': {
    id: 'reverse-pec-deck',
    name: 'Reverse Pec Deck',
    nameAr: 'تمرين الكتف الخلفي بالجهاز (ريفيرس فلاي)',
    targetMuscle: 'Shoulders',
    targetMuscleAr: 'الكتف الخلفي والأوسط (Rear & Mid Deltoid)',
    secondaryMuscles: ['Rhomboids', 'Traps', 'Rotator Cuff'],
    secondaryMusclesAr: ['منتصف الظهر', 'الترابيس', 'أوتار الكتف'],
    equipment: 'Pec Deck Machine (Reverse)',
    equipmentAr: 'جهاز تجميع الصدر معكوساً (Pec Deck)',
    difficulty: 'Beginner',
    difficultyAr: 'مبتدئ',
    overview: 'Isolates the posterior deltoid and scapular retractors with guided machine resistance, perfect for balanced shoulder development.',
    overviewAr: 'يعزل الكتف الخلفي وعضلات شد لوح الكتف بمسار آمن ومستقر تماماً، مثالي لتوازن الكتف وتصحيح الوضعية.',
    steps: [
      'Sit facing the machine pad with chest against the chest pad. Adjust seat so handles are at shoulder height.',
      'Grab the handles with a neutral grip, arms slightly bent and extended in front of you.',
      'Squeeze your shoulder blades together and push the handles backward and outward in a wide sweeping arc.',
      'Hold the peak contraction for 1-2 seconds with rear delts fully squeezed.',
      'Slowly return the handles to the start position, feeling the stretch across your upper back.'
    ],
    stepsAr: [
      'اجلس وجهاً للجهاز مع ملامسة صدرك للمسند، واضبط المقعد بحيث تكون المقابض على مستوى كتفيك.',
      'امسك المقابض بقبضة محايدة مع انحناء خفيف للكوعين.',
      'اضغط لوحي كتفك للخلف وادفع المقابض للخلف والخارج في قوس واسع.',
      'اثبت في القمة لثانية إلى ثانيتين مع عصر كامل للكتف الخلفي.',
      'ارجع ببطء وتحكم للأمام حتى تشعر بتمدد في عضلات الظهر العلوي.'
    ],
    commonMistakes: [
      'Rounding the chest away from the pad, using body momentum to swing handles back.',
      'Gripping too tightly with hands and pulling with biceps instead of rear delts.',
      'Allowing handles to slam forward without controlling the eccentric phase.'
    ],
    commonMistakesAr: [
      'فصل الصدر عن مسند الجهاز واستخدام أرجحة الجذع لتحريك الوزن.',
      'الضغط الزائد باليدين وسحب الوزن بالبايسبس بدلاً من الكتف الخلفي.',
      'السماح للمقابض بالعودة للأمام بسرعة وبدون تحكم.'
    ],
    breathingTip: 'Exhale as you sweep the handles backward; inhale as you bring them slowly forward.',
    breathingTipAr: 'زفير أثناء سحب المقابض للخلف وعصر الكتف الخلفي؛ وشهيق أثناء العودة للأمام.',
    proTip: 'Think about leading the movement with your elbows pointing backward, not your hands pulling outward.',
    proTipAr: 'ركز على قيادة الحركة بكوعيك المتجهين للخلف وليس باليدين المنسحبتين للخارج لعزل الكتف الخلفي بدقة.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/7tgx6QHB0-A',
    youtubeSearchQuery: 'Reverse Pec Deck Proper Form Short'
  },

  // ==================== ARMS ====================
  'bicep-curls': {
    id: 'bicep-curls',
    name: 'Bicep Curls (Barbell / Dumbbell)',
    nameAr: 'بايسبس كيرل (بالبار أو الدمبلز)',
    targetMuscle: 'Biceps',
    targetMuscleAr: 'عضلة البايسبس برأسين (Biceps Brachii)',
    secondaryMuscles: ['Forearms', 'Brachialis'],
    secondaryMusclesAr: ['الساعد', 'العضدية'],
    equipment: 'Barbell, EZ-Bar, or Dumbbells',
    equipmentAr: 'بار مستقيم، بار متعرج، أو دمبلز',
    difficulty: 'Beginner',
    difficultyAr: 'مبتدئ',
    overview: 'The fundamental arm flexor builder for developing bicep peak, arm thickness, and forearm grip strength.',
    overviewAr: 'التمرين الأساسي لبناء وتضخيم عضلة البايسبس وتكوير القمة وإبراز حجم الذراع الرياضي.',
    steps: [
      'Stand tall with feet hip-width apart, holding the bar with an underhand grip.',
      'Pin your elbows firmly to your sides; they should remain stationary throughout.',
      'Curl the bar up toward your shoulders by flexing biceps only.',
      'Squeeze hard at the peak contraction for a count of one.',
      'Lower under complete control for 2-3 seconds until arms are fully extended.'
    ],
    stepsAr: [
      'قف باستقامة مع مباعدة القدمين، وامسك البار بقبضة سفلية (راحة اليد للأعلى).',
      'ثبت كوعيك بجانب خصرك تماماً وتجنب تحريكهما للأمام أو الخلف.',
      'اثنِ ذراعيك لرفع البار باتجاه كتفيك بالاعتماد على انقباض البايسبس فقط.',
      'اعصر عضلة البايسبس بقوة في أعلى نقطة لثانية كاملة.',
      'انزل بالوزن بهدوء وبطء (2 إلى 3 ثوانٍ) حتى تنفرد الذراع بالكامل وتتمدد العضلة.'
    ],
    commonMistakes: [
      'Swinging hips and lower back to heave heavy weights up.',
      'Flaring elbows outward or drifting them far forward.',
      'Dropping the weight quickly without controlling the negative eccentric phase.'
    ],
    commonMistakesAr: [
      'أرجحة الظهر والجذع لرفع وزن زائد عن طاقتك.',
      'تحريك الكوعين للأمام أو للخارج مما يضيع التوتر على البايسبس.',
      'ترك الوزن يسقط بسرعة في مرحلة النزول.'
    ],
    breathingTip: 'Exhale as you curl the weight up; inhale deeply as you lower it down.',
    breathingTipAr: 'زفير أثناء رفع الوزن للأعلى؛ وشهيق أثناء إنزال الوزن ببطء.' ,
    proTip: 'At the bottom of every rep, flex your triceps for a split-second to ensure your biceps are in a 100% full stretch before curling again.',
    proTipAr: 'في أسفل كل تكرار، اعصر عضلة الترايسبس لجزء من الثانية؛ هذا يضمن وصول البايسبس لتمدد كامل بنسبة 100% قبل التكرار التالي.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/ykJmrZ5v0Oo',
    youtubeSearchQuery: 'Bicep Curl Proper Form Short'
  },

  'tricep-pushdown': {
    id: 'tricep-pushdown',
    name: 'Cable Tricep Pushdown',
    nameAr: 'دفع ترايسبس بالكيبل (الحبل أو البار)',
    targetMuscle: 'Triceps',
    targetMuscleAr: 'الترايسبس بالكامل خاصة الرأس الجانبي (Lateral Head)',
    secondaryMuscles: ['Forearms'],
    secondaryMusclesAr: ['الساعد'],
    equipment: 'Cable Station with Rope or Straight Bar',
    equipmentAr: 'جهاز الكيبل العلوي بحبل أو بار مستقيم',
    difficulty: 'Beginner',
    difficultyAr: 'مبتدئ',
    overview: 'High-tension isolation movement targeting the lateral and medial heads of the triceps for horseshoe arm development.',
    overviewAr: 'تمرين العزل المثالي لبناء حدوة حصان الترايسبس (Horseshoe)، ويمنح الذراع ضخامة وبروزاً جانبياً قوياً.',
    steps: [
      'Attach rope or bar to top pulley. Stand with knees slightly bent and lean torso forward 10-15 degrees.',
      'Pin elbows tightly to your ribs with upper arms perpendicular to the floor.',
      'Push the cable down forcefully until elbows are locked out completely.',
      'If using rope, flare the ends outward at the bottom for maximum contraction.',
      'Allow forearms to rise slowly back to roughly 90 degrees before pressing down again.'
    ],
    stepsAr: [
      'ثبت الحبل أو البار في أعلى الكيبل، وقف مع ميلان خفيف بالجذع للأمام.',
      'ألصق كوعيك بجانبي خصرك واجعلهما ثابتين كالمفصلة طوال التمرين.',
      'ادفع الحبل للأسفل بقوة حتى تفرد ذراعيك بالكامل.',
      'إذا كنت تستخدم الحبل، باعد بين طرفيه للخارج في الأسفل لزيادة الانقباض.',
      'ارجع ببطء وتحكم حتى يصل ساعداك لزاوية 90 درجة ثم كرر.'
    ],
    commonMistakes: [
      'Letting elbows drift forward and backward, using shoulders to push.',
      'Leaning over the cable with full body weight rather than using triceps.',
      'Not locking out elbows fully at the bottom.'
    ],
    commonMistakesAr: [
      'أرجحة الكوعين للأمام والخلف واستخدام الكتف في الدفع.',
      'النوم فوق الكيبل واستخدام وزن الجسم بدلاً من عضلات الذراع.',
      'عدم فرد الذراع بالكامل في نهاية الحركة.'
    ],
    breathingTip: 'Exhale as you push the cable down; inhale as you let it return up.',
    breathingTipAr: 'زفير أثناء دفع الكيبل للأسفل؛ وشهيق أثناء العودة للأعلى.',
    proTip: 'Keep your wrists rigid and neutral; do not bend or curl your wrists downward when pushing.',
    proTipAr: 'حافظ على استقامة معصميك تماماً؛ لا تثنِ معصمك للأسفل لحماية المفصل من الإجهاد.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/2-LAMcpzODU',
    youtubeSearchQuery: 'Tricep Rope Pushdown Form Short'
  },

  // ==================== CORE ====================
  'kneeling-cable-crunch': {
    id: 'kneeling-cable-crunch',
    name: 'Kneeling Cable Crunch',
    nameAr: 'طحن البطن بالكيبل جاثياً',
    targetMuscle: 'Core',
    targetMuscleAr: 'عضلات البطن المستقيمة (Six-Pack)',
    secondaryMuscles: ['Obliques'],
    secondaryMusclesAr: ['عضلات البطن الجانبية'],
    equipment: 'Cable Station with Rope',
    equipmentAr: 'جهاز كيبل بحبل',
    difficulty: 'Intermediate',
    difficultyAr: 'متوسط',
    overview: 'The most effective weighted abdominal exercise to build deep, thick, visible 3D six-pack blocks.',
    overviewAr: 'أقوى تمرين لبناء عضلات بطن بارزة ومجسمة (3D Six-Pack) مع إمكانية زيادة الأوزان تدريجياً.',
    steps: [
      'Kneel below the high pulley holding the rope handles beside your ears.',
      'Lock your hips in place over your knees (do not sit back on your heels during the crunch).',
      'Flex your spine and crunch your ribcage directly toward your pelvis using your abs only.',
      'Exhale all air out as your elbows reach toward your knees, holding the contraction.',
      'Slowly extend your spine back up to feeling a full stretch in your abs.'
    ],
    stepsAr: [
      'اجثُ على ركبتيك أمام جهاز الكيبل العلوي ممسكاً بالحبل بجانب أذنيك أو رقبتك.',
      'ثبت حوضك في مكانه (لا تجلس على كعبيك أثناء النزول أبداً).',
      'قم بثني عمودك الفقري وتقريب قفصك الصدري من حوضك باستخدام عضلات بطنك فقط.',
      'أخرج كل الهواء بزفير كامل عند وصول كوعيك باتجاه ركبتيك واعصر بطنك بقوة.',
      'ارجع ببطء للأعلى حتى تشعر بتمدد كامل في عضلات البطن.'
    ],
    commonMistakes: [
      'Sitting back on heels like a hip-hinge instead of flexing the spine.',
      'Pulling the rope with arms and shoulders instead of flexing the torso.',
      'Keeping the back flat without curling the spine.'
    ],
    commonMistakesAr: [
      'الجلوس على الكعبين أثناء النزول مما يضيع التمرين على الحوض بدلاً من البطن.',
      'سحب الحبل بالذراعين والكتف بدلاً من طحن البطن.',
      'الحفاظ على الظهر مستقيماً دون ثني العمود الفقري.'
    ],
    breathingTip: 'Breathe out forcefully and empty your lungs as you crunch down to maximize abdominal contraction.',
    breathingTipAr: 'أخرج كل الهواء من رئتيك بزفير عميق أثناء النزول لتحقيق أقصى انقباض في عضلات البطن.',
    proTip: 'Imagine trying to touch your forehead to the floor right between your knees.',
    proTipAr: 'تخيل أنك تحاول تقريب جبهتك من الأرض بين ركبتيك لعصر كل ألياف البطن.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/2fOROmyZ7_0',
    youtubeSearchQuery: 'Kneeling Cable Crunch Form Short'
  },

  'hanging-leg-raise': {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    nameAr: 'رفع الأرجل معلقاً على العقلة',
    targetMuscle: 'Abs',
    targetMuscleAr: 'عضلات البطن السفلية والجذع (Lower Abs & Core)',
    targetMuscleId: 'abs',
    secondaryMuscles: ['Hip Flexors', 'Forearms', 'Obliques'],
    secondaryMusclesAr: ['عضلات الحوض (Hip Flexors)', 'السواعد وقوة القبضة', 'الخواصر'],
    secondaryMuscleIds: ['abs'],
    motionPattern: 'core',
    activationScore: 97,
    angleCues: [
      { label: 'Pelvic Curl', labelAr: 'تدوير الحوض للأعلى', value: 'Posterior Tilt 90°+' },
      { label: 'Anti-Swing', labelAr: 'منع التأرجح', value: 'Deadstop Control' },
      { label: 'Peak Hold', labelAr: 'ثبات في القمة', value: '1s Lower Abs Squeeze' }
    ],
    equipment: 'Pull-Up Bar',
    equipmentAr: 'عقلة سحب حرة أو جهاز العقلة',
    difficulty: 'Advanced',
    difficultyAr: 'متقدم',
    overview: 'One of the most potent abdominal exercises for targeting the lower rectus abdominis and developing elite anti-extension core stability.',
    overviewAr: 'أقوى تمرين لعزل وتطوير عضلات أسفل البطن وبناء قوة حزام الجذع والقبضة دون وضع ضغط على أسفل الظهر.',
    steps: [
      'Hang from a pull-up bar with an overhand grip, shoulders engaged (active hang) and legs straight.',
      'Inhale and brace your core tightly to prevent your body from swinging back and forth.',
      'Exhale powerfully and raise your legs upward toward 90 degrees or higher by rolling your pelvis up toward your ribcage.',
      'Hold the peak contraction at the top for 1 second, focusing on abdominal contraction rather than hip flexion.',
      'Lower your legs slowly under full eccentric control back to the starting position without swinging.'
    ],
    stepsAr: [
      'تعلق على بار العقلة بقبضة علوية محكمة، مع تثبيت لوحي الكتف قليلاً (Active Hang) لمنع التذبذب.',
      'خذ شهيقاً واشد عضلات بطنك بقوة لمنع جسمك من التأرجح كالبندول.',
      'أخرج الزفير وارفع ساقيك للأعلى بزاوية 90 درجة (أو أعلى) مع تدوير الحوض للأعلى باتجاه قفصك الصدري.',
      'اثبت في أعلى نقطة لثانية واحدة واعصر عضلات أسفل بطنك بقوة.',
      'انزل بساقيك ببطء وتحكم كامل (2 إلى 3 ثوانٍ) حتى تعود لوضعية البداية دون أن ترتد.'
    ],
    commonMistakes: [
      'Swinging the body to use momentum rather than abdominal contraction.',
      'Only flexing the hips without tilting the pelvis upward, shifting tension solely to hip flexors.',
      'Dropping legs rapidly on the eccentric descent.'
    ],
    commonMistakesAr: [
      'أرجحة الجسم للأمام والخلف واستخدام القوة الدافعة بدلاً من عصر البطن.',
      'رفع الساقين من مفصل الفخذ فقط دون ثني وتدوير الحوض للأعلى (مما ينقل الجهد لعضلات الحوض فقط).',
      'إفلات الساقين بسرعة عند النزول بدلاً من التحكم السلبي البطيء.'
    ],
    breathingTip: 'Exhale forcefully as your legs rise and you compress your ribcage to pelvis; inhale smoothly on the controlled descent.',
    breathingTipAr: 'أخرج الزفير بقوة أثناء رفع الساقين للأعلى، وخذ شهيقاً هادئاً أثناء النزول والعودة لوضع البداية.',
    proTip: 'Think of rolling your belt buckle up toward your sternum rather than merely swinging your feet up.',
    proTipAr: 'تخيل أنك تحاول رفع إبزيم حزام بنطالك للأعلى باتجاه صدرك، وليس مجرد رفع قدميك في الهواء.',
    videoUrl: 'https://www.youtube.com/shorts/XQc0WHO90Lk',
    youtubeSearchQuery: 'Hanging Leg Raise Proper Form Short'
  },

  'cable-woodchopper': {
    id: 'cable-woodchopper',
    name: 'Cable Woodchopper',
    nameAr: 'تقطيع الخشب بالكابل (وودشوبر للخواصر)',
    targetMuscle: 'Abs',
    targetMuscleAr: 'عضلات الخواصر والجذع الدوار (Obliques & Core)',
    targetMuscleId: 'abs',
    secondaryMuscles: ['Shoulders', 'Lower Back', 'Glutes'],
    secondaryMusclesAr: ['الأكتاف', 'أسفل الظهر', 'المؤخرة والأرداف'],
    secondaryMuscleIds: ['abs'],
    motionPattern: 'core',
    activationScore: 93,
    angleCues: [
      { label: 'Diagonal Vector', labelAr: 'المسار القطري', value: 'High to Low 45°' },
      { label: 'Pivot Foot', labelAr: 'دوران مشط القدم', value: 'Rear Foot Rotation' },
      { label: 'Torso Drive', labelAr: 'تدوير الوسط', value: 'Oblique Torque' }
    ],
    equipment: 'Cable Machine & Single D-Handle',
    equipmentAr: 'جهاز الكابل ومقبض فردي D-Handle',
    difficulty: 'Intermediate',
    difficultyAr: 'متوسط',
    overview: 'Rotational athletic powerhouse movement targeting the internal and external obliques and transverse abdominis for rotational torque and functional waist aesthetics.',
    overviewAr: 'تمرين رياضي دوراني فائق الفعالية لنحت وتقوية عضلات الخواصر (Obliques) وبناء قوة التدوير الوظيفية وحماية العمود الفقري.',
    steps: [
      'Set cable pulley to high shoulder level. Stand sideways to the machine with feet shoulder-width apart.',
      'Grasp the handle with both hands, arms extended with a slight bend at the elbows.',
      'Engage your core, pivot your back foot slightly, and rotate your torso diagonally downward across your body toward your opposite knee.',
      'Squeeze your obliques at the bottom of the rotation while keeping arms rigid and rotation driven by your torso.',
      'Slowly reverse the movement with controlled resistance back to the starting high position.'
    ],
    stepsAr: [
      'اضبط بكرة الكابل على مستوى الكتف أو أعلى قليلاً، وقف بشكل جانبي بالنسبة للجهاز مع مباعدة قدميك بعرض الكتفين.',
      'أمسك المقبض بكلتا يديك وافرد ذراعيك مع ثنية خفيفة جداً في الكوعين.',
      'شد عضلات بطنك، وقم بتدوير جذعك بحركة قطرية مائلة لأسفل باتجاه الركبة المقابلة، مع تدوير خفيف لمشط القدم الخلفية.',
      'اعصر عضلات الخواصر بقوة في نهاية مسار التدوير، واجعل الحركة نابعة من عضلات الجذع وليس الذراعين.',
      'عد ببطء وتحكم عكس اتجاه الحركة لمقاومة سحب الكابل حتى تصل لنقطة البداية.'
    ],
    commonMistakes: [
      'Pulling with the arms rather than initiating rotation from the core and hips.',
      'Keeping the back foot strictly planted flat, placing unnecessary torque on the knee joint.',
      'Bending too much at the lower back instead of rotating through the thoracic spine.'
    ],
    commonMistakesAr: [
      'سحب الكابل بالذراعين بدلاً من توليد القوة وتدوير الجذع والوسط.',
      'تثبيت القدم الخلفية بالكامل في الأرض دون تدوير مشط القدم مما يضع ضغطاً على الركبة.',
      'تقويس أسفل الظهر بشكل مفرط بدلاً من تدوير منطقة القفص الصدري والوسط.'
    ],
    breathingTip: 'Exhale forcefully as you rotate across your body; inhale slowly as you return to the start.',
    breathingTipAr: 'أخرج الزفير بقوة أثناء التدوير والنزول القطري، وخذ شهيقاً هادئاً أثناء العودة لوضع البداية.',
    proTip: 'Keep your arms acting merely as levers; your oblique muscles and hips should do 100% of the rotating work.',
    proTipAr: 'اجعل ذراعيك مجرد رافعة ممتدة؛ اجعل عضلات الخواصر والوسط هي التي تقود مسار الدوران بالكامل.',
    videoUrl: 'https://www.youtube.com/shorts/577986t2ILg',
    youtubeSearchQuery: 'Cable Woodchopper Form Short'
  },

  'ab-wheel-rollout': {
    id: 'ab-wheel-rollout',
    name: 'Ab Wheel Rollout',
    nameAr: 'عجلة البطن (آب رول آوت)',
    targetMuscle: 'Abs',
    targetMuscleAr: 'عضلات البطن الشاملة ومضاد التمدد (Rectus Abdominis & Deep Core)',
    targetMuscleId: 'abs',
    secondaryMuscles: ['Lats', 'Shoulders', 'Lower Back'],
    secondaryMusclesAr: ['المجنص (Lats)', 'الأكتاف', 'أسفل الظهر'],
    secondaryMuscleIds: ['abs'],
    motionPattern: 'core',
    activationScore: 98,
    angleCues: [
      { label: 'Hollow Body', labelAr: 'تثبيت التجويف', value: 'Posterior Pelvic Lock' },
      { label: 'Spine Neutral', labelAr: 'منع تقوس القطنية', value: 'Zero Lumbar Sag' },
      { label: 'Lat Engagement', labelAr: 'عصر المجنص والبطن', value: 'Forceful Pull-Back' }
    ],
    equipment: 'Ab Roller Wheel',
    equipmentAr: 'عجلة تمارين البطن (Ab Wheel)',
    difficulty: 'Advanced',
    difficultyAr: 'متقدم',
    overview: 'The undisputed gold standard for anti-extension core strength. Creates supreme eccentric tension on the entire abdominal wall while bulletproofing the spine.',
    overviewAr: 'أقوى تمرين على الإطلاق لبناء جدار بطن صلب ومقاوم للتقوس، ويوفر تحفيزاً وتوتراً سلبياً لا يضاهى لكامل عضلات الكور.',
    steps: [
      'Kneel on a padded mat with the ab wheel on the floor directly beneath your shoulders.',
      'Round your upper back slightly (hollow body posture), squeeze your glutes, and tuck your pelvis underneath.',
      'Slowly roll the wheel forward in a straight line, extending your body as far as you can while maintaining the posterior pelvic tilt.',
      'Stop before your lower back sags or arches; maintain rigid core tension at full reach.',
      'Pull the wheel back toward your knees by contracting your abs and lats forcefully, exhaling fully.'
    ],
    stepsAr: [
      'اجثُ على ركبتيك فوق وسادة مريحة، وضع عجلة البطن على الأرض تحت كتفيك مباشرة.',
      'خذ وضعية التجويف (Hollow Body) بتقويس طفيف لأعلى الظهر وشد المؤخرة وتدوير الحوض للداخل لحماية القطنية.',
      'تدحرج بالعجلة للأمام ببطء وتحكم في خط مستقيم ممتداً بقدر استطاعتك مع الحفاظ على شد البطن الكامل.',
      'توقف قبل أن يتقوس أسفل ظهرك لأسفل؛ حافظ على بطنك مشدودة كلوح صلب في أقصى نقطة تمدد.',
      'اسحب العجلة للخلف باتجاه ركبتيك عن طريق عصر عضلات البطن والمجنص بقوة مع إخراج الزفير كاملاً.'
    ],
    commonMistakes: [
      'Letting the lower back sag and hyper-extend into anterior tilt, causing lumbar spine strain.',
      'Sitting back with the hips first on the return instead of pulling with the abdominals.',
      'Rolling out too far beyond current abdominal strength.'
    ],
    commonMistakesAr: [
      'هبوط وتقوس أسفل الظهر للأسفل مما يسبب ألماً وإجهاداً لفقرات القطنية.',
      'إرجاع المؤخرة للخلف أولاً عند العودة بدلاً من سحب العجلة بعصر البطن.',
      'التمدد لمسافة أبعد من قدرة عضلات بطنك على التحكم.'
    ],
    breathingTip: 'Inhale as you roll out forward; exhale aggressively and contract your abs as you pull the wheel back.',
    breathingTipAr: 'خذ شهيقاً عميقاً أثناء التدحرج للأمام؛ وأخرج زفيراً قوياً وأنت تعصر بطنك لسحب العجلة للخلف.',
    proTip: 'Start by rolling out against a wall to act as a safety bumper while progressively building depth and strength.',
    proTipAr: 'في البداية، تدحرج نحو جدار ليكون بمثابة مصد أمان يحدد مدى حركتك حتى تكتسب القوة الكافية للنزول الكامل.',
    videoUrl: 'https://www.youtube.com/shorts/MinlHnG7j4k',
    youtubeSearchQuery: 'Ab Wheel Rollout Proper Form Short'
  },

  'crunches': {
    id: 'crunches',
    name: 'Crunches',
    nameAr: 'طحن البطن الأرضي (كرانشز)',
    targetMuscle: 'Abs',
    targetMuscleAr: 'عضلات البطن العلوية (Upper Rectus Abdominis)',
    targetMuscleId: 'abs',
    secondaryMuscles: ['Obliques', 'Transverse Abdominis'],
    secondaryMusclesAr: ['الخواصر', 'البطن العميقة'],
    secondaryMuscleIds: ['abs'],
    motionPattern: 'core',
    activationScore: 89,
    angleCues: [
      { label: 'Spinal Flexion', labelAr: 'ثني العمود الفقري', value: '30°-45° Curl Only' },
      { label: 'Lower Back', labelAr: 'التصاق القطنية', value: 'Glued Flat to Floor' },
      { label: 'Full Exhale', labelAr: 'تفريغ الهواء', value: 'Empty Lungs on Peak' }
    ],
    equipment: 'Exercise Mat / Bodyweight',
    equipmentAr: 'سجادة تمارين (وزن الجسم)',
    difficulty: 'Beginner',
    difficultyAr: 'مبتدئ',
    overview: 'The quintessential abdominal movement that isolates the upper rectus abdominis through controlled spinal flexion without stressing the hip flexors.',
    overviewAr: 'تمرين البطن الكلاسيكي الأساسي لعزل وتحديد عضلات البطن العلوية من خلال ثني العمود الفقري بدقة دون إجهاد مفصل الفخذ.',
    steps: [
      'Lie flat on your back on a mat, knees bent at 90 degrees with feet flat on the floor hip-width apart.',
      'Place your fingertips lightly beside your ears or crossed across your chest; never pull on your neck.',
      'Press your lower back firmly down into the floor to eliminate any lumbar gap.',
      'Exhale and curl your shoulders and upper back off the floor roughly 30-45 degrees, driving your ribs down toward your hip bones.',
      'Hold and squeeze your abs at the apex for 1 second, then lower slowly until your shoulder blades touch the floor.'
    ],
    stepsAr: [
      'استلقِ على ظهرك فوق سجادة التدريب، واثنِ ركبتيك بزاوية 90 درجة مع تثبيت قدميك على الأرض بعرض الحوض.',
      'ضع أطراف أصابعك برفق بجانب أذنيك أو اعقد ذراعيك فوق صدرك؛ إياك وسحب رأسك أو رقبتك بيديك أبداً.',
      'الصق أسفل ظهرك بإحكام في الأرض وتأكد من عدم وجود فراغ تحت قطنيتك.',
      'أخرج الزفير وارفع كتفيك وأعلى ظهرك عن الأرض بمقدار 30 إلى 45 درجة مع تقريب قفصك الصدري من عظام حوضك.',
      'اثبت في القمة واعصر بطنك لثانية واحدة، ثم انزل ببطء حتى تلامس لوحات كتفيك الأرض دون إراحة رقبتك.'
    ],
    commonMistakes: [
      'Pulling on the neck with hands, creating severe cervical spine strain.',
      'Sitting all the way up into a sit-up, engaging the hip flexors and disengaging the abs.',
      'Arching the lower back off the floor during the movement.'
    ],
    commonMistakesAr: [
      'شد الرقبة بالأيدي للأمام بقوة مما يسبب إجهاداً خطيراً لفقرات العنق.',
      'الصعود الكامل كحركة السيت آب مما ينقل الحمل لعضلات الحوض ويضيع تفعيل البطن.',
      'رفع أسفل الظهر عن الأرض أثناء الأداء.'
    ],
    breathingTip: 'Exhale all air out as you crunch up to achieve a deeper abdominal contraction; inhale as you lower.',
    breathingTipAr: 'أخرج كل الهواء بزفير كامل عند الصعود للأعلى لتحقيق أقصى انقباض في عضلات البطن؛ وخذ شهيقاً أثناء النزول.',
    proTip: 'Imagine holding an apple between your chin and chest to ensure your neck stays neutral and your abs do the work.',
    proTipAr: 'تخيل أنك تضع تفاحة بين ذقنك وأعلى صدرك لمنع ثني الرقبة وضمان أن البطن هي من ترفع جسمك.',
    videoUrl: 'https://www.youtube.com/shorts/_BvTPMHfRQA',
    youtubeSearchQuery: 'Crunches Proper Form Short'
  },

  // ==================== CARDIO ====================
  'treadmill': {
    id: 'treadmill',
    name: 'Treadmill (Incline Walk / Run)',
    nameAr: 'جهاز السير الكهربائي (مشي مائل / جري)',
    targetMuscle: 'Cardio',
    targetMuscleAr: 'القلب واللياقة وحرق الدهون (Cardiovascular)',
    secondaryMuscles: ['Calves', 'Hamstrings'],
    secondaryMusclesAr: ['السمانة', 'الفخذ الخلفي'],
    equipment: 'Motorized Treadmill',
    equipmentAr: 'جهاز السير الكهربائي',
    difficulty: 'Beginner',
    difficultyAr: 'مبتدئ',
    overview: 'High-calorie burning aerobic conditioning. Incline walking preserves muscle mass while maximizing fat oxidation.',
    overviewAr: 'تمرين كارديو عالي الفعالية لتقوية عضلة القلب، والمشي على منحدر مائل يحافظ على الكتلة العضلية ويزيد حرق الدهون.',
    steps: [
      'Step onto side rails, select speed and incline (e.g. 10-12% incline at 4-5 km/h for low impact fat burning).',
      'Keep your posture tall, shoulders back, and look straight ahead.',
      'Pump arms naturally at your sides; avoid holding onto handles as this reduces calorie burn by up to 25%.',
      'Land softly on midfoot and push off with toes.'
    ],
    stepsAr: [
      'قف على جانبي السير أولاً، واضبط السرعة والميلان (مثال: انحدار 10-12% وسرعة 4-5 كم/س للمشي المائل لحرق الدهون).',
      'حافظ على استقامة ظهرك وكتفيك للخلف والنظر للأمام.',
      'حرك ذراعيك بشكل طبيعي بجانبك؛ تجنب الإمساك بالمقابض لأن ذلك يقلل حرق السعرات بنسبة 25%.',
      'اهبط بنعومة على منتصف قدمك وادفع بأصابعك.'
    ],
    commonMistakes: [
      'Holding onto the display handles tightly during incline walking.',
      'Looking down at feet or phone, straining neck muscles.',
      'Over-striding and stomping on heels.'
    ],
    commonMistakesAr: [
      'التمسك الشديد بالمقابض أثناء المشي المائل مما يقلل المجهود الفعلي.',
      'النظر لأسفل أو للهاتف باستمرار مما يجهد فقرات الرقبة.',
      'أخذ خطوات واسعة بشكل مبالغ فيه والهبوط القاسي على الكعبين.'
    ],
    breathingTip: 'Breathe rhythmically in sync with your foot strikes (e.g., 2 steps inhale, 2 steps exhale).',
    breathingTipAr: 'تنفس بنمط إيقاعي منتظم متناسق مع خطواتك (شهيق لخطوتين وزفير لخطوتين).',
    proTip: '12-3-30 (12% incline, 3 mph / 4.8 km/h, 30 mins) is the gold-standard low impact fat-burning routine.',
    proTipAr: 'بروتوكول 12-3-30 (انحدار 12%، سرعة 4.8 كم/س، لمدة 30 دقيقة) هو الأفضل عالمياً لحرق الدهون دون إجهاد المفاصل.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/9L2b2khySLE',
    youtubeSearchQuery: 'Treadmill Incline Walk Proper Form Short'
  }
};

/**
 * Intelligent exercise lookup with alias matching and dynamic generator for custom exercises
 */
export function getExerciseTutorial(exerciseName: string, fallbackMuscle: string = 'Chest'): ExerciseTutorial {
  if (!exerciseName) {
    return generateDynamicTutorial('General Exercise', fallbackMuscle);
  }

  const clean = exerciseName.trim().toLowerCase();

  // Direct ID check
  const slug = clean.replace(/[^a-z0-9]+/g, '-');
  if (EXERCISE_DATABASE[slug]) {
    return EXERCISE_DATABASE[slug];
  }

  // Alias & keyword matching
  for (const key of Object.keys(EXERCISE_DATABASE)) {
    const item = EXERCISE_DATABASE[key];
    const itemNameLower = item.name.toLowerCase();
    const itemNameAr = item.nameAr.toLowerCase();

    if (itemNameLower === clean || itemNameAr === clean) return item;
  }

  // Common aliases
  // Bench Press
  if (clean.includes('bench press') || clean.includes('flat bench') || clean.includes('بنش مستوي') || clean.includes('ضغط صدر')) {
    if (clean.includes('incline') || clean.includes('مائل')) return EXERCISE_DATABASE['incline-dumbbell-press'];
    if (clean.includes('machine') || clean.includes('جهاز')) return EXERCISE_DATABASE['seated-machine-chest-press'];
    return EXERCISE_DATABASE['barbell-bench-press'];
  }

  // Incline Press
  if (clean.includes('incline') || clean.includes('مائل')) {
    return EXERCISE_DATABASE['incline-dumbbell-press'];
  }

  // Cable Fly / Crossover
  if (clean.includes('cable fly') || clean.includes('chest fly') || clean.includes('crossover') || clean.includes('تفتيح') || clean.includes('فلاي') || clean.includes('كيبل فلاي')) {
    return EXERCISE_DATABASE['chest-cable-fly'] || EXERCISE_DATABASE['high-to-low-cable-crossover'];
  }

  // Push-ups
  if (clean.includes('push up') || clean.includes('push-up') || clean.includes('pushup') || clean.includes('تمرين الضغط') || clean.includes('بوش اب') || clean.includes('بوش-اب')) {
    return EXERCISE_DATABASE['push-ups'];
  }

  // Dips
  if (clean.includes('dip') || clean.includes('متوازي') || clean.includes('ديبس') || clean.includes('دبس')) {
    return EXERCISE_DATABASE['chest-dips'] || EXERCISE_DATABASE['dips'];
  }

  if (clean.includes('pulldown') || clean.includes('lat pull')) {
    return EXERCISE_DATABASE['lat-pulldown'];
  }

  if (clean.includes('barbell row') || clean.includes('bent over row')) {
    return EXERCISE_DATABASE['barbell-row'];
  }

  if (clean.includes('cable row') || clean.includes('seated row')) {
    return EXERCISE_DATABASE['seated-cable-row'];
  }

  if (clean.includes('leg extension') || clean.includes('تمديد') || clean.includes('اكستنشن')) {
    return EXERCISE_DATABASE['leg-extension'];
  }

  if (clean.includes('leg press') || clean.includes('ليج برس') || clean.includes('مكبس')) {
    return EXERCISE_DATABASE['leg-press'];
  }

  if (clean.includes('squat')) {
    return EXERCISE_DATABASE['barbell-back-squat'];
  }

  if (clean.includes('deadlift') || clean.includes('rdl') || clean.includes('romanian')) {
    return EXERCISE_DATABASE['romanian-deadlift'];
  }

  if (clean.includes('overhead press') || clean.includes('military') || clean.includes('shoulder press')) {
    return EXERCISE_DATABASE['overhead-press'];
  }

  if (clean.includes('lateral raise') || clean.includes('side raise') || clean.includes('dumbbell lateral')) {
    return EXERCISE_DATABASE['cable-lateral-raise'];
  }

  if (clean.includes('face pull') || clean.includes('فيس بول') || clean.includes('سحب للوجه')) {
    return EXERCISE_DATABASE['face-pull'];
  }

  if (clean.includes('front raise') || clean.includes('front dumbbell') || clean.includes('فرونت ريز') || clean.includes('رفع للأمام')) {
    return EXERCISE_DATABASE['front-dumbbell-raise'];
  }

  if (clean.includes('reverse pec') || clean.includes('reverse fly') || clean.includes('pec deck') || clean.includes('ريفيرس') || clean.includes('كتف خلفي')) {
    return EXERCISE_DATABASE['reverse-pec-deck'];
  }

  if (clean.includes('bicep') || clean.includes('curl')) {
    return EXERCISE_DATABASE['bicep-curls'];
  }

  if (clean.includes('tricep') || clean.includes('pushdown')) {
    return EXERCISE_DATABASE['tricep-pushdown'];
  }

  if (clean.includes('hanging leg') || clean.includes('leg raise') || clean.includes('رفع أرجل') || clean.includes('رفع الأرجل')) {
    return EXERCISE_DATABASE['hanging-leg-raise'];
  }

  if (clean.includes('woodchopper') || clean.includes('wood chop') || clean.includes('وودشوبر') || clean.includes('تقطيع الخشب')) {
    return EXERCISE_DATABASE['cable-woodchopper'];
  }

  if (clean.includes('ab wheel') || clean.includes('rollout') || clean.includes('عجلة البطن') || clean.includes('رول اوت')) {
    return EXERCISE_DATABASE['ab-wheel-rollout'];
  }

  if (clean.includes('crunch') || clean.includes('كرانش') || clean.includes('طحن')) {
    if (clean.includes('cable') || clean.includes('كيبل')) return EXERCISE_DATABASE['kneeling-cable-crunch'];
    return EXERCISE_DATABASE['crunches'];
  }

  if (clean.includes('abs') || clean.includes('core')) {
    return EXERCISE_DATABASE['kneeling-cable-crunch'];
  }

  if (clean.includes('treadmill') || clean.includes('cardio') || clean.includes('running') || clean.includes('walk')) {
    return EXERCISE_DATABASE['treadmill'];
  }

  // Generate dynamic tutorial if unlisted custom exercise
  return generateDynamicTutorial(exerciseName, fallbackMuscle);
}

function generateDynamicTutorial(name: string, targetMuscle: string): ExerciseTutorial {
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: name,
    nameAr: name,
    targetMuscle: targetMuscle || 'General',
    targetMuscleAr: targetMuscle || 'عضلة رئيسية',
    secondaryMuscles: ['Stabilizers'],
    secondaryMusclesAr: ['عضلات التثبيت'],
    equipment: 'Gym Equipment',
    equipmentAr: 'أجهزة أو أوزان الصالة الرياضية',
    difficulty: 'Intermediate',
    difficultyAr: 'متوسط',
    overview: `A dedicated movement targeting the ${targetMuscle || 'body'} for strength, hypertrophy, and muscular endurance.`,
    overviewAr: `تمرين مخصص لاستهداف عضلات ${targetMuscle || 'الجسم'} لبناء القوة والكتلة العضلية وتحسين التناسق البدني.`,
    steps: [
      'Set up with proper posture, engaging your core and stabilizing your spine.',
      'Control the eccentric (negative) phase of the movement for 2-3 seconds.',
      'Reach the full comfortable range of motion without sacrificing joint alignment.',
      'Drive with the target muscles through the concentric phase without using momentum.'
    ],
    stepsAr: [
      'اضبط وضعية البداية باستقامة العمود الفقري وشد عضلات البطن والجذع جيداً.',
      'تحكم بمرحلة النزول أو التمدد السلبي ببطء (2 إلى 3 ثوانٍ) للحفاظ على التوتر العضلي.',
      'احرص على أداء المدى الحركي الكامل المريح لمفاصلك دون مبالغة تسبب إصابة.',
      'ادفع أو اسحب بالاعتماد الصافي على العضلة المستهدفة وتجنب النتر أو الأرجحة.'
    ],
    commonMistakes: [
      'Using excessive weight that compromises execution technique.',
      'Rushing through reps and neglecting the eccentric stretch.'
    ],
    commonMistakesAr: [
      'استخدام أوزان ثقيلة تضر بالتكنيك السليم وتسبب أرجحة غير محسوبة.',
      'التسرع في أداء التكرارات وإهمال مرحلة التحكم بالوزن أثناء النزول.'
    ],
    breathingTip: 'Inhale during the preparation / eccentric stretch phase; exhale during the active exertion push or pull.',
    breathingTipAr: 'شهيق أثناء تمدد العضلة والنزول؛ وزفير أثناء الدفع أو السحب وبذل القوة.',
    proTip: 'Focus on the mind-muscle connection by visualizing the muscle contracting on every single repetition.',
    proTipAr: 'ركز على الاتصال العصبي العضلي وتخيل العضلة المستهدفة تنقبض وتنبسط في كل تكرار.',
    youtubeSearchQuery: `${name} proper form tutorial short`
  };
}

export function getExerciseBiomechanics(tutorial: ExerciseTutorial): BiomechanicalProfile {
  const clean = (tutorial.id + ' ' + tutorial.name + ' ' + tutorial.targetMuscle).toLowerCase();
  
  if (tutorial.motionPattern && tutorial.targetMuscleId) {
    return {
      pattern: tutorial.motionPattern,
      primaryMuscle: tutorial.targetMuscleId,
      secondaryMuscles: tutorial.secondaryMuscleIds || [],
      activationScore: tutorial.activationScore || 92,
      tempo: '3-1-1-0',
      tempoAr: '3 ثوانِ نزول - 1 ثانية ثبات - 1 ثانية دفع',
      cues: tutorial.angleCues || [
        { label: 'Form Control', labelAr: 'التحكم بالمسار', value: '100% Controlled' }
      ]
    };
  }

  // Incline Press
  if (clean.includes('incline') && (clean.includes('press') || clean.includes('chest') || clean.includes('dumbbell'))) {
    return {
      pattern: 'incline_press',
      primaryMuscle: 'chest',
      secondaryMuscles: ['shoulders', 'triceps'],
      activationScore: 94,
      tempo: '3-1-1-0',
      tempoAr: '3 ثوانِ نزول - 1 ثانية تمدد - 1 ثانية دفع وعصر',
      cues: [
        { label: 'Bench Angle', labelAr: 'زاوية المقعد', value: '30° Ideal' },
        { label: 'Elbow Flare', labelAr: 'زاوية الكوعين', value: '45°-60°' },
        { label: 'Peak Contraction', labelAr: 'الانقباض العضلي', value: 'Upper Clavicular Pectoralis' }
      ]
    };
  }

  // Bench Press / Flat Press / Pushups / Dips / Cable Fly
  if (clean.includes('bench press') || clean.includes('push-up') || clean.includes('pushup') || clean.includes('dip') || clean.includes('chest') || clean.includes('fly')) {
    return {
      pattern: 'bench_press',
      primaryMuscle: 'chest',
      secondaryMuscles: ['triceps', 'shoulders'],
      activationScore: 95,
      tempo: '3-1-1-0',
      tempoAr: '3 ثوانِ نزول تحكم - 1 ثانية ملامسة - 1 ثانية دفع انفجاري',
      cues: [
        { label: 'Elbow Tuck', labelAr: 'ثني الكوعين للداخل', value: '45°-70°' },
        { label: 'Scapula', labelAr: 'لوح الكتف', value: 'Retracted & Depressed' },
        { label: 'Bar Path', labelAr: 'مسار البار', value: 'J-Curve / Vertical' }
      ]
    };
  }

  // Squat & Leg Press
  if (clean.includes('squat') || clean.includes('leg press') || clean.includes('hack')) {
    return {
      pattern: 'squat',
      primaryMuscle: 'quads',
      secondaryMuscles: ['glutes', 'hamstrings', 'calves'],
      activationScore: 96,
      tempo: '3-1-1-0',
      tempoAr: '3 ثوانِ نزول عميق - 1 ثانية ثبات - 1 ثانية صعود قوي',
      cues: [
        { label: 'Squat Depth', labelAr: 'عمق النزول', value: 'Parallel or Below 90°' },
        { label: 'Knee Tracking', labelAr: 'مسار الركبتين', value: 'Over 2nd & 3rd Toes' },
        { label: 'Torso Angle', labelAr: 'استقامة الجذع', value: 'Rigid Neutral Spine' }
      ]
    };
  }

  // Deadlift & Hinge (RDL, Good Morning)
  if (clean.includes('deadlift') || clean.includes('rdl') || clean.includes('romanian') || clean.includes('hinge') || clean.includes('good morning')) {
    return {
      pattern: 'deadlift',
      primaryMuscle: 'hamstrings',
      secondaryMuscles: ['glutes', 'lowerBack', 'traps'],
      activationScore: 95,
      tempo: '3-1-1-0',
      tempoAr: '3 ثوانِ إرجاع الحوض - ثانية أقصى تمدد - ثانية دفع بالحوض',
      cues: [
        { label: 'Hip Hinge', labelAr: 'مفصل الورك', value: 'Hips Pushed Backward' },
        { label: 'Spine Safety', labelAr: 'العمود الفقري', value: 'Neutral / No Rounding' },
        { label: 'Bar Proximity', labelAr: 'قرب البار', value: 'Skimming Shins & Thighs' }
      ]
    };
  }

  // Overhead Press (Military, Shoulder Press, Arnold)
  if (clean.includes('overhead') || clean.includes('military') || clean.includes('shoulder press') || clean.includes('arnold')) {
    return {
      pattern: 'overhead_press',
      primaryMuscle: 'shoulders',
      secondaryMuscles: ['triceps', 'traps'],
      activationScore: 93,
      tempo: '2-1-1-0',
      tempoAr: '2 ثانية نزول لتحت الذقن - 1 ثانية دفع رأسي للأعلى',
      cues: [
        { label: 'Forearms', labelAr: 'الساعدان', value: 'Vertical to the Floor' },
        { label: 'Head Clearance', labelAr: 'حركة الرأس', value: 'Tuck Chin & Push Through' },
        { label: 'Glute Lock', labelAr: 'شد الحوض والجذع', value: 'Prevents Lower Back Arch' }
      ]
    };
  }

  // Lateral Raise & Deltoid Flyes
  if (clean.includes('lateral') || clean.includes('side raise') || clean.includes('face pull') || clean.includes('rear delt')) {
    return {
      pattern: 'lateral_raise',
      primaryMuscle: 'shoulders',
      secondaryMuscles: ['traps'],
      activationScore: 91,
      tempo: '2-1-1-1',
      tempoAr: '2 ثانية نزول - 1 ثانية رفع لمستوى الكتف - 1 ثانية عصر في القمة',
      cues: [
        { label: 'Plane of Motion', labelAr: 'مستوى الرفع', value: 'Scapular Plane (30° Forward)' },
        { label: 'Elbow Angle', labelAr: 'انحناء الكوع', value: 'Slight 10°-15° Soft Bend' },
        { label: 'Height Limit', labelAr: 'أقصى ارتفاع', value: 'Shoulder Level / No Trap Shrug' }
      ]
    };
  }

  // Vertical Pull (Lat Pulldown, Pull-up)
  if (clean.includes('pulldown') || clean.includes('pull-up') || clean.includes('chin-up') || clean.includes('lat pull')) {
    return {
      pattern: 'pull_down',
      primaryMuscle: 'lats',
      secondaryMuscles: ['biceps', 'traps'],
      activationScore: 94,
      tempo: '3-0-1-1',
      tempoAr: '3 ثوانِ صعود وتمدد - 1 ثانية سحب للصدر - 1 ثانية عصر للمجنص',
      cues: [
        { label: 'Scapular Pull', labelAr: 'حركة لوحي الكتف', value: 'Depress & Squeeze Down' },
        { label: 'Elbow Direction', labelAr: 'اتجاه الكوعين', value: 'Drive Straight Down to Ribs' },
        { label: 'Chest Angle', labelAr: 'زاوية الصدر', value: 'Chest Puffed Up to Bar' }
      ]
    };
  }

  // Horizontal Row (Barbell Row, Cable Row, T-Bar)
  if (clean.includes('row')) {
    return {
      pattern: 'row',
      primaryMuscle: 'lats',
      secondaryMuscles: ['biceps', 'traps', 'lowerBack'],
      activationScore: 93,
      tempo: '3-1-1-1',
      tempoAr: '3 ثوانِ مد الذراعين - 1 ثانية سحب للبطن - 1 ثانية عصر الظهر',
      cues: [
        { label: 'Torso Angle', labelAr: 'زاوية الجذع', value: '45° Consistent Angle' },
        { label: 'Pull Point', labelAr: 'نقطة السحب', value: 'Towards Lower Navel' },
        { label: 'Shoulder Pinch', labelAr: 'عصر لوحي الكتف', value: 'Pinch Together at Top' }
      ]
    };
  }

  // Biceps (Barbell Curl, Dumbbell Curl, Hammer, Preacher)
  if (clean.includes('bicep') || clean.includes('curl') && !clean.includes('leg')) {
    return {
      pattern: 'bicep_curl',
      primaryMuscle: 'biceps',
      secondaryMuscles: ['shoulders'],
      activationScore: 92,
      tempo: '3-1-1-1',
      tempoAr: '3 ثوانِ نزول بتحكم - ثانية استطالة - ثانية صني وعصر في القمة',
      cues: [
        { label: 'Elbow Anchor', labelAr: 'تثبيت الكوع', value: 'Pinned to Ribcage / No Swing' },
        { label: 'Range of Motion', labelAr: 'المدى الحركي', value: 'Full Extension to Peak Flex' },
        { label: 'Wrist Position', labelAr: 'معصم اليد', value: 'Neutral / Supinated' }
      ]
    };
  }

  // Triceps (Pushdown, Skull Crusher, Overhead Tricep, Dips)
  if (clean.includes('tricep') || clean.includes('pushdown') || clean.includes('skull crusher') || clean.includes('dip')) {
    return {
      pattern: 'tricep_extension',
      primaryMuscle: 'triceps',
      secondaryMuscles: ['shoulders', 'chest'],
      activationScore: 93,
      tempo: '3-1-1-1',
      tempoAr: '3 ثوانِ صعود - ثانية تمدد - ثانية فرد كامل وعصر',
      cues: [
        { label: 'Elbow Stability', labelAr: 'ثبات الكوعين', value: 'Zero Flaring / Locked in Place' },
        { label: 'Full Lockout', labelAr: 'الإغلاق في الأسفل', value: 'Complete Triceps Squeeze' },
        { label: 'Shoulder Control', labelAr: 'عزل الكتف', value: 'Pure Elbow Extension' }
      ]
    };
  }

  // Leg Extension
  if (clean.includes('leg extension')) {
    return {
      pattern: 'leg_extension',
      primaryMuscle: 'quads',
      secondaryMuscles: [],
      activationScore: 91,
      tempo: '3-1-1-1',
      tempoAr: '3 ثوانِ نزول - 1 ثانية تمدد - 1 ثانية عصر للكوادسيبس',
      cues: [
        { label: 'Knee Pivot', labelAr: 'محور الركبة', value: 'Aligned with Machine Axis' },
        { label: 'Peak Hold', labelAr: 'ثبات في القمة', value: '1s Squeeze at Full Extension' },
        { label: 'Back Pad', labelAr: 'إسناد الظهر', value: 'Hips Pinned into Seat' }
      ]
    };
  }

  // Leg Curl
  if (clean.includes('leg curl') || clean.includes('hamstring')) {
    return {
      pattern: 'leg_curl',
      primaryMuscle: 'hamstrings',
      secondaryMuscles: ['calves'],
      activationScore: 92,
      tempo: '3-1-1-1',
      tempoAr: '3 ثوانِ فرد - 1 ثانية استطالة - 1 ثانية سحب وعصر',
      cues: [
        { label: 'Hip Contact', labelAr: 'تثبيت الحوض', value: 'Keep Hips Pressed to Pad' },
        { label: 'Full Flexion', labelAr: 'ثني الركبة', value: 'Curl Heel to Glute' },
        { label: 'Control Descent', labelAr: 'التحكم بالنزول', value: 'Resist the Stack Down' }
      ]
    };
  }

  // Calf Raise
  if (clean.includes('calf') || clean.includes('calves')) {
    return {
      pattern: 'calf_raise',
      primaryMuscle: 'calves',
      secondaryMuscles: [],
      activationScore: 90,
      tempo: '2-2-1-1',
      tempoAr: '2 ثانية نزول - 2 ثانية تمدد كامل - ثانية رفع لأعلى نقطة',
      cues: [
        { label: 'Deep Stretch', labelAr: 'أقصى نزول وتمدد', value: 'Heels Below Step' },
        { label: 'Big Toe Drive', labelAr: 'الدفع بإصبع القدم', value: 'Drive Through First Metatarsal' },
        { label: 'Pause at Top', labelAr: 'ثبات في القمة', value: 'Lock High on Toes' }
      ]
    };
  }

  // Core & Abs
  if (clean.includes('crunch') || clean.includes('abs') || clean.includes('plank') || clean.includes('core')) {
    return {
      pattern: 'core',
      primaryMuscle: 'abs',
      secondaryMuscles: ['lowerBack'],
      activationScore: 92,
      tempo: '2-1-1-1',
      tempoAr: '2 ثانية تمدد - 1 ثانية طحن وعصر للبطن مع زفير كامل',
      cues: [
        { label: 'Pelvic Tilt', labelAr: 'دوران الحوض', value: 'Posterior Pelvic Tilt' },
        { label: 'Exhale Squeeze', labelAr: 'الزفير التام', value: 'Empty All Air at Contraction' },
        { label: 'Neck Relief', labelAr: 'راحة الرقبة', value: 'No Pulling on Head/Neck' }
      ]
    };
  }

  // Cardio
  if (clean.includes('treadmill') || clean.includes('cardio') || clean.includes('running') || clean.includes('bike') || clean.includes('elliptical')) {
    return {
      pattern: 'cardio',
      primaryMuscle: 'quads',
      secondaryMuscles: ['calves', 'hamstrings'],
      activationScore: 82,
      tempo: 'Rhythmic',
      tempoAr: 'إيقاع تنفس متواصل وخطوات متناسقة',
      cues: [
        { label: 'Cadence', labelAr: 'إيقاع الخطوات', value: 'Consistent Cadence' },
        { label: 'Upright Posture', labelAr: 'استقامة الجذع', value: 'Open Chest & Forward Gaze' }
      ]
    };
  }

  // Default fallback based on target muscle
  const muscle = (tutorial.targetMuscle || '').toLowerCase();
  let defaultPattern: MotionPatternType = 'bench_press';
  let defaultPrimary: MuscleGroupKey = 'chest';
  let defaultSecondary: MuscleGroupKey[] = ['triceps'];

  if (muscle.includes('back') || muscle.includes('lat')) {
    defaultPattern = 'row';
    defaultPrimary = 'lats';
    defaultSecondary = ['biceps', 'traps'];
  } else if (muscle.includes('shoulder') || muscle.includes('delt')) {
    defaultPattern = 'overhead_press';
    defaultPrimary = 'shoulders';
    defaultSecondary = ['triceps'];
  } else if (muscle.includes('leg') || muscle.includes('quad')) {
    defaultPattern = 'squat';
    defaultPrimary = 'quads';
    defaultSecondary = ['glutes', 'hamstrings'];
  } else if (muscle.includes('hamstring')) {
    defaultPattern = 'deadlift';
    defaultPrimary = 'hamstrings';
    defaultSecondary = ['glutes', 'lowerBack'];
  } else if (muscle.includes('bicep')) {
    defaultPattern = 'bicep_curl';
    defaultPrimary = 'biceps';
    defaultSecondary = ['shoulders'];
  } else if (muscle.includes('tricep')) {
    defaultPattern = 'tricep_extension';
    defaultPrimary = 'triceps';
    defaultSecondary = ['shoulders'];
  } else if (muscle.includes('core') || muscle.includes('abs')) {
    defaultPattern = 'core';
    defaultPrimary = 'abs';
    defaultSecondary = ['lowerBack'];
  }

  return {
    pattern: defaultPattern,
    primaryMuscle: defaultPrimary,
    secondaryMuscles: defaultSecondary,
    activationScore: 90,
    tempo: '3-1-1-0',
    tempoAr: '3 ثوانِ نزول وتحكم - ثانية تمدد - ثانية دفع وعصر',
    cues: [
      { label: 'Mind-Muscle', labelAr: 'التركيز العصبي', value: 'Full Intentional Contraction' },
      { label: 'Control', labelAr: 'التحكم بالوزن', value: 'Zero Momentum' }
    ]
  };
}
