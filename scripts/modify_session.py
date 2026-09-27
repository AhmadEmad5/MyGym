import sys

file_path = r'c:\Users\ahmad\OneDrive\Desktop\Projects\MyGym\src\views\SessionDetailView.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove imports
content = content.replace("import { RestTimerFloatingBar } from '../components/RestTimerFloatingBar';\n", "")
content = content.replace("import { useBluetoothHeartRate, bluetoothHeartRate, ZONE_CONFIG } from '../lib/bluetoothHeartRate';\n", "")
content = content.replace("import { CelebrationSummaryModal } from '../components/CelebrationSummaryModal';\n", "")

# 2. Modify handleFinishWorkout
start_str = "  const handleFinishWorkout = async () => {"
end_str = "    navigate('/today');\n  };"
start_idx = content.find(start_str)
if start_idx != -1:
    end_idx = content.find(end_str, start_idx)
    if end_idx != -1:
        end_idx += len(end_str)
        replacement = '''  const handleFinishWorkout = async () => {
    if (!session) return;
    const updatedSession = { ...session, isCompleted: true };
    
    const historyRecord = await finishWorkoutSession(updatedSession);
    const burnedCalories = historyRecord?.burnedCalories || estimateWorkoutCalories(updatedSession);

    if (saveInsights && updatedSession.exercises) {
      const cardioExercises = updatedSession.exercises.filter(e => e.targetMuscle === 'Cardio' && ((e.duration || 0) > 0 || (e.notes && e.notes.includes('[Cardio:')) || (e.distanceKm || 0) > 0 || (e.caloriesBurned || 0) > 0));
      if (cardioExercises.length > 0) {
        const currentInsights = data?.insights || { cardioLogs: [], connectedDevices: [] };
        const newLogs = cardioExercises.map((cx, idx) => ({
          id: `cardio-finish-${session.id}-${idx}`,
          date: new Date().toISOString(),
          activity: cx.name,
          durationMinutes: cx.duration || 15,
          distanceKm: cx.distanceKm,
          calories: cx.caloriesBurned || Math.round((cx.duration || 15) * 8.5),
          averageHeartRate: undefined,
          pace: cx.pace,
          source: (cx.imageUrl ? 'camera' : 'manual') as 'camera' | 'manual',
          aiSummary: `${session.title} · ${cx.name}${cx.distanceKm ? ` (${cx.distanceKm} km)` : ''}${cx.caloriesBurned ? ` (${cx.caloriesBurned} kcal)` : ''}`
        }));
        const filteredPrior = (currentInsights.cardioLogs || []).filter(l => !l.id.includes(session.id));
        saveInsights({
          ...currentInsights,
          cardioLogs: [...newLogs, ...filteredPrior].slice(0, 60)
        });
      }
    }

    gymAudio.triggerDualPulseHaptic();
    notify(
      isRTL 
        ? `اكتمل التمرين بنجاح! تم حرق ~${burnedCalories} سعرة 🏆` 
        : `Workout completed! Burned ~${burnedCalories} kcal 🏆`, 
      'success'
    );
    navigate('/today', { replace: true });
  };'''
        content = content[:start_idx] + replacement + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Script finished')
