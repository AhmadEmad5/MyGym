import type { SessionExercise } from '../../../lib/api';

export const TEMPLATE_NAMES = [
  'Push Workout',
  'Pull Workout',
  'Legs Workout',
  'Chest Workout',
  'Back Workout',
  'Shoulders Workout',
  'Biceps Workout',
  'Triceps Workout',
  'Forearms Workout',
  'Core Workout'
] as const;

export function buildTemplateExercises(templateName: string): SessionExercise[] {
  let exercises: SessionExercise[] = [];
    
    if (templateName === 'Push Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Barbell Bench Press', targetMuscle: 'Chest', restTime: 120, notes: 'Keep feet firmly planted and squeeze your shoulder blades together to create a solid base.', videoUrl: 'https://www.youtube-nocookie.com/embed/_FkbD0FhgVE', sets: [
          {id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Seated Dumbbell Press', targetMuscle: 'Shoulders', restTime: 90, notes: 'Keep your elbows tucked slightly forward (about 45 degrees) rather than flared straight out to protect your shoulders.', videoUrl: 'https://www.youtube.com/embed/NW_y9yEZq34', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Triceps Rope Pushdown', targetMuscle: 'Triceps', restTime: 60, notes: "Keep your elbows glued to your ribs. If they move forward and back, you're using your lats instead of triceps.", videoUrl: 'https://www.youtube.com/embed/u36jNfqh8_U', sets: [
          {id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    } else if (templateName === 'Pull Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Lat Pulldown', targetMuscle: 'Back', restTime: 90, notes: 'Think about pulling your elbows down to your back pockets rather than just pulling with your hands.', videoUrl: 'https://www.youtube.com/embed/5s6KGLTMgoI', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Bent-Over Barbell Row', targetMuscle: 'Back', restTime: 120, notes: 'Keep your core braced tightly. If you feel this in your lower back, lighten the weight to maintain proper form.', videoUrl: 'https://www.youtube.com/embed/phVtqawIgbk', sets: [
          {id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Alternating Dumbbell Curl', targetMuscle: 'Biceps', restTime: 60, notes: 'Control the eccentric (lowering) phase for a full 2 to 3 seconds to maximize muscle growth.', videoUrl: 'https://www.youtube.com/embed/MKWBV29S6c0', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    } else if (templateName === 'Legs Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Barbell Back Squat', targetMuscle: 'Legs', restTime: 150, notes: 'Focus on pushing your knees out over your toes to open up your hips and achieve better depth comfortably.', videoUrl: 'https://www.youtube.com/embed/iKCJCydYYrE', sets: [
          {id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Machine Leg Press', targetMuscle: 'Legs', restTime: 90, notes: 'Never lock out your knees fully at the top of the movement to maintain tension on the quads and protect the joints.', videoUrl: 'https://www.youtube.com/embed/EotSw18oR9w', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Romanian Deadlift', targetMuscle: 'Legs', restTime: 120, notes: 'Keep the bar dragging lightly against your legs the entire time to avoid unnecessary stress on your lower back.', videoUrl: 'https://www.youtube.com/embed/3VXmecChYYM', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    } else if (templateName === 'Biceps Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Machine Preacher Curl', targetMuscle: 'Biceps', restTime: 90, notes: 'هذا التمرين هو البديل المثالي للبار، حيث يعزل عضلة البايسيبس بالكامل ويمنعك من الأرجحة بفضل وسادة الارتكاز. يركز بشكل كبير على الرأس القصير (Short Head) لزيادة الكتلة الإجمالية للعضلة.\n\nنصيحة للأداء: ألصق إبطك جيداً بالوسادة ولا ترفع كوعك عن السطح أبداً أثناء سحب الوزن.', videoUrl: 'https://www.youtube.com/embed/S4dDLFp3e8w', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Behind-The-Back Cable Curl', targetMuscle: 'Biceps', restTime: 90, notes: 'هذا هو البديل الأفضل للدمبلز على المقعد المائل. نظراً لأن الكيبل يسحب ذراعك للخلف، فإنه يضع "الرأس الطويل" (Long Head) تحت أقصى درجات التمدد، وهو أمر أساسي لبناء وتكوير قمة البايسيبس (Bicep Peak).\n\nنصيحة للأداء: خذ خطوة للأمام بعيداً عن جهاز الكيبل، وحافظ على ثبات كوعك خلف مستوى جسمك طوال الحركة.', videoUrl: 'https://www.youtube.com/embed/unQKwAs4Svc', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Rope Cable Hammer Curl', targetMuscle: 'Biceps', restTime: 90, notes: 'بديل ممتاز لتمرين المطرقة بالدمبل، حيث يوفر الكيبل مقاومة ثابتة لا تضعف في أي نقطة من الرفعة. يستهدف العضلة العضدية (Brachialis) الموجودة أسفل البايسيبس لزيادة سمك وعرض الذراع بشكل عام.\n\nنصيحة للأداء: ثبت كوعيك بجانبك تماماً، واحرص على المباعدة بين طرفي الحبل قليلاً عند الوصول لأعلى نقطة لزيادة الانقباض.', videoUrl: 'https://www.youtube.com/embed/wGukDGOJYAs', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    } else if (templateName === 'Triceps Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Cable Rope Triceps Pushdown', targetMuscle: 'Triceps', restTime: 90, notes: 'يستهدف هذا التمرين الرأس الجانبي (Lateral Head) بشكل رئيسي، وهو الجزء الذي يعطي الذراع العرض والمظهر الجانبي البارز. استخدام الحبل يسمح بمدى حركي أطول مقارنة بالبار.\n\nنصيحة للأداء: ثبت كوعيك بإحكام بجانب خصرك. ادفع الحبل للأسفل وعند الوصول لأدنى نقطة، باعد بين طرفي الحبل للخارج لزيادة الانقباض.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Cable Rope Triceps Pushdown Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Overhead Cable Triceps Extension', targetMuscle: 'Triceps', restTime: 90, notes: 'هذا التمرين ضروري لاستهداف "الرأس الطويل" (Long Head)، والذي يشكل الجزء الأكبر من حجم الترايسيبس. رفع الذراع فوق مستوى الرأس يضع العضلة تحت أقصى درجات التمدد.\n\nنصيحة للأداء: استخدم الحبل واسحب الكيبل من الأسفل أو من مستوى الكتف. حافظ على ثبات كوعيك واتجاههما للأمام، وافرد ذراعيك بالكامل مع ثبات الجذع.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Overhead Cable Triceps Extension Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Triceps Dip Machine', targetMuscle: 'Triceps', restTime: 90, notes: 'هذا الجهاز هو البديل الآمن لتمرين الغطس الحر (Dips). يستهدف الرؤوس الثلاثة معاً لبناء كتلة عضلية شاملة، ويسمح لك برفع أوزان ثقيلة دون المخاطرة بأربطة الكتف.\n\nنصيحة للأداء: حافظ على استقامة ظهرك والتصاقه بالمسند. ادفع المقابض للأسفل باستخدام الترايسيبس وتجنب الميل بجذعك للأمام حتى لا ينتقل الضغط إلى عضلات الصدر، وتحكم بالوزن أثناء العودة للأعلى.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Triceps Dip Machine Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    } else if (templateName === 'Chest Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Seated Machine Chest Press', targetMuscle: 'Chest', restTime: 90, notes: 'يستهدف هذا التمرين منتصف الصدر لبناء الكتلة العضلية الإجمالية. يوفر الجهاز مساراً ثابتاً للحركة مما يجعله آمناً لرفع أوزان ثقيلة دون الحاجة لتوازن الأوزان الحرة.\n\nنصيحة للأداء: اسحب كتفيك للخلف وللأسفل (ضم لوحي الكتف) وألصق ظهرك بالمسند. ادفع الوزن باستخدام عضلات صدرك، ولا تفرد كوعيك (Lockout) بالكامل في نهاية الحركة للحفاظ على الضغط المستمر على العضلة.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Machine Chest Press Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Incline Machine Chest Press', targetMuscle: 'Chest', restTime: 90, notes: 'تمرين لا غنى عنه لتطوير الجزء العلوي من الصدر، وهو الجزء الذي يعطي الصدر مظهراً ممتلئاً وبارزاً من الأعلى (عند عظمة الترقوة).\n\nنصيحة للأداء: اضبط ارتفاع المقعد بحيث تكون المقابض في مستوى الجزء العلوي من صدرك. حافظ على صدرك مرفوعاً وظهرك مقوساً قليلاً بشكل طبيعي طوال الرفعة.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Incline Machine Chest Press Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'High-to-Low Cable Crossover', targetMuscle: 'Chest', restTime: 90, notes: 'هذا التمرين ممتاز لاستهداف الجزء السفلي من الصدر وإعطاء العضلة التحديد السفلي، بالإضافة إلى التركيز على الخط الداخلي. الكيبل يوفر مقاومة مستمرة من بداية التمدد حتى أقصى نقطة انقباض.\n\nنصيحة للأداء: قف في منتصف الجهاز وخذ خطوة صغيرة للأمام. اثن كوعيك قليلاً (كأنك تعانق شجرة ضخمة)، واسحب الكيابل للأسفل حتى تتلاقى يداك أمام حوضك، واعصر عضلة الصدر بقوة في هذه النقطة لتفعيل الجزء الداخلي.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن High to Low Cable Crossover Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    } else if (templateName === 'Core Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Kneeling Cable Crunch', targetMuscle: 'Core', restTime: 60, notes: 'يستهدف هذا التمرين عضلات البطن الأمامية (Rectus Abdominis - العضلات السداسية). الكيبل يوفر مقاومة ممتازة تجبر عضلات البطن على العمل بجهد لثني الجذع.\n\nنصيحة للأداء: امسك الحبل خلف رقبتك أو بجانب أذنيك. ثبت حوضك تماماً (لا تجلس على كعبيك أثناء النزول)، وتخيل أنك تحاول تقريب قفصك الصدري من حوضك باستخدام عضلات بطنك فقط، وليس بسحب الحبل بذراعيك.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Kneeling Cable Crunch Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Ab Crunch Machine', targetMuscle: 'Core', restTime: 60, notes: 'بديل ممتاز للكرنش الأرضي، يوفر عزلاً عالياً جداً لعضلات البطن بالكامل ويحمي أسفل الظهر بفضل مسند الجهاز.\n\nنصيحة للأداء: اضبط المقعد بحيث يكون محور دوران الجهاز موازياً لأسفل صدرك أو بطنك (حسب تصميم الجهاز). أخرج الزفير (تنفس للخارج) بالكامل عند عصر عضلات بطنك للأسفل للحصول على أقصى انقباض عضلي.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Ab Crunch Machine Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Cable Woodchopper', targetMuscle: 'Core', restTime: 60, notes: 'هذا التمرين هو الأفضل لاستهداف العضلات الجانبية للبطن (الخواصر - Obliques) وتقوية الجذع بشكل عام من خلال الحركة الدورانية.\n\nنصيحة للأداء: اضبط الكيبل في أعلى نقطة أو في مستوى الكتف. حافظ على استقامة ذراعيك تقريباً، وقم بالدوران باستخدام جذعك (خصرك) وليس فقط بتحريك ذراعيك أو كتفيك، وحافظ على ثبات قدميك وحوضك قدر الإمكان.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Cable Woodchopper Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    } else if (templateName === 'Back Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Wide-Grip Lat Pulldown', targetMuscle: 'Back', restTime: 90, notes: 'يستهدف هذا التمرين العضلة الظهرية العريضة (المجنص - Lats) بشكل أساسي، وهو المسؤول الأول عن إعطاء الظهر المظهر العريض (V-Shape).\n\nنصيحة للأداء: اسحب البار باتجاه أعلى صدرك مع إرجاع كتفيك للخلف وللأسفل، واحرص على عدم الميل بجذعك للخلف بشكل مبالغ فيه.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Wide Grip Lat Pulldown Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Seated Cable Row', targetMuscle: 'Back', restTime: 90, notes: 'يركز على عضلات منتصف الظهر (Rhomboids) وشبه المنحرف (Traps) بالإضافة للمجنص، مما يمنح الظهر سماكة وعمقاً عضلياً من الداخل.\n\nنصيحة للأداء: حافظ على استقامة أسفل ظهرك. عند سحب الوزن، تخيل أنك تحاول عصر قلم بين لوحي كتفك، واسمح لكتفيك بالتمدد للأمام عند العودة.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Seated Cable Row Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Chest-Supported Machine Row', targetMuscle: 'Back', restTime: 90, notes: 'يوفر هذا الجهاز عزلاً تاماً لعضلات الظهر العلوية والوسطى. مسند الصدر يمنعك من استخدام قوة الدفع (الأرجحة) ويزيل الضغط تماماً عن فقرات أسفل الظهر، مما يجعله آمناً وفعالاً لرفع أوزان ثقيلة.\n\nنصيحة للأداء: ألصق صدرك بالمسند طوال الحركة. اسحب المقابض للخلف مع إبقاء كوعيك قريبين من جسمك لاستهداف المجنص، أو افتح كوعيك قليلاً لاستهداف أعلى الظهر.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Chest Supported Row Machine Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Back Extension', targetMuscle: 'Back', restTime: 90, notes: 'تمرين أساسي لعزل وتقوية عضلات أسفل الظهر (Erector Spinae)، مما يحسن من استقامتك ويحميك من الإصابات.\n\nنصيحة للأداء: اضبط الوسادة لتكون أسفل حوضك مباشرة. انزل ببطء، ثم ارتفع للأعلى حتى يستقيم جسمك فقط (تجنب التقوس المفرط للخلف في أعلى نقطة).\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Back Extension Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    } else if (templateName === 'Forearms Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Cable Reverse Curl', targetMuscle: 'Forearms', restTime: 90, notes: 'يستهدف هذا التمرين العضلة العضدية الكعبرية (الجزء العلوي والجانبي من الساعد) بشكل أساسي، مما يعطي الساعد مظهراً عريضاً من الخارج.\n\nنصيحة للأداء: استخدم البار المستقيم أو المتعرج (EZ Bar) بالكيبل السفلي. امسك البار بقبضة علوية (راحة اليد تواجه الأرض)، وحافظ على ثبات كوعيك بجانبك أثناء سحب الوزن للأعلى.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Cable Reverse Curl Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Cable Wrist Curl', targetMuscle: 'Forearms', restTime: 90, notes: 'يركز هذا التمرين على عضلات الثني (الجزء الداخلي من الساعد)، وهو الجزء المسؤول عن إعطاء الساعد الكتلة العضلية الأكبر والحجم الدائري.\n\nنصيحة للأداء: اسحب مقعداً أمام جهاز الكيبل السفلي، وضع ساعديك على فخذيك أو على المقعد بحيث تتدلى معاصمك خارج الحافة. دع البار ينزل حتى أطراف أصابعك للحصول على أقصى تمدد، ثم اقبض معصمك للأعلى بقوة.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Seated Cable Wrist Curl Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Cable Reverse Wrist Curl', targetMuscle: 'Forearms', restTime: 90, notes: 'يستهدف عضلات التمديد (الجزء الخارجي والعلوي من الساعد). تقوية هذا الجزء ضرورية جداً لتوازن القوة في الذراع ومنع الإصابات أو آلام مفصل المعصم (مثل التهاب الأوتار).\n\nنصيحة للأداء: بنفس وضعية التمرين السابق، لكن اجعل راحة يدك تواجه الأرض. ارفع معصمك للأعلى باتجاه جسمك ببطء، وتحكم بالوزن أثناء النزول. لا تستخدم أوزاناً ثقيلة جداً هنا لتجنب إرهاق المفصل.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Cable Reverse Wrist Curl Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    } else if (templateName === 'Shoulders Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Machine Shoulder Press', targetMuscle: 'Shoulders', restTime: 90, notes: 'يستهدف هذا الجهاز الرأس الأمامي والجانبي بشكل أساسي لبناء الحجم الإجمالي للكتف. الجهاز يوفر ثباتاً عالياً مما يسمح لك برفع أوزان ثقيلة بأمان تام مقارنة بالدمبلز.\n\nنصيحة للأداء: لا تجعل كوعيك مفتوحين للخارج بزاوية 90 درجة؛ بل اجعلهما يميلان للأمام قليلاً (حوالي 45 درجة) لحماية مفصل الكتف من الإصابة.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Machine Shoulder Press Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Cable Lateral Raise', targetMuscle: 'Shoulders', restTime: 90, notes: 'هذا التمرين هو السر للحصول على أكتاف عريضة ومكورة (3D). الكيبل يتفوق على الدمبل هنا لأنه يحافظ على الشد العضلي (Tension) من بداية الحركة في الأسفل وحتى نهايتها.\n\nنصيحة للأداء: اجعل الكيبل يمر من خلف ظهرك أو من أمامك، وارفع ذراعك للجانب مع ميلان بسيط للأمام. تخيل أنك تدفع الوزن بعيداً عنك وليس فقط للأعلى.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Cable Lateral Raise Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Reverse Pec Deck Machine', targetMuscle: 'Shoulders', restTime: 90, notes: 'الكتف الخلفي غالباً ما يتم إهماله، وتقويته ضرورية جداً لاستقامة المظهر (Posture) واكتمال شكل الكتف. هذا الجهاز يعزل الكتف الخلفي بفعالية دون تدخل عضلات الظهر.\n\nنصيحة للأداء: اضبط المقعد بحيث تكون يداك في مستوى كتفيك. ادفع المقابض للخارج، وتجنب عصر لوحي كتفك للخلف بقوة لضمان بقاء الضغط على الكتف الخلفي وليس على عضلات الظهر.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Reverse Pec Deck Rear Delt Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    }

    return exercises;
}

export function ensureCardioWarmup(exercises: SessionExercise[]): SessionExercise[] {
  const hasCardio = exercises.some(exercise => {
    const muscle = (exercise.targetMuscle || '').toLowerCase();
    const name = (exercise.name || '').toLowerCase();
    return muscle === 'cardio' || name.includes('cardio') || name.includes('treadmill');
  });
  if (hasCardio || exercises.length === 0) return exercises;
  return [
    {
      id: `cardio-${Date.now().toString(36)}`,
      name: 'Treadmill Warm-up & Cardio (إحماء وكارديو جهاز المشي)',
      targetMuscle: 'Cardio',
      restTime: 60,
      notes: '5-10 minutes of aerobic warm-up to prepare joints and elevate core temperature.',
      duration: 10,
      sets: [{ id: 'cardio-s1', weight: 0, repsTarget: 10, repsActual: 10, unit: 'lb', isCompleted: false }]
    },
    ...exercises
  ];
}
