import { useState } from 'react';
import { addDays, format, isSameDay } from 'date-fns';
import { Plus, Trash2, ChevronLeft, ChevronRight, Moon, Dumbbell, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { WorkoutSession, SessionExercise } from '../lib/api';
import { useData } from '../hooks/useData';
import { Modal } from '../components/Modal';

export function CalendarView() {
  const { data, updateData } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();
  
  // Modal state for NEW sessions only
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Partial<WorkoutSession> | null>(null);

  if (!data) return null;

  // Start from the specific selected date (defaulting to today)
  const startDate = new Date(currentDate);
  startDate.setHours(0, 0, 0, 0);
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    
    // Friday (5) is a rest day, prevent saving
    if (editingSession?.date && new Date(editingSession.date).getDay() === 5) {
      alert("Fridays are strictly rest days! Please choose another day.");
      return;
    }

    const newSession = {
      ...editingSession,
      id: editingSession?.id || Date.now().toString(),
      isCompleted: editingSession?.isCompleted || false,
      exercises: editingSession?.exercises || [],
    } as WorkoutSession;

    const newData = { ...data };
    if (editingSession?.id) {
      newData.sessions = newData.sessions.map(s => s.id === newSession.id ? newSession : s);
    } else {
      newData.sessions.push(newSession);
    }
    
    await updateData(newData);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!data) return;
    if (!confirm('Delete this session?')) return;
    
    const newData = { ...data, sessions: data.sessions.filter(s => s.id !== id) };
    await updateData(newData);
  };


  const openNewModal = (dayDate?: Date) => {
    let defaultDate = new Date();
    if (dayDate) {
      defaultDate = new Date(dayDate);
    }
    
    // Friday (5) is a rest day, default to Saturday instead
    if (defaultDate.getDay() === 5) {
      defaultDate = addDays(defaultDate, 1);
    }
    
    defaultDate.setHours(18, 0, 0, 0);
    const dateStr = new Date(defaultDate.getTime() - (defaultDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

    setEditingSession({
      title: '',
      type: 'Strength',
      date: dateStr,
      duration: 60,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const generatePPL = async () => {
    if (!data) return;
    
    // We map days of week:
    // 0: Sunday (Pull), 1: Monday (Legs), 2: Tuesday (Push), 3: Wednesday (Pull), 4: Thursday (Legs), 5: Friday (Rest), 6: Saturday (Push)
    const newSessions: WorkoutSession[] = [];
    const baseDate = new Date();
    baseDate.setHours(18, 0, 0, 0); // 6:00 PM default time

    for (let i = 0; i < 28; i++) { // 4 weeks
      const d = addDays(baseDate, i);
      const dayOfWeek = d.getDay();
      
      if (dayOfWeek === 5) continue; // Friday is Rest
      
      let title = '';
      let exercises: SessionExercise[] = [];
      
      if (dayOfWeek === 6 || dayOfWeek === 2) {
        title = 'Push (Chest, Shoulders, Triceps)';
        exercises = [
          { id: Date.now()+Math.random()+'', name: 'Bench Press', targetMuscle: 'Chest', restTime: 90, notes: '', videoUrl: 'https://www.youtube.com/embed/5SSdbmIjNj4', sets: [{id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}] },
          { id: Date.now()+Math.random()+'', name: 'Overhead Press', targetMuscle: 'Shoulders', restTime: 90, notes: '', videoUrl: 'https://www.youtube.com/embed/NW_y9yEZq34', sets: [{id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}] },
          { id: Date.now()+Math.random()+'', name: 'Tricep Pushdown', targetMuscle: 'Triceps', restTime: 60, notes: '', videoUrl: 'https://www.youtube.com/embed/u36jNfqh8_U', sets: [{id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}] }
        ];
      } else if (dayOfWeek === 0 || dayOfWeek === 3) {
        title = 'Pull (Back, Biceps)';
        exercises = [
          { id: Date.now()+Math.random()+'', name: 'Pull-Ups', targetMuscle: 'Back', restTime: 90, notes: '', sets: [{id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false}] },
          { id: Date.now()+Math.random()+'', name: 'Barbell Row', targetMuscle: 'Back', restTime: 90, notes: '', sets: [{id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}] },
          { id: Date.now()+Math.random()+'', name: 'Bicep Curls', targetMuscle: 'Biceps', restTime: 60, notes: '', sets: [{id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}] }
        ];
      } else if (dayOfWeek === 1 || dayOfWeek === 4) {
        title = 'Legs (Quads, Hamstrings)';
        exercises = [
          { id: Date.now()+Math.random()+'', name: 'Squats', targetMuscle: 'Legs', restTime: 120, notes: '', sets: [{id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false}] },
          { id: Date.now()+Math.random()+'', name: 'Leg Press', targetMuscle: 'Legs', restTime: 90, notes: '', sets: [{id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}] },
          { id: Date.now()+Math.random()+'', name: 'Calf Raises', targetMuscle: 'Calves', restTime: 60, notes: '', sets: [{id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false}] }
        ];
      }

      const dateStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      
      newSessions.push({
        id: Date.now().toString() + i,
        title,
        date: dateStr,
        duration: 60,
        type: 'Strength',
        notes: 'Auto-generated PPL routine.',
        isCompleted: false,
        exercises
      });
    }

    const newData = { ...data, sessions: [...data.sessions, ...newSessions] };
    await updateData(newData);
  };

  const applyTemplate = (templateName: string) => {
    let exercises: SessionExercise[] = [];
    
    if (templateName === 'Push Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Barbell Bench Press', targetMuscle: 'Chest', restTime: 120, notes: 'Keep feet firmly planted and squeeze your shoulder blades together to create a solid base.', videoUrl: 'https://www.youtube.com/embed/5SSdbmIjNj4', sets: [
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
    }

    setEditingSession(prev => ({
      ...prev,
      title: templateName,
      type: 'Strength',
      exercises
    }));
  };

  const getTypeColor = (type: string | undefined, title: string) => {
    const t = title.toLowerCase();
    if (t.includes('push')) return 'var(--accent-cyan)';
    if (t.includes('cardio') || type === 'Cardio') return 'var(--accent-green)';
    if (t.includes('pull')) return 'var(--accent-purple)';
    if (t.includes('leg')) return 'var(--accent-yellow)';
    return 'var(--accent-primary)';
  };

  const getTargetMusclesText = (exercises?: SessionExercise[]) => {
    if (!exercises || exercises.length === 0) return '';
    const muscles = exercises.map(e => e.targetMuscle).filter(Boolean);
    const unique = [...new Set(muscles)];
    if (unique.length === 0) return '';
    return unique.join(' • ');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex-col h-full" 
      style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '1200px', margin: '0 auto' }}
    >
      {/* Header Area */}
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem', fontSize: '2.5rem' }}>Weekly Calendar</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>{format(startDate, 'MMMM yyyy')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '2rem', padding: '0.25rem', border: '1px solid var(--border-color)' }}>
            <button className="btn-icon btn-ghost" style={{ padding: '0.5rem 1rem', borderRadius: '2rem' }} onClick={() => setCurrentDate(d => addDays(d, -7))}><ChevronLeft className="w-4 h-4" /></button>
            <button className="btn-icon btn-ghost" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: '2rem' }} onClick={() => setCurrentDate(new Date())}>Today</button>
            <button className="btn-icon btn-ghost" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: '2rem' }} onClick={() => setCurrentDate(d => addDays(d, -7))}>Past days</button>
            <button className="btn-icon btn-ghost" style={{ padding: '0.5rem 1rem', borderRadius: '2rem' }} onClick={() => setCurrentDate(d => addDays(d, 7))}><ChevronRight className="w-4 h-4" /></button>
          </div>
          <button className="btn btn-primary" onClick={() => openNewModal()}>
            <Plus className="w-5 h-5" /> Add Session
          </button>
        </div>
      </div>

      {data?.sessions.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)', margin: '0 0 1rem 0' }}>
          <h2 style={{ marginBottom: '1rem' }}>Ready to get started?</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>You don't have any workouts scheduled yet. We can automatically generate a 4-week <strong>Push-Pull-Legs</strong> routine for you (resting on Fridays).</p>
          <button className="btn btn-primary" onClick={generatePPL}>Generate PPL Routine</button>
        </div>
      )}

      {/* Calendar List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto', paddingRight: '0.5rem', paddingBottom: '2rem' }}>
        {weekDays.map(day => {
          const isToday = isSameDay(day, new Date());
          const daySessions = data?.sessions.filter(s => isSameDay(new Date(s.date), day)) || [];

          return (
            <div key={day.toISOString()} className="calendar-day-row" style={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', borderRadius: '1.25rem', border: '1px solid var(--border-color)', padding: '1.5rem', minHeight: '140px', flexShrink: 0 }}>
              
              {/* Left Date Column */}
              <div className="calendar-date-col" style={{ minWidth: '100px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', paddingRight: '1.5rem', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color: isToday ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  {format(day, 'EEEE')}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 700, color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)', lineHeight: 1 }}>
                    {format(day, 'dd')}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {format(day, 'MMM').toUpperCase()}
                  </span>
                </div>
                {isToday && (
                  <div style={{ marginTop: '0.5rem', backgroundColor: 'rgba(14, 165, 233, 0.1)', color: 'var(--accent-primary)', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '1rem', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                    TODAY
                  </div>
                )}
              </div>

              {/* Sessions Area */}
              <div 
                className="hide-scrollbar calendar-sessions-area"
                style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1rem', flex: 1, paddingLeft: '1.5rem', alignItems: 'stretch', alignContent: 'flex-start' }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  
                  // Friday is a rest day, no sessions allowed
                  if (day.getDay() === 5) {
                    alert("Fridays are strictly rest days! You cannot move a session here.");
                    return;
                  }

                  const sessionId = e.dataTransfer.getData('text/plain');
                  if (sessionId && data) {
                    const sessionToMove = data.sessions.find(s => s.id === sessionId);
                    if (sessionToMove) {
                      const oldDate = new Date(sessionToMove.date);
                      const newDate = new Date(day);
                      newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);
                      const dateStr = new Date(newDate.getTime() - (newDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                      
                      const updatedSession = { ...sessionToMove, date: dateStr };
                      
                      // Move to the end of the selected day
                      const newSessions = data.sessions.filter(s => s.id !== sessionId);
                      newSessions.push(updatedSession);
                      
                      const newData = { ...data, sessions: newSessions };
                      await updateData(newData);
                    }
                  }
                }}
              >
                {day.getDay() === 5 && daySessions.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '1rem 1.5rem', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', backgroundColor: 'rgba(14, 165, 233, 0.1)', borderRadius: '50%', marginRight: '1rem' }}>
                      <Moon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                      REST DAY — skip the gym and let your body recover today.
                    </span>
                  </div>
                ) : (
                  <>
                    <AnimatePresence>
                      {daySessions.map((session: WorkoutSession) => {
                        const typeColor = getTypeColor(session.type, session.title);
                        const muscles = getTargetMusclesText(session.exercises);

                        return (
                          <motion.div 
                            layout
                            draggable={true}
                            onDragStart={(e: any) => {
                              e.dataTransfer.setData('text/plain', session.id);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragOver={(e: any) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={async (e: any) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              if (day.getDay() === 5) {
                                alert("Fridays are strictly rest days! You cannot move a session here.");
                                return;
                              }

                              const draggedSessionId = e.dataTransfer.getData('text/plain');
                              const targetSessionId = session.id;
                              
                              if (draggedSessionId === targetSessionId || !data) return;

                              const draggedSession = data.sessions.find(s => s.id === draggedSessionId);
                              if (!draggedSession) return;
                              
                              const oldDate = new Date(draggedSession.date);
                              const newDate = new Date(day);
                              newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);
                              const dateStr = new Date(newDate.getTime() - (newDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                              
                              const updatedSession = { ...draggedSession, date: dateStr };
                              
                              // Remove dragged session
                              const newSessions = data.sessions.filter(s => s.id !== draggedSessionId);
                              
                              // Find index of target session in the new array
                              let spliceIndex = newSessions.findIndex(s => s.id === targetSessionId);
                              if (spliceIndex === -1) spliceIndex = newSessions.length;
                              
                              // Insert dragged session before the target session
                              newSessions.splice(spliceIndex, 0, updatedSession);

                              await updateData({ ...data, sessions: newSessions });
                            }}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            key={session.id} 
                            onClick={() => navigate(`/session/${session.id}`)}
                            className="calendar-session-card"
                            style={{ 
                              minWidth: '320px',
                              maxWidth: '400px',
                              flex: 1,
                              padding: '1.25rem', 
                              cursor: 'pointer',
                              borderRadius: '1rem', 
                              backgroundColor: 'var(--bg-tertiary)',
                              border: '1px solid rgba(255,255,255,0.03)',
                              borderLeft: `3px solid ${typeColor}`,
                              opacity: session.isCompleted ? 0.7 : 1,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.75rem',
                              flexShrink: 0
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: typeColor }} />
                                <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>{session.title}</h3>
                              </div>
                              <div style={{ backgroundColor: `${typeColor}15`, color: typeColor, padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, border: `1px solid ${typeColor}30` }}>
                                {format(new Date(session.date), 'h:mm a')}
                              </div>
                            </div>
                            
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', minHeight: '1.25rem' }}>
                              {muscles || (session.exercises?.length ? 'Multiple muscles' : 'No exercises')}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                <Clock className="w-3.5 h-3.5" />
                                <span>{session.duration} min</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                <Dumbbell className="w-3.5 h-3.5" />
                                <span>{session.exercises?.length || 0} exercises</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <button 
                        onClick={() => openNewModal(day)}
                        className="btn-ghost calendar-add-btn" 
                        style={{ minWidth: '200px', height: '110px', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.01)', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          <Plus className="w-5 h-5" />
                        </div>
                        <span style={{ fontSize: '0.85rem' }}>Add session</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal remains the same */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSession?.id ? 'Edit Session' : 'New Session'}>
        <form onSubmit={handleSaveSession} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {!editingSession?.id && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Quick Templates</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => applyTemplate('Push Workout')}>Push</button>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => applyTemplate('Pull Workout')}>Pull</button>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => applyTemplate('Legs Workout')}>Legs</button>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Title</label>
            <input required type="text" className="input" value={editingSession?.title || ''} onChange={e => setEditingSession(prev => ({ ...prev, title: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Date & Time</label>
              <input required type="datetime-local" className="input" value={editingSession?.date || ''} onChange={e => setEditingSession(prev => ({ ...prev, date: e.target.value }))} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Duration (min)</label>
              <input required type="number" min="1" className="input" value={editingSession?.duration || 60} onChange={e => setEditingSession(prev => ({ ...prev, duration: parseInt(e.target.value) }))} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Type</label>
            <select className="input" value={editingSession?.type || 'Strength'} onChange={e => setEditingSession(prev => ({ ...prev, type: e.target.value }))}>
              <option>Strength</option>
              <option>Cardio</option>
              <option>Yoga</option>
              <option>HIIT</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Notes</label>
            <textarea className="input" rows={3} value={editingSession?.notes || ''} onChange={e => setEditingSession(prev => ({ ...prev, notes: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            {editingSession?.id ? (
              <button type="button" className="btn-icon btn-ghost" onClick={() => handleDelete(editingSession.id!)} style={{ color: 'var(--danger)' }}>
                <Trash2 className="w-5 h-5" />
              </button>
            ) : <div />}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
