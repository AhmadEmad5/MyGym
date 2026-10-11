export interface ScreenFeatureItem {
  iconName: 'dumbbell' | 'calendar' | 'activity' | 'flame' | 'settings' | 'sparkles' | 'target' | 'camera' | 'scale' | 'zap' | 'shield';
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
}

export interface TourStep {
  id: string;
  route: string;
  targetSelector: string;
  screenBadgeEn: string;
  screenBadgeAr: string;
  screenNameEn: string;
  screenNameAr: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  features: ScreenFeatureItem[];
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  accentColor: string;
  onBeforeStep?: () => Promise<void> | void;
  onNextStep?: () => Promise<void> | void;
}

export const FORMA_SCREEN_TOUR_STEPS: TourStep[] = [
  {
    id: 'today-dashboard',
    route: '/today',
    targetSelector: '[data-tour="today-workout"], #today-command, .today-command-grid',
    screenBadgeEn: 'Screen 1 of 5',
    screenBadgeAr: 'الشاشة 1 من 5',
    screenNameEn: 'Today Command Center',
    screenNameAr: 'شاشة اليوم ومركز القيادة',
    titleEn: 'Today Dashboard & Command Center',
    titleAr: 'شاشة اليوم: مركز قيادتك التدريبية',
    descriptionEn: 'Your daily cockpit. Launch scheduled sessions, log weight & reps, and observe real-time physiological readiness.',
    descriptionAr: 'قمرة القيادة اليومية الخاصة بك. أطلق تمارينك المجدولة، وسجّل الأوزان والتكرارات، وراقب جاهزية عضلاتك في الوقت الفعلي.',
    accentColor: '#38bdf8',
    placement: 'bottom',
    features: [
      {
        iconName: 'dumbbell',
        titleEn: '1-Tap Workout Launch',
        titleAr: 'بدء فوري لتمرين اليوم',
        descEn: 'Launch planned workouts instantly with real-time timers and set logging.',
        descAr: 'ابدأ جلستك المجدولة بنقرة واحدة وسجّل الجولات والأوزان ومؤقتات الراحة الحية.',
      },
      {
        iconName: 'flame',
        titleEn: 'Daily Fuel & Targets',
        titleAr: 'المستهدفات والطاقة الحية',
        descEn: 'Live dials for calorie burn, hydration logging, and daily protein goals.',
        descAr: 'راقب حرق السعرات واستهلاك الماء وهدف البروتين اليومي بحلقات تفاعلية مستمرة.',
      },
      {
        iconName: 'activity',
        titleEn: '3D Muscle Recovery',
        titleAr: 'استشفاء العضلات ثلاثي الأبعاد',
        descEn: 'Biomechanical fatigue modeling across 14 muscle groups.',
        descAr: 'تتبع إجهاد 14 مجموعة عضلية لتعرف بدقة متى تستعيد عضلاتك عافيتها وتكون جاهزة لزيادة الأوزان.',
      },
    ],
  },
  {
    id: 'training-plan',
    route: '/plan',
    targetSelector: '[data-tour="plan-calendar"], .calendar-page, .calendar-header-shell',
    screenBadgeEn: 'Screen 2 of 5',
    screenBadgeAr: 'الشاشة 2 من 5',
    screenNameEn: 'Weekly Training Plan',
    screenNameAr: 'شاشة الخطة التدريبية',
    titleEn: 'Training Plan & Split Calendar',
    titleAr: 'شاشة الخطة: جدول الأسبوع وتوزيع التمارين',
    descriptionEn: 'The master calendar. Organize your weekly split, balance rest days, and track progressive overload across the program.',
    descriptionAr: 'الروزنامة التدريبية المتكاملة لتنظيم تمارين الأسبوع، وموازنة أيام الراحة، ومتابعة زيادة الأحمال عبر دورة تدريبك.',
    accentColor: '#10b981',
    placement: 'bottom',
    features: [
      {
        iconName: 'calendar',
        titleEn: '7-Day Split Calendar',
        titleAr: 'الجدول الأسبوعي الموزّع',
        descEn: 'Visual overview of scheduled training days and programmed rest days.',
        descAr: 'عرض مرئي منظم لأيام التدريب وأيام الراحة المبرمجة لموازنة الشدة والتعافي.',
      },
      {
        iconName: 'zap',
        titleEn: 'Flexible Rescheduling',
        titleAr: 'إعادة الجدولة والتكرار بمرونة',
        descEn: 'Move or duplicate any session to next day with zero data loss.',
        descAr: 'نقل أو تكرار أو تأجيل أي جلسة تدريبية بنقرة واحدة لتلائم جدولك اليومي.',
      },
      {
        iconName: 'target',
        titleEn: 'Weekly Volume Heatmap',
        titleAr: 'خريطة حجم العضلات التراكمي',
        descEn: 'Visual intensity heatmaps measuring set volume per muscle group.',
        descAr: 'قياس كمية المجموعات التراكمية لكل عضلة أسبوعياً لضمان النمو المتناسق.',
      },
    ],
  },
  {
    id: 'routines-library',
    route: '/routines',
    targetSelector: '[data-tour="routines-library"], .routines-page, .zen-header',
    screenBadgeEn: 'Screen 3 of 5',
    screenBadgeAr: 'الشاشة 3 من 5',
    screenNameEn: 'Routines & Workouts',
    screenNameAr: 'شاشة الروتينات والحركات',
    titleEn: 'Routines & Exercise Database',
    titleAr: 'شاشة الروتينات: مكتبة البرامج والحركات',
    descriptionEn: 'The complete movement vault. Explore vetted workout programs, build custom routines, or generate splits with AI.',
    descriptionAr: 'مستودع التمارين والبرامج الرياضية المتكامل. استكشف برامج تدريبية عالمية، أو صمم روتيناتك الخاصة، أو أنشئ خطة بالذكاء الاصطناعي.',
    accentColor: '#84cc16',
    placement: 'bottom',
    features: [
      {
        iconName: 'dumbbell',
        titleEn: 'Curated Split Programs',
        titleAr: 'برامج تدريبية عالمية جاهزة',
        descEn: 'Vetted Push/Pull/Legs, Upper/Lower, and Full-Body programs ready to start.',
        descAr: 'برامج احترافية جاهزة بنقرة واحدة (PPL، علوي/سفلي، جسم كامل) معدّة لأقصى كفاءة.',
      },
      {
        iconName: 'sparkles',
        titleEn: 'Custom Routine Builder',
        titleAr: 'مصمم الروتينات المخصص',
        descEn: 'Create custom routines, reorder movements, and dial in target reps.',
        descAr: 'أضف تمارينك الخاصة، رتّب الحركات، وحدد المجموعات والتكرارات المستهدفة بحرية.',
      },
      {
        iconName: 'activity',
        titleEn: 'Interactive Muscle Map',
        titleAr: 'خريطة العضلات التفاعلية',
        descEn: 'Explore target exercises mapped directly to every anatomy group.',
        descAr: 'استكشف التمارين المناسبة لكل عضلة تشريحية بدقة بيوميكانيكية عالية.',
      },
    ],
  },
  {
    id: 'smart-nutrition',
    route: '/nutrition',
    targetSelector: '[data-tour="nutrition-overview"], .nutrition-overview-grid, .nutrition-page',
    screenBadgeEn: 'Screen 4 of 5',
    screenBadgeAr: 'الشاشة 4 من 5',
    screenNameEn: 'Smart Nutrition & Fuel',
    screenNameAr: 'شاشة التغذية الذكية',
    titleEn: 'Macro Dial & AI Food Scanner',
    titleAr: 'شاشة التغذية: حاسبة السعرات وماسح الوجبات',
    descriptionEn: 'Precision fueling. Monitor caloric balance, dial in protein targets, and scan meals with instant AI image recognition.',
    descriptionAr: 'محطة التغذية الدقيقة. راقب ميزانية السعرات، واضبط احتياجك من البروتين والماكروز، وامسح وجباتك بالكاميرا عبر الذكاء الاصطناعي.',
    accentColor: '#f59e0b',
    placement: 'bottom',
    features: [
      {
        iconName: 'flame',
        titleEn: 'Dynamic Energy Dial',
        titleAr: 'عداد السعرات والطاقة الحي',
        descEn: 'Track remaining vs eaten calories with live macro breakdown.',
        descAr: 'متابعة بصرية فورية للسعرات المتبقية وتوزيع البروتين والكارب والدهون الصحية.',
      },
      {
        iconName: 'camera',
        titleEn: 'AI Meal Photo Scanner',
        titleAr: 'ماسح الوجبات بالذكاء الاصطناعي',
        descEn: 'Snap any dish to automatically analyze ingredients and estimate macros.',
        descAr: 'صوّر طبق طعامك ليقوم الذكاء الاصطناعي بتقدير السعرات والمكونات تلقائياً.',
      },
      {
        iconName: 'zap',
        titleEn: '1-Tap Water Logging',
        titleAr: 'مسجّل الترطيب السريع',
        descEn: 'Quick 250ml logging with dynamic haptic progress feedback.',
        descAr: 'سجّل شرب الماء بنقرة واحدة (250 مل) مع مؤشر تفاعلي لتحقيق هدف السوائل اليومي.',
      },
    ],
  },
  {
    id: 'system-settings',
    route: '/settings',
    targetSelector: '[data-tour="settings-overview"], .settings-page, .settings-tabs-shell',
    screenBadgeEn: 'Screen 5 of 5',
    screenBadgeAr: 'الشاشة 5 من 5',
    screenNameEn: 'Settings & Profile',
    screenNameAr: 'شاشة الإعدادات والتخصيص',
    titleEn: 'Settings, Themes & Cloud Sync',
    titleAr: 'شاشة الإعدادات: التخصيص والمزامنة السحابية',
    descriptionEn: 'Your preferences hub. Tailor interface themes, toggle weight units, configure rest audio, and sync devices safely.',
    descriptionAr: 'مركز تفضيلاتك الشامل. اختر المظهر واللون المفضل، وحوّل وحدات الأوزان، واضبط تنبيهات الراحة، ومزامنة بياناتك سحابياً.',
    accentColor: '#a855f7',
    placement: 'bottom',
    features: [
      {
        iconName: 'sparkles',
        titleEn: '8 Pro Themes',
        titleAr: '8 مظاهر لونية فخمة',
        descEn: 'Switch between Obsidian, Neon, Ocean, Forest, Sunset, and Paper.',
        descAr: 'اختر بين تصاميم داكنة ونغمات حيوية (Obsidian, Midnight, Neon, Forest, Sunset...).',
      },
      {
        iconName: 'scale',
        titleEn: 'Weight Units & Rest Timers',
        titleAr: 'وحدات الأوزان ومؤقتات الراحة',
        descEn: 'Instant atomic conversion between kg and lb with customized audio alerts.',
        descAr: 'تحويل ذري مباشر بين الكيلوجرام والباوند مع تنبيهات صوتية واهتزازية لإيقاع الراحة.',
      },
      {
        iconName: 'shield',
        titleEn: 'Cloud Mirror & Multi-Device',
        titleAr: 'المزامنة السحابية والحماية',
        descEn: 'Real-time multi-device sync with instant export and backup capabilities.',
        descAr: 'تشفير ومزامنة آنية لجميع تدريباتك وسجلاتك عبر جميع أجهزتك بنقرة واحدة.',
      },
    ],
  },
];

export const FORMA_TOUR_STEPS = FORMA_SCREEN_TOUR_STEPS;
