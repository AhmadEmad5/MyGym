import { createContext, useContext, useEffect, ReactNode } from 'react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { useData } from '../hooks/useData';

export type Language = 'en' | 'ar';

export const TRANSLATIONS = {
  en: {
    // Navigation
    navToday: 'Today',
    navCalendar: 'Calendar',
    navRoutines: 'Routines',
    navNutrition: 'Nutrition',
    navHistory: 'History',
    navSettings: 'Settings',

    // General & Actions
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    close: 'Close',
    loading: 'Loading...',
    completed: 'Completed',
    complete: 'Complete',
    today: 'Today',
    cleanUp: 'Clean Up',
    apply: 'Apply',
    generateWithAI: 'Generate with AI',
    startWorkout: 'Start workout',
    signOut: 'Sign out',
    min: 'min',
    minutes: 'minutes',
    sessions: 'sessions',
    reps: 'reps',
    sets: 'sets',
    weight: 'Weight',
    exercises: 'Exercises',

    // Settings Page
    settingsTitle: 'Make it yours.',
    settingsSubtitle: 'Fine-tune the way your training space looks, feels, and works.',
    personalizeMyGym: 'Personalize MyGym',
    syncedLocally: 'Synced',
    yourAccount: 'Your account',
    guestAthlete: 'Guest athlete',
    guestEmailNote: 'Your training, stored on this device',
    updatePhoto: 'Update photo',
    appearance: 'Appearance',
    chooseAtmosphere: 'Choose your atmosphere',
    trainingPreferences: 'Training preferences',
    fitAppToRhythm: 'Fit the app to your rhythm',
    
    // Settings Rows
    languageTitle: 'Language / اللغة',
    languageDetail: 'Toggle the entire interface between Arabic and English',
    arabic: 'العربية',
    english: 'English',
    weightUnitTitle: 'Weight unit',
    weightUnitDetail: 'Convert all saved set weights automatically',
    restTimerTitle: 'Default rest timer',
    restTimerDetail: 'Used when you add new training movements',
    motionTitle: 'Motion intensity',
    motionDetail: 'Keep full motion or reduce visual movement',
    motionFull: 'Full',
    motionReduced: 'Reduced',
    weekStartsTitle: 'Week starts on',
    weekStartsDetail: 'Choose how your weekly schedule is organized',
    sun: 'Sun',
    mon: 'Mon',
    accountControls: 'Account controls',
    sessionSection: 'Session',
    signOutDesc: 'Your workout history stays safely stored in your account.',

    // Today Page
    todayEyebrow: 'Your daily focus',
    todayHeroHeadline: 'Own your moment.',
    todayHeroSubtitle: 'Small steps build an uncommon body. Here is your training rhythm for today.',
    planSession: 'Plan session',
    dailyProgress: 'Daily progress',
    youShowedUp: 'You showed up today.',
    nextRepWaiting: 'Your next rep is waiting.',
    dayForRecovery: 'A day for recovery.',
    sessionsFinished: 'sessions finished',
    useCalendarDesign: 'Use the calendar to design a session that fits your energy.',
    trainingQueue: 'Training queue',
    todaySessions: 'Today’s sessions',
    planned: 'planned',
    spaceToRecharge: 'Space to recharge',
    noTrainingScheduled: 'No training is scheduled today. Recover with intention or create your next session.',
    openCalendar: 'Open calendar',
    trainingCompleteTitle: 'Training complete',
    trainingCompleteDesc: 'Every planned session is in the books. Give yourself credit — consistency compounds.',
    viewHistory: 'View your history',
    markTodayComplete: 'Mark today complete',
    saveProgress: 'Save your progress',
    moreMovements: 'more movements',
    workoutReadyCustomize: 'Your workout is ready to customize.',

    // Calendar Page
    weeklyCalendar: 'Weekly Calendar',
    previousWeek: 'Previous week',
    nextWeek: 'Next week',
    addSession: 'Add Session',
    readyToGetStarted: 'Ready to get started?',
    noWorkoutsScheduled: 'You don’t have any workouts scheduled yet. We can automatically generate a 4-week Push-Pull-Legs routine for you (resting on Fridays).',
    generatePPLRoutine: 'Generate PPL Routine',
    generateCustomAIPlan: 'Generate with AI',
    duplicateSessionsDetected: 'Duplicate sessions detected',
    duplicateDesc: 'Multiple identical sessions were found on the same days. You can clean them up with one click.',
    cleanUpDuplicates: 'Clean Up Duplicates',
    pastIncompleteDetected: 'Past uncompleted sessions detected',
    pastIncompleteDesc: 'Old uncompleted sessions were found from past days. You can clean them up with one click to keep your calendar neat.',
    cleanUpPastIncomplete: 'Clean Up Past Missed Sessions',
    missedWorkout: 'Missed',
    restDayNotice: 'REST DAY — skip the gym and let your body recover today.',
    aiGenerator: 'AI Generator',

    // Routines Page
    routinesLibrary: 'Routines Library',
    routinesHeroDesc: 'Choose a proven training program or use AI to craft your personalized schedule.',
    quickTip: 'Quick Tip',
    routinesBannerDesc: 'Pick your preferred days and apply any split to your weekly calendar automatically.',
    customPrograms: 'Custom Programs',
    createRoutine: 'Create Routine',
    daysRequired: 'days / week',
    scheduledOnCalendar: 'Scheduled on Calendar',
    applySplitToCalendar: 'Apply Split to Calendar',
    pastDaysExcluded: 'Past days of this week are excluded from scheduling.',
    routineStartsNextWeekNotice: 'All selected days for this week have passed. Routine will start next week.',

    // Nutrition Page
    nutritionTitle: 'Nutrition & Meals',
    nutritionSubtitle: 'Photograph your dish, get instant AI calorie analysis, and balance your daily energy.',
    caloriesIn: 'Calories In',
    fromLoggedMeals: 'From logged meals today',
    caloriesOut: 'Calories Out',
    burnedFromGym: 'Burned from gym workouts & cardio',
    netBalance: 'Net Balance',
    calorieDeficitZone: '🔥 Calorie Deficit (Fat Loss Zone)',
    calorieSurplusZone: '⚡ Calorie Surplus (Building Zone)',
    dailyMacros: 'Daily Macros',
    protein: 'Protein',
    carbs: 'Carbs',
    fats: 'Fats',
    logMealWithAI: 'Log Meal with AI Vision',
    mealType: 'Meal Type',
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
    dishPhoto: 'Dish Photo',
    takePhoto: 'Take Photo',
    uploadImage: 'Upload Image',
    photoHint: 'Capture or choose a photo of your plate for instant visual calorie breakdown',
    removePhoto: 'Remove Photo',
    descriptionLabel: 'Dish Description (Optional)',
    descriptionPlaceholder: 'e.g. 200g grilled chicken breast with basmati rice and mixed greens',
    analyzeDishBtn: 'Analyze Dish with AI',
    analyzingText: 'Analyzing Dish with AI...',
    analysisResult: 'AI Analysis Result',
    editValuesNotice: 'Feel free to tweak any numbers before saving:',
    dishName: 'Dish Name',
    estCalories: 'Estimated Calories (kcal)',
    healthScore: 'Health Score',
    aiNutritionalAdvice: 'AI Nutritional Insight',
    detectedIngredients: 'Detected Ingredients & Portions',
    burnRateEstimate: 'Burn Rate Estimate',
    burnCardioNotice: 'min of jogging/cardio or',
    burnGymNotice: 'min of heavy lifting to burn this meal.',
    saveToMeals: 'Save to Today’s Meals',
    saving: 'Saving...',
    todaysLoggedMeals: 'Today’s Logged Meals',
    noMealsLoggedToday: 'No meals logged yet today',
    noMealsLoggedDesc: 'Snap a photo of your plate or describe your meal on the left to start tracking calories and macros.',

    // History Page
    historyTitle: 'Activity & Calorie History',
    historySubtitle: 'Review your training sessions, nutrition logs, and daily energy balance over time.',
    allActivity: 'All Activity',
    workoutsOnly: 'Workouts',
    mealsOnly: 'Meals',
    workoutsFinished: 'Workouts Finished',
    mealsTracked: 'Meals Tracked',
    totalCaloriesBurned: 'Total Calories Burned',
    weeklyConsistency: 'Weekly Consistency',
    searchWorkoutsOrDishes: 'Search workouts or dishes...',
    noHistoryYet: 'No history records found',
    noHistoryDesc: 'Complete workouts from the Calendar or log meals in the Nutrition section to build your history.',
    loggedMealsAndDishes: 'Logged Meals & Dishes',
    completedWorkoutsAndExercises: 'Completed Workouts & Exercises',
    workoutWord: 'workout',
    workoutsWord: 'workouts',
    mealWord: 'meal',
    mealsWord: 'meals',
    netWord: 'Net',
    setWord: 'Set',
    repsActualTarget: 'Reps (Actual/Target)',
    generalSessionNoSets: 'General session without specific logged sets.',
    exercisesCompleted: 'exercises completed',
    totalBurned: 'Burned',

    // Modals & Add Sessions
    newSessionTitle: 'New Session',
    editSessionTitle: 'Edit Session',
    quickTemplates: 'Quick Templates',
    sessionTitleInput: 'Title',
    dateTimeInput: 'Date & Time',
    durationInput: 'Duration (min)',
    typeInput: 'Type',
    notesInput: 'Notes',
    strengthType: 'Strength',
    cardioType: 'Cardio',
    yogaType: 'Yoga',
    hiitType: 'HIIT',
    otherType: 'Other',
    deleteSessionConfirm: 'Delete this session?',
    deleteSession: 'Delete Session',
    removeDuplicatesConfirm: 'Remove duplicate workout session(s)?',
    scheduleRoutineError: 'An error occurred while scheduling routine. Please try again.',
    multipleMuscles: 'Multiple muscles',
    noExercises: 'No exercises',
    restDayAlert: 'Fridays are strictly rest days! Please choose another day.',
    finishWorkout: 'Finish Workout',
    workoutCompleted: 'Completed',
    addExercise: 'Add Exercise',
    deleteExercise: 'Delete Exercise',
    deleteExerciseConfirm: 'Are you sure you want to remove this exercise?',
    addSet: 'Add Set',
    deleteSet: 'Delete Set',
    targetRepsLabel: 'Target Reps',
    actualRepsLabel: 'Actual Reps',
    formGuideTutorial: 'Form Guide & Video Tutorial',
    restTimerActive: 'Rest Timer Active',
    restSeconds: 'Rest (seconds)',
    target: 'Target',
    repsWord: 'reps',
    done: 'Done',
    cardioDuration: 'Duration (minutes)',
    startTimer: 'Start Timer',
    stopTimer: 'Stop Timer',
    treadmillCapture: 'Treadmill Screen Capture',
    takePicture: 'Take Picture',
    secondsWord: 'seconds',
    imageSizeLimitAlert: 'Please select an image smaller than 2MB.',
    deleteHistoryConfirm: 'Are you sure you want to delete this completed workout from your history?',
    deleteMealConfirm: 'Are you sure you want to delete this meal record?',
    aiAssistantTitle: 'AI Fitness Assistant',
    aiAssistantPlaceholder: 'Ask about workouts, nutrition, or exercises...',
    aiAssistantTyping: 'Typing...',
    aiAssistantGreeting: 'Hi! I am your AI fitness assistant. How can I help you reach your goals today?',
    photoReadyForAnalysis: 'Photo ready for AI analysis',
    takesApproxToBurn: 'Takes approx.',
    ofCardioOr: 'mins of cardio or',
    ofStrengthToBurn: 'mins of strength training to burn.',

    // AI Workout Generator Modal
    aiWorkoutGenTitle: 'AI Workout Generator',
    aiWorkoutGenSubtitle: 'Craft a periodized, biomechanically balanced routine in seconds',
    fitnessGoal: 'Primary Goal',
    experienceLevel: 'Experience Level',
    trainingDays: 'Training Frequency',
    availableEquipment: 'Available Equipment',
    customFocusOptional: 'Specific Focus or Weak Points (Optional)',
    customFocusPlaceholder: 'e.g. Prioritize upper chest and lateral delts, squat-focused',
    generatePlanBtn: 'Generate Science-Backed Plan',
    generatingPlan: 'Designing optimal split & volume...',
    applyToCalendarBtn: 'Apply to Calendar',
    saveToRoutinesBtn: 'Save to Routines',
    routineAppliedSuccess: 'Plan scheduled onto your calendar successfully!',
    routineSavedSuccess: 'Plan saved to your custom routines!',

    // Onboarding Tour
    welcomeTourTitle: 'Welcome to MyGym',
    welcomeTourSubtitle: 'Your Elite Training Command Center',
    welcomeTourDesc: 'Track your strength progress, log exercises with precision, and build consistent workout routines designed for real results.',
    todayTourTitle: "Today's Focus & Workout Queue",
    todayTourSubtitle: 'Never Wonder What to Train',
    todayTourDesc: 'Your daily workouts appear right on your dashboard. Start training with one tap, log weights and reps, and celebrate completed sessions.',
    calendarTourTitle: 'Intelligent Weekly Calendar',
    calendarTourSubtitle: 'Seamless Scheduling & Multi-Week Programs',
    calendarTourDesc: 'Browse routines like PPL splits, apply them across multiple weeks, and rearrange workouts easily while keeping rest days sacred.',
    aiTourTitle: 'AI Gym Coach & Smart Tools',
    aiTourSubtitle: 'Personalized Advice Whenever You Need It',
    aiTourDesc: 'Have questions about technique, nutrition, or programming? Snap dish photos for calorie tracking or generate custom routines instantly.',
    stepOf: 'Step',
    of: 'of',
    next: 'Next',
    back: 'Back',
    getStarted: 'Get Started',
    skip: 'Skip',

    // Rest Timer Alerts
    restSoundAlertsTitle: 'Rest Timer Sound Alert',
    restSoundAlertsDetail: 'Play a gentle chime when rest timer reaches zero',
    restVibrationAlertsTitle: 'Rest Timer Vibration',
    restVibrationAlertsDetail: 'Vibrate mobile device when rest timer completes',
    restCompleteNotification: 'Rest time is up! Time for your next set 💪',
    on: 'On',
    off: 'Off',

    // Weekly AI Coach Digest
    weeklyCoachDigest: 'Weekly Coach Digest',
    weeklyCoachDigestDesc: 'Instant AI analysis of your effort, consistency, and highlights this week',
    generateWeeklyDigest: 'Generate Weekly Digest',
    generatingDigest: 'Analyzing your sessions and meals with AI Coach...',
    refreshDigest: 'Refresh Digest',
    coachConsistencyTitle: 'Consistency & Training Volume',
    coachStrengthTitle: 'Key Strength & Highlight',
    coachNextWeekTitle: 'Next Week Coaching Cue',
    coachAdviceDisclaimer: 'Personalized coaching cues based on your logged training data',
    noWeeklyDataNotice: 'Log a few workouts or meals this week so the AI Coach can generate your weekly report.',

    // Data Backup & Transfer
    dataBackupSection: 'Data Management & Backup',
    dataBackupSubtitle: 'Save your workouts and meals locally, or transfer safely between devices',
    exportBackup: 'Export Backup (JSON)',
    exportBackupDesc: 'Download a JSON file with all your routines, sessions, and logs',
    importBackup: 'Import Backup (JSON)',
    importBackupDesc: 'Restore your workouts and logs from a previously exported JSON file',
    importSuccess: 'Data imported successfully!',
    importError: 'Invalid backup file or error occurred during import.',
    confirmImport: 'Do you want to import this backup? Your current data will be safely merged and updated.'
  },
  ar: {
    // Navigation
    navToday: 'اليوم',
    navCalendar: 'التقويم',
    navRoutines: 'الجداول',
    navNutrition: 'التغذية',
    navHistory: 'السجل',
    navSettings: 'الإعدادات',

    // General & Actions
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    close: 'إغلاق',
    loading: 'جارِ التحميل...',
    completed: 'مكتمل',
    complete: 'إكمال',
    today: 'اليوم',
    cleanUp: 'تنظيف',
    apply: 'تطبيق',
    generateWithAI: 'توليد بالذكاء الاصطناعي',
    startWorkout: 'بدء التمرين',
    signOut: 'تسجيل الخروج',
    min: 'دقيقة',
    minutes: 'دقائق',
    sessions: 'جلسات',
    reps: 'تكرار',
    sets: 'جولات',
    weight: 'الوزن',
    exercises: 'التمارين',

    // Settings Page
    settingsTitle: 'صممه على طريقتك.',
    settingsSubtitle: 'خصص مظهر وإعدادات مساحتك التدريبية بما يناسب وتيرتك اليومية.',
    personalizeMyGym: 'تخصيص MyGym',
    syncedLocally: 'متزامن محلياً',
    yourAccount: 'حسابك',
    guestAthlete: 'رياضي زائر',
    guestEmailNote: 'بيانات تدريبك محفوظة بأمان على هذا الجهاز',
    updatePhoto: 'تحديث الصورة',
    appearance: 'المظهر والطابع',
    chooseAtmosphere: 'اختر اللون والطابع المفضل',
    trainingPreferences: 'تفضيلات التدريب',
    fitAppToRhythm: 'اضبط التطبيق بما يتماشى مع أهدافك',

    // Settings Rows
    languageTitle: 'اللغة / Language',
    languageDetail: 'التبديل بين الواجهة العربية والإنجليزية بالكامل',
    arabic: 'العربية',
    english: 'English',
    weightUnitTitle: 'وحدة قياس الوزن',
    weightUnitDetail: 'تحويل أوزان جميع الجلسات والتمارين تلقائياً',
    restTimerTitle: 'مؤقت الراحة الافتراضي',
    restTimerDetail: 'يُطبق تلقائياً عند إضافة تمارين جديدة',
    motionTitle: 'تأثيرات الحركة والانتقالات',
    motionDetail: 'حركة كاملة سلسة أو تقليل المؤثرات البصرية',
    motionFull: 'كاملة',
    motionReduced: 'مخففة',
    weekStartsTitle: 'بداية الأسبوع',
    weekStartsDetail: 'اختر اليوم الأول لتنظيم جدولك التدريبي الأسبوعي',
    sun: 'الأحد',
    mon: 'الاثنين',
    accountControls: 'إدارة الحساب',
    sessionSection: 'الجلسة',
    signOutDesc: 'سجل تمارينك وبياناتك محفوظة بأمان في حسابك.',

    // Today Page
    todayEyebrow: 'تركيزك اليومي',
    todayHeroHeadline: 'اصنع فارقك اليوم.',
    todayHeroSubtitle: 'خطوات صغيرة تبني جسماً استثنائياً. إليك وتيرة تدريبك لليوم.',
    planSession: 'جدولة جلسة',
    dailyProgress: 'التقدم اليومي',
    youShowedUp: 'أحسنت! أتممت تدريبك اليوم.',
    nextRepWaiting: 'جلستك القادمة بانتظارك.',
    dayForRecovery: 'يوم راحة واستشفاء.',
    sessionsFinished: 'جلسات مكتملة',
    useCalendarDesign: 'استخدم التقويم لتصميم جلسة تناسب طاقتك ووقتك.',
    trainingQueue: 'قائمة التدريب',
    todaySessions: 'جلسات اليوم',
    planned: 'مجدولة',
    spaceToRecharge: 'مساحة للاستشفاء',
    noTrainingScheduled: 'لا توجد تمارين مجدولة اليوم. استمتع براحتك أو أنشئ جلستك القادمة.',
    openCalendar: 'فتح التقويم',
    trainingCompleteTitle: 'اكتمل تدريب اليوم',
    trainingCompleteDesc: 'أنهيت جميع الجلسات المخططة بنجاح. استمرارك يضمن نتائجك!',
    viewHistory: 'عرض السجل',
    markTodayComplete: 'تحديد اليوم كمكتمل',
    saveProgress: 'حفظ التقدم',
    moreMovements: 'تمارين إضافية',
    workoutReadyCustomize: 'تمرينك جاهز للتخصيص.',

    // Calendar Page
    weeklyCalendar: 'التقويم الأسبوعي',
    previousWeek: 'الأسبوع السابق',
    nextWeek: 'الأسبوع القادم',
    addSession: 'إضافة جلسة',
    readyToGetStarted: 'جاهز للبدء؟',
    noWorkoutsScheduled: 'ليس لديك تمارين مجدولة حالياً. يمكننا توليد جدول بنظام Push-Pull-Legs تلقائياً لمدة 4 أسابيع (مع راحة الجمعة).',
    generatePPLRoutine: 'توليد جدول PPL تلقائي',
    generateCustomAIPlan: 'توليد جدول مخصص بالذكاء الاصطناعي',
    duplicateSessionsDetected: 'تم اكتشاف جلسات مكررة',
    duplicateDesc: 'تم العثور على جلسات متطابقة في نفس الأيام. يمكنك تنظيفها بنقرة واحدة.',
    cleanUpDuplicates: 'تنظيف الجلسات المكررة',
    pastIncompleteDetected: 'تم اكتشاف جلسات سابقة غير مكتملة',
    pastIncompleteDesc: 'تم العثور على جلسات قديمة غير مكتملة في الأيام السابقة. يمكنك تنظيفها بنقرة واحدة للحفاظ على ترتيب تقويمك.',
    cleanUpPastIncomplete: 'تنظيف الجلسات الفائتة السابقة',
    missedWorkout: 'فائت',
    restDayNotice: 'يوم راحة — اترك الجيم اليوم ودع عضلاتك تستشفي وتنمو.',
    aiGenerator: 'صانع الجداول الذكي',

    // Routines Page
    routinesLibrary: 'مكتبة الجداول والروتينات',
    routinesHeroDesc: 'اختر برنامجاً تدريبياً معتمداً أو استخدم الذكاء الاصطناعي لتصميم جدولك الخاص.',
    quickTip: 'معلومة سريعة',
    routinesBannerDesc: 'حدد الأيام المفضلة وطبق أي جدول تدريبي على تقويمك الأسبوعي بضغطة زر.',
    customPrograms: 'جداولي المخصصة',
    createRoutine: 'إنشاء روتين جديد',
    daysRequired: 'أيام / أسبوع',
    scheduledOnCalendar: 'مجدول على التقويم',
    applySplitToCalendar: 'تطبيق الجدول على التقويم',
    pastDaysExcluded: 'تم استبعاد الأيام السابقة من هذا الأسبوع من الجدولة.',
    routineStartsNextWeekNotice: 'انتهت الأيام المختارة لهذا الأسبوع، سيبدأ البرنامج من الأسبوع القادم.',

    // Nutrition Page
    nutritionTitle: 'التغذية والوجبات',
    nutritionSubtitle: 'صوّر طبق طعامك، واحصل على تحليل ذكي فوري للسعرات والماكروز، ووازن طاقتك اليومية.',
    caloriesIn: 'السعرات المستهلكة',
    fromLoggedMeals: 'من وجبات اليوم المسجلة',
    caloriesOut: 'السعرات المحروقة',
    burnedFromGym: 'محروقة من تمارين الجيم والكارديو',
    netBalance: 'صافي الطاقة (Net Balance)',
    calorieDeficitZone: '🔥 في نطاق حرق الدهون (عجز سعرات)',
    calorieSurplusZone: '⚡ في نطاق البناء العضلي (فائض سعرات)',
    dailyMacros: 'الماكروز اليومية',
    protein: 'بروتين',
    carbs: 'كارب',
    fats: 'دهون',
    logMealWithAI: 'تسجيل وجبة بالرؤية الذكية',
    mealType: 'نوع الوجبة',
    breakfast: 'فطور',
    lunch: 'غداء',
    dinner: 'عشاء',
    snack: 'سناك',
    dishPhoto: 'صورة الطبق',
    takePhoto: 'التقاط صورة',
    uploadImage: 'رفع صورة',
    photoHint: 'التقط أو اختر صورة لطبقك للحصول على تفكيك فوري للسعرات والمكونات',
    removePhoto: 'حذف الصورة',
    descriptionLabel: 'وصف الطبق (اختياري)',
    descriptionPlaceholder: 'مثال: 200 غرام صدر دجاج مشوي مع رز بسمتي وسلطة خضراء',
    analyzeDishBtn: 'تحليل الطبق بالذكاء الاصطناعي',
    analyzingText: 'جارِ فحص الطبق بالذكاء الاصطناعي...',
    analysisResult: 'نتيجة التحليل الذكي',
    editValuesNotice: 'يمكنك تعديل أي قيمة بسهولة قبل الحفظ:',
    dishName: 'اسم الوجبة',
    estCalories: 'السعرات التقديرية (kcal)',
    healthScore: 'التقييم الصحي',
    aiNutritionalAdvice: 'نصيحة الذكاء الاصطناعي الغذائية',
    detectedIngredients: 'المكونات والحصص المكتشفة',
    burnRateEstimate: 'معدل الحرق المطلوب',
    burnCardioNotice: 'دقيقة جري/كارديو أو',
    burnGymNotice: 'دقيقة تمارين مقاومة لحرق هذه الوجبة.',
    saveToMeals: 'حفظ في وجبات اليوم',
    saving: 'جارِ الحفظ...',
    todaysLoggedMeals: 'وجبات اليوم المسجلة',
    noMealsLoggedToday: 'لم تسجل أي وجبات اليوم بعد',
    noMealsLoggedDesc: 'التقط صورة لطبقك أو اكتب وصفاً لوجبتك على اليمين للبدء بتتبع السعرات والقيم الغذائية.',

    // History Page
    historyTitle: 'سجل النشاط والسعرات الحرارية',
    historySubtitle: 'راجع جلساتك التدريبية، وسجل وجباتك، وصافي توازن طاقتك اليومي على مدار الوقت.',
    allActivity: 'كافة الأنشطة',
    workoutsOnly: 'التمارين',
    mealsOnly: 'الوجبات',
    workoutsFinished: 'تمارين منجزة',
    mealsTracked: 'وجبات مسجلة',
    totalCaloriesBurned: 'إجمالي السعرات المحروقة',
    weeklyConsistency: 'الالتزام الأسبوعي',
    searchWorkoutsOrDishes: 'ابحث في التمارين أو الأطباق...',
    noHistoryYet: 'لا توجد سجلات في التاريخ حتى الآن',
    noHistoryDesc: 'أكمل التمارين من التقويم أو سجّل الوجبات في قسم التغذية لتبدأ ببناء سجلك.',
    loggedMealsAndDishes: 'الوجبات والأطباق المسجلة',
    completedWorkoutsAndExercises: 'التمارين والجلسات المكتملة',
    workoutWord: 'تمرين',
    workoutsWord: 'تمارين',
    mealWord: 'وجبة',
    mealsWord: 'وجبات',
    netWord: 'الصافي',
    setWord: 'الجولة',
    repsActualTarget: 'التكرارات (الفعلي/المستهدف)',
    generalSessionNoSets: 'جلسة عامة بدون جولات مسجلة بالتفصيل.',
    exercisesCompleted: 'تمارين مكتملة',
    totalBurned: 'المحروق',

    // Modals & Add Sessions
    newSessionTitle: 'جلسة تدريبية جديدة',
    editSessionTitle: 'تعديل الجلسة',
    quickTemplates: 'قوالب سريعة',
    sessionTitleInput: 'عنوان التمرين',
    dateTimeInput: 'التاريخ والوقت',
    durationInput: 'المدة (دقيقة)',
    typeInput: 'النوع',
    notesInput: 'ملاحظات',
    strengthType: 'مقاومة وقوة',
    cardioType: 'كارديو',
    yogaType: 'يوغا',
    hiitType: 'هيت (HIIT)',
    otherType: 'أخرى',
    deleteSessionConfirm: 'هل تريد حذف هذه الجلسة التدريبية؟',
    deleteSession: 'حذف الجلسة',
    removeDuplicatesConfirm: 'هل أنت متأكد من رغبتك في إزالة الجلسات المكررة؟',
    scheduleRoutineError: 'حدث خطأ أثناء جدولة البرنامج. يرجى المحاولة مرة أخرى.',
    multipleMuscles: 'مجموعات عضلية متعددة',
    noExercises: 'بدون تمارين',
    restDayAlert: 'أيام الجمعة مخصصة للاستشفاء والراحة! يرجى اختيار يوم آخر.',
    finishWorkout: 'إنهاء التمرين',
    workoutCompleted: 'مكتمل',
    addExercise: 'إضافة تمرين',
    deleteExercise: 'حذف التمرين',
    deleteExerciseConfirm: 'هل أنت متأكد من حذف هذا التمرين من الجلسة؟',
    addSet: 'إضافة جولة',
    deleteSet: 'حذف المجموعة',
    targetRepsLabel: 'التكرار المستهدف',
    actualRepsLabel: 'التكرار الفعلي',
    formGuideTutorial: 'دليل الأداء والشرح بالفيديو',
    restTimerActive: 'مؤقت الراحة قيد التشغيل',
    restSeconds: 'الراحة (ثواني)',
    target: 'المستهدف',
    repsWord: 'تكرار',
    done: 'تم',
    cardioDuration: 'المدة (دقائق)',
    startTimer: 'بدء المؤقت',
    stopTimer: 'إيقاف المؤقت',
    treadmillCapture: 'صورة شاشة السير الرياضي',
    takePicture: 'التقاط صورة',
    secondsWord: 'ثانية',
    imageSizeLimitAlert: 'يرجى اختيار صورة بحجم أقل من 2 ميغابايت.',
    deleteHistoryConfirm: 'هل أنت متأكد من حذف هذا التمرين المكتمل من السجل؟',
    deleteMealConfirm: 'هل أنت متأكد من حذف هذه الوجبة؟',
    aiAssistantTitle: 'المساعد الرياضي الذكي',
    aiAssistantPlaceholder: 'اسأل عن التمارين، التغذية، أو الأوزان...',
    aiAssistantTyping: 'جارِ الكتابة...',
    aiAssistantGreeting: 'مرحباً! أنا مساعدك الرياضي بالذكاء الاصطناعي. كيف أستطيع مساعدتك اليوم في تحقيق أهدافك؟',
    photoReadyForAnalysis: 'الصورة جاهزة للفحص بالذكاء الاصطناعي',
    takesApproxToBurn: 'يحتاج لحرقه ما يقارب',
    ofCardioOr: 'دقيقة كارديو أو',
    ofStrengthToBurn: 'دقيقة تمارين مقاومة لحرقها.',

    // AI Workout Generator Modal
    aiWorkoutGenTitle: 'صانع الجداول الذكي',
    aiWorkoutGenSubtitle: 'صمم جدولاً تدريبياً علمياً متوازناً في ثوانٍ معدودة',
    fitnessGoal: 'الهدف الأساسي',
    experienceLevel: 'مستوى الخبرة',
    trainingDays: 'عدد أيام التدريب بالأسبوع',
    availableEquipment: 'المعدات المتاحة',
    customFocusOptional: 'تركيز خاص أو نقاط ضعف (اختياري)',
    customFocusPlaceholder: 'مثال: التركيز على الصدر العلوي والأكتاف الجانبية',
    generatePlanBtn: 'توليد الجدول بالذكاء الاصطناعي',
    generatingPlan: 'جارِ تصميم الجدول وحساب الأحجام العضلية...',
    applyToCalendarBtn: 'تطبيق الجدول على التقويم',
    saveToRoutinesBtn: 'حفظ في مكتبة الجداول',
    routineAppliedSuccess: 'تم جدولة البرنامج التدريبي على تقويمك بنجاح!',
    routineSavedSuccess: 'تم حفظ البرنامج التدريبي في مكتبة جداولك!',

    // Onboarding Tour
    welcomeTourTitle: 'مرحباً بك في MyGym',
    welcomeTourSubtitle: 'مركزك التدريبي الرياضي المتكامل',
    welcomeTourDesc: 'تتبع تقدمك في القوة والأوزان، وسجل تمارينك بدقة، وابنِ عادات تدريبية مستمرة تحقق لك نتائج حقيقية.',
    todayTourTitle: "تركيزك اليومي وقائمة التمارين",
    todayTourSubtitle: 'لن تحتار بعد اليوم في تمرينك',
    todayTourDesc: 'تمارينك اليومية تظهر مباشرة أمامك. ابدأ التمرين بنقرة واحدة، وسجل أوزانك وتكراراتك، واحتفل بإنجازك.',
    calendarTourTitle: 'التقويم الأسبوعي الذكي',
    calendarTourSubtitle: 'جدولة ذكية وبرامج تدريبية لعدة أسابيع',
    calendarTourDesc: 'تصفح الجداول المعتمدة مثل PPL وطبقها لأسابيع قادمة بضغطة زر، مع حماية كاملة لأيام الراحة.',
    aiTourTitle: 'المدرب الذكي وأدوات التحليل',
    aiTourSubtitle: 'إرشاد وتوجيه مخصص كلما احتجت',
    aiTourDesc: 'صوّر أطباقك لتحليل السعرات بالذكاء الاصطناعي، أو ولّد جداول مخصصة تناسب هدفك ومستواك فورياً.',
    stepOf: 'الخطوة',
    of: 'من',
    next: 'التالي',
    back: 'السابق',
    getStarted: 'ابدأ الآن',
    skip: 'تخطي',

    // Rest Timer Alerts
    restSoundAlertsTitle: 'نغمة تنبيه انتهاء الراحة',
    restSoundAlertsDetail: 'تشغيل رنة لطيفة عند انتهاء عداد الراحة بين الجولات',
    restVibrationAlertsTitle: 'اهتزاز انتهاء الراحة',
    restVibrationAlertsDetail: 'اهتزاز الهاتف لتنبيهك ببدء الجولة التالية',
    restCompleteNotification: 'انتهت فترة الراحة! حان وقت الجولة التالية 💪',
    on: 'تشغيل',
    off: 'إيقاف',

    // Weekly AI Coach Digest
    weeklyCoachDigest: 'تقرير المدرب الأسبوعي',
    weeklyCoachDigestDesc: 'تحليل ذكي فوري لأدائك والتزامك وأبرز إنجازاتك هذا الأسبوع',
    generateWeeklyDigest: 'توليد تقرير الأسبوع',
    generatingDigest: 'جارِ تحليل جلساتك ووجباتك مع المدرب الذكي...',
    refreshDigest: 'تحديث التقرير',
    coachConsistencyTitle: 'تقييم الالتزام والحجم التدريبي',
    coachStrengthTitle: 'نقطة القوة والإنجاز البارز',
    coachNextWeekTitle: 'نصيحة وتوجيه الأسبوع القادم',
    coachAdviceDisclaimer: 'توجيهات تدريبية مخصصة استناداً لبيانات تمرينك المسجلة',
    noWeeklyDataNotice: 'سجل بعض التمارين أو الوجبات خلال هذا الأسبوع ليتمكن المدرب من صياغة تقريرك.',

    // Data Backup & Transfer
    dataBackupSection: 'إدارة البيانات والنسخ الاحتياطي',
    dataBackupSubtitle: 'احفظ بياناتك محلياً وقم باسترجاعها أو نقلها بين أجهزتك بأمان تام',
    exportBackup: 'تصدير نسخة احتياطية (JSON)',
    exportBackupDesc: 'تنزيل ملف JSON يضم كامل جداولك، جلساتك، وسجلاتك',
    importBackup: 'استيراد نسخة احتياطية (JSON)',
    importBackupDesc: 'استعادة تمارينك وسجلاتك من ملف JSON سابق',
    importSuccess: 'تم استيراد بياناتك بنجاح!',
    importError: 'الملف غير صالح أو حدث خطأ أثناء الاستيراد.',
    confirmImport: 'هل تريد استيراد هذه النسخة الاحتياطية؟ سيتم دمج وتحديث بياناتك الحالية بأمان.'
  }
};

export type TranslationKey = keyof typeof TRANSLATIONS.en;

export function getTranslation(lang: Language, key: TranslationKey): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key] || key;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
  formatDate: (date: Date | string | number, formatPattern: string) => string;
  tExercise: (name: string) => string;
  tMuscle: (muscle: string) => string;
  tTitle: (title: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const ARABIC_DAYS_SHORT = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
export const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export function formatLocalizedDate(
  date: Date | string | number,
  formatPattern: string,
  lang: Language = 'en'
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return '';

  if (lang === 'ar') {
    if (formatPattern === 'EEEE') {
      return ARABIC_DAYS[d.getDay()];
    }
    if (formatPattern === 'EEE') {
      return ARABIC_DAYS[d.getDay()];
    }
    if (formatPattern === 'MMM' || formatPattern === 'MMMM') {
      return ARABIC_MONTHS[d.getMonth()];
    }
    if (formatPattern === 'MMMM yyyy') {
      return `${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }
    if (formatPattern.includes('EEEE') && (formatPattern.includes('MMMM') || formatPattern.includes('MMM'))) {
      const dayName = ARABIC_DAYS[d.getDay()];
      const monthName = ARABIC_MONTHS[d.getMonth()];
      return `${dayName}، ${d.getDate()} ${monthName} ${d.getFullYear()}`;
    }
    return format(d, formatPattern, { locale: arSA });
  }

  return format(d, formatPattern, { locale: enUS });
}

export const EXERCISE_TRANSLATIONS: Record<string, string> = {
  // Cardio
  'Treadmill': 'جهاز المشي (تريدميل)',
  'Stationary Bike': 'الدراجة الثابتة',
  'Stairmaster': 'جهاز صعود الدرج (ستير ماستر)',
  'Elliptical': 'جهاز الإليبتيكال',
  'Rowing Machine': 'جهاز التجديف',
  'Jump Rope': 'نط الحبل',

  // Chest
  'Bench Press': 'بنش برس بالبار (مستوي)',
  'Barbell Bench Press': 'بنش برس بالبار (مستوي)',
  'Incline Bench Press': 'بنش برس مائل بالبار (علوي)',
  'Incline Barbell Bench Press': 'بنش برس مائل بالبار (علوي)',
  'Incline Dumbbell Press': 'تجميع دمبلز مائل (صدر علوي)',
  'Dumbbell Bench Press': 'تجميع دمبلز مستوي (صدر)',
  'Decline Bench Press': 'بنش برس مائل لأسفل (صدر سفلي)',
  'Seated Machine Chest Press': 'دفع صدر على الجهاز (مستوي)',
  'Incline Machine Chest Press': 'دفع صدر مائل على الجهاز (علوي)',
  'High-to-Low Cable Crossover': 'تقاطع كيبل عالي لمنخفض (صدر سفلي)',
  'Low-to-High Cable Fly': 'سحب كيبل سفلي لأعلى (صدر علوي)',
  'Pec Deck Fly': 'فراشة صدر على الجهاز',
  'Chest Fly': 'فراشة صدر بالدمبلز',
  'Cable Crossover': 'تقاطع كيبل للصدر',
  'Dips': 'تمرين المتوازي (دبس)',
  'Chest Dips': 'تمرين المتوازي لعضلة الصدر',
  'Push-Ups': 'تمرين الضغط',
  'Push-ups': 'تمرين الضغط',

  // Back
  'Lat Pulldown': 'سحب ظهر عالي (لات بول داون)',
  'Wide-Grip Lat Pulldown': 'سحب ظهر عالي قبضة عريضة',
  'Close-Grip Lat Pulldown': 'سحب ظهر قبضة ضيقة',
  'Reverse Grip Lat Pulldown': 'سحب ظهر عالي قبضة معكوسة',
  'Barbell Row': 'تجديف بالبار (سحب ظهر)',
  'Bent-Over Barbell Row': 'تجديف بالبار منحني (سحب ظهر)',
  'Dumbbell Row': 'تجديف دمبل فردي (منشار)',
  'Single-Arm Dumbbell Row': 'تجديف دمبل فردي (منشار)',
  'Seated Cable Row': 'سحب كيبل أرضي جالس (تجديف)',
  'Chest-Supported Machine Row': 'تجديف بالمسند على الجهاز',
  'Machine Row': 'تجديف على الجهاز',
  'T-Bar Row': 'تجديف بالبار تي (T-Bar)',
  'Pull-Ups': 'عقلة قبضة واسعة',
  'Pull-ups': 'عقلة قبضة واسعة',
  'Chin-Ups': 'عقلة قبضة معكوسة (شن آب)',
  'Deadlift': 'ديدليفت بالبار (رفعة ميتة)',
  'Barbell Deadlift': 'ديدليفت بالبار (رفعة ميتة)',
  'Romanian Deadlift': 'ديدليفت روماني (فخذ خلفي)',
  'Back Extension': 'تمديد أسفل الظهر (هايبراكس)',
  'Hyperextension': 'تمديد أسفل الظهر',
  'Face Pulls': 'سحب كيبل للوجه (فيس بول)',
  'Face Pull': 'سحب كيبل للوجه (فيس بول)',
  'Straight-Arm Pulldown': 'سحب مستقيم بالكيبل (مجنص)',

  // Shoulders
  'Overhead Press': 'دفع كتف بالبار واقفا (أوفرهيد برس)',
  'Military Press': 'دفع كتف عسكري بالبار',
  'Barbell Shoulder Press': 'دفع كتف بالبار',
  'Dumbbell Shoulder Press': 'دفع كتف بالدمبلز جالس',
  'Seated Dumbbell Press': 'دفع كتف بالدمبلز جالس',
  'Machine Shoulder Press': 'دفع كتف على الجهاز',
  'Arnold Press': 'أرنولد برس بالدمبلز',
  'Lateral Raise': 'رفرفة جانبية بالدمبلز (كتف جانبي)',
  'Dumbbell Lateral Raise': 'رفرفة جانبية بالدمبلز',
  'Cable Lateral Raise': 'رفرفة جانبية بالكيبل',
  'Front Raise': 'رفرفة أمامية بالدمبلز',
  'Dumbbell Front Raise': 'رفرفة أمامية بالدمبلز',
  'Reverse Pec Deck': 'فراشة خلفية على الجهاز (كتف خلفي)',
  'Rear Delt Fly': 'فراشة خلفية بالدمبلز (كتف خلفي)',
  'Rear Delt Cable Fly': 'فراشة خلفية بالكيبل',
  'Barbell Shrugs': 'هز الكتفين بالبار (ترابيس)',
  'Dumbbell Shrugs': 'هز الكتفين بالدمبلز (ترابيس)',
  'Shrugs': 'هز الكتفين (ترابيس)',
  'Upright Row': 'سحب للأعلى بالبار (ترابيس وأكتاف)',

  // Arms - Biceps
  'Barbell Curl': 'تبادل بايسبس بالبار',
  'Bicep Curls': 'تبادل بايسبس بالبار',
  'Bicep Curl': 'تبادل بايسبس بالدمبلز',
  'Dumbbell Curl': 'تبادل بايسبس بالدمبلز',
  'Dumbbell Bicep Curl': 'تبادل بايسبس بالدمبلز',
  'Hammer Curl': 'تبادل شاكوش (هامر كيرل)',
  'Dumbbell Hammer Curl': 'تبادل شاكوش بالدمبلز',
  'Preacher Curl': 'تبادل بايسبس على مسند لاري (بريتشر)',
  'Machine Preacher Curl': 'تبادل بايسبس على جهاز لاري',
  'Incline Dumbbell Curl': 'تبادل بايسبس دمبلز على مقعد مائل',
  'Concentration Curl': 'تركيز بايسبس فردي بالدمبل',
  'Cable Curl': 'سحب بايسبس بالكيبل',

  // Arms - Triceps
  'Tricep Pushdown': 'دفع ترايسبس بالكيبل (بوش داون)',
  'Triceps Pushdown': 'دفع ترايسبس بالكيبل (بوش داون)',
  'Cable Pushdown': 'دفع ترايسبس بالكيبل',
  'Rope Pushdown': 'دفع ترايسبس بالحبل',
  'Skull Crushers': 'كسارة الجمجمة بالبار (ترايسبس)',
  'Lying Triceps Extension': 'تمديد ترايسبس مستلقي بالبار',
  'Overhead Tricep Extension': 'تمديد ترايسبس خلف الرأس بالدمبل',
  'Dumbbell Overhead Extension': 'تمديد ترايسبس خلف الرأس بالدمبل',
  'Cable Overhead Tricep Extension': 'تمديد ترايسبس بالكيبل خلف الرأس',
  'Close-Grip Bench Press': 'بنش برس قبضة ضيقة (ترايسبس)',
  'Tricep Dips': 'تمرين الغطس للترايسبس (دبس)',

  // Forearms
  'Cable Reverse Curl': 'سحب عكسي بالكيبل (سواعد)',
  'Reverse Barbell Curl': 'سحب عكسي بالبار (سواعد)',
  'Cable Wrist Curl': 'ثني المعصم بالكيبل (سواعد داخلي)',
  'Wrist Curl': 'ثني المعصم بالدمبلز (سواعد)',
  'Reverse Wrist Curl': 'ثني المعصم العكسي (سواعد خارجي)',
  'Farmer\'s Walk': 'مشية المزارع بالأوزان (سواعد وقبضة)',

  // Legs
  'Squats': 'سكوات بالبار (قرفصاء)',
  'Barbell Squat': 'سكوات بالبار (قرفصاء)',
  'Back Squat': 'سكوات خلفي بالبار',
  'Front Squat': 'سكوات أمامي بالبار',
  'Leg Press': 'جهاز ضغط الأرجل (ليج برس)',
  'Hack Squat': 'جهاز الهاك سكوات',
  'Leg Extension': 'تمديد أرجل أمامي على الجهاز',
  'Lying Leg Curl': 'ثني أرجل خلفي مستلقي على الجهاز',
  'Seated Leg Curl': 'ثني أرجل خلفي جالس على الجهاز',
  'Leg Curl': 'ثني أرجل خلفي على الجهاز',
  'Lunges': 'طعنات المشي (لانجز)',
  'Walking Lunges': 'طعنات المشي بالأوزان',
  'Dumbbell Lunges': 'طعنات بالدمبلز (لانجز)',
  'Bulgarian Split Squat': 'سكوات بلغاري بالدمبلز',
  'Calf Raises': 'رفع السمانة (كالف ريزس)',
  'Standing Calf Raise': 'رفع السمانة واقفا',
  'Seated Calf Raise': 'رفع السمانة جالسا',
  'Hip Thrust': 'دفع الحوض بالبار (هيب ثرست)',
  'Barbell Hip Thrust': 'دفع الحوض بالبار (هيب ثرست)',

  // Core & Abs
  'Plank': 'تمرين البلانك',
  'Hanging Leg Raise': 'رفع الأرجل معلقا على العقلة',
  'Cable Crunch': 'طحن البطن بالكيبل (كيبل كرانش)',
  'Ab Wheel Rollout': 'عجلة البطن',
  'Russian Twists': 'التواء روسي للخواصر',
  'Crunches': 'تمرين الطحن للبطن (كرانشز)',
  'Sit-Ups': 'تمرين الجلوس للبطن (سيت آب)'
};

export function translateExerciseName(name: string, lang: Language = 'en'): string {
  if (!name) return '';
  if (lang !== 'ar') return name;

  if (EXERCISE_TRANSLATIONS[name]) return EXERCISE_TRANSLATIONS[name];

  const lower = name.toLowerCase().trim();
  for (const [key, val] of Object.entries(EXERCISE_TRANSLATIONS)) {
    if (key.toLowerCase() === lower) return val;
  }

  for (const [key, val] of Object.entries(EXERCISE_TRANSLATIONS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return val;
    }
  }

  return name;
}

export const MUSCLE_TRANSLATIONS: Record<string, string> = {
  'Chest': 'الصدر',
  'Back': 'الظهر',
  'Legs': 'الأرجل',
  'Shoulders': 'الأكتاف',
  'Biceps': 'بايسبس',
  'Triceps': 'ترايسبس',
  'Forearms': 'السواعد',
  'Abs': 'البطن والكور',
  'Core': 'البطن والكور',
  'Calves': 'السمانة',
  'Quads': 'الفخذ الأمامي',
  'Hamstrings': 'الفخذ الخلفي',
  'Glutes': 'المؤخرة',
  'Cardio': 'كارديو',
  'Full Body': 'كامل الجسم',
  'Multiple muscles': 'مجموعات عضلية متعددة',
  'No exercises': 'بدون تمارين'
};

export function translateMuscle(muscle: string, lang: Language = 'en'): string {
  if (!muscle) return '';
  if (lang !== 'ar') return muscle;
  return MUSCLE_TRANSLATIONS[muscle] || muscle;
}

export const WORKOUT_TITLE_TRANSLATIONS: Record<string, string> = {
  'Push (Chest, Shoulders, Triceps)': 'دفع (صدر، أكتاف، ترايسبس)',
  'Pull (Back, Biceps)': 'سحب (ظهر، بايسبس)',
  'Legs (Quads, Hamstrings)': 'أرجل (فخذ أمامي، فخذ خلفي)',
  'Push Workout': 'تمرين الدفع',
  'Pull Workout': 'تمرين السحب',
  'Legs Workout': 'تمرين الأرجل',
  'Chest Workout': 'تمرين الصدر',
  'Back Workout': 'تمرين الظهر',
  'Shoulders Workout': 'تمرين الأكتاف',
  'Biceps Workout': 'تمرين البايسبس',
  'Triceps Workout': 'تمرين الترايسبس',
  'Forearms Workout': 'تمرين السواعد',
  'Core Workout': 'تمرين البطن والكور',
  'Daily Workout': 'تمرين اليوم',
  'Consolidated daily workout': 'تمرين اليوم المجمع',
  'Auto-generated PPL routine.': 'جدول PPL مولد تلقائياً.'
};

export function translateWorkoutTitle(title: string, lang: Language = 'en'): string {
  if (!title) return '';
  if (lang !== 'ar') return title;

  if (WORKOUT_TITLE_TRANSLATIONS[title]) return WORKOUT_TITLE_TRANSLATIONS[title];

  let translated = title;
  for (const [key, val] of Object.entries(WORKOUT_TITLE_TRANSLATIONS)) {
    if (translated.includes(key)) {
      translated = translated.replace(key, val);
    }
  }
  return translated;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { data, updateSettings } = useData();

  const activeLang: Language = (data?.settings?.language || localStorage.getItem('mygym_lang') || 'en') as Language;

  useEffect(() => {
    localStorage.setItem('mygym_lang', activeLang);
    document.documentElement.setAttribute('lang', activeLang);
    document.documentElement.setAttribute('dir', activeLang === 'ar' ? 'rtl' : 'ltr');
  }, [activeLang]);

  const changeLanguage = async (newLang: Language) => {
    localStorage.setItem('mygym_lang', newLang);
    document.documentElement.setAttribute('lang', newLang);
    document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');

    if (data?.settings) {
      await updateSettings({
        ...data.settings,
        language: newLang
      });
    }
  };

  const t = (key: TranslationKey): string => {
    return getTranslation(activeLang, key);
  };

  return (
    <LanguageContext.Provider value={{
      language: activeLang,
      setLanguage: changeLanguage,
      t,
      isRTL: activeLang === 'ar',
      formatDate: (date, pattern) => formatLocalizedDate(date, pattern, activeLang),
      tExercise: (name) => translateExerciseName(name, activeLang),
      tMuscle: (muscle) => translateMuscle(muscle, activeLang),
      tTitle: (title) => translateWorkoutTitle(title, activeLang)
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if called outside provider
    const storedLang = (localStorage.getItem('mygym_lang') || 'en') as Language;
    return {
      language: storedLang,
      setLanguage: async () => {},
      t: (key: TranslationKey) => getTranslation(storedLang, key),
      isRTL: storedLang === 'ar',
      formatDate: (date: Date | string | number, pattern: string) => formatLocalizedDate(date, pattern, storedLang),
      tExercise: (name: string) => translateExerciseName(name, storedLang),
      tMuscle: (muscle: string) => translateMuscle(muscle, storedLang),
      tTitle: (title: string) => translateWorkoutTitle(title, storedLang)
    };
  }
  return context;
}

