import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { ArrowLeft, Plus, Check, Play, Square, Trash2, GripVertical } from 'lucide-react';
import { WorkoutSession, SetRecord, SessionExercise } from '../lib/api';
import { useData } from '../hooks/useData';

function ExerciseCard({ 
  exercise, 
  exIndex, 
  updateSet, 
  addSet 
}: { 
  exercise: SessionExercise, 
  exIndex: number, 
  updateSet: (exIndex: number, setIndex: number, field: keyof SetRecord, value: any) => void,
  addSet: (exIndex: number) => void
}) {
  return (
    <Reorder.Item 
      value={exercise}
      className="card" 
      style={{ backgroundColor: 'var(--bg-tertiary)', cursor: 'grab' }}
      whileDrag={{ scale: 1.02, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', padding: '0.25rem' }}
            title="Drag to reorder"
          >
            <GripVertical className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{exercise.name}</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{exercise.targetMuscle}</p>
          </div>
        </div>
      </div>

      {exercise.videoUrl && (
        <div style={{ marginBottom: '1.5rem', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#000', aspectRatio: '16/9' }}>
          <iframe 
            width="100%" 
            height="100%" 
            src={exercise.videoUrl} 
            title={`${exercise.name} Video Tutorial`}
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            style={{ display: 'block' }}
          ></iframe>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '1rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <th style={{ padding: '0.5rem 0', width: '3rem' }}>Set</th>
            <th style={{ padding: '0.5rem' }}>Weight</th>
            <th style={{ padding: '0.5rem' }}>Reps</th>
            <th style={{ padding: '0.5rem', width: '3rem', textAlign: 'center' }}>Done</th>
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
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>

      <button className="btn-ghost" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', color: 'var(--accent-primary)', fontWeight: 500 }} onClick={() => addSet(exIndex)}>
        <Plus className="w-4 h-4" /> Add Set
      </button>
    </Reorder.Item>
  );
}

export function SessionDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, updateData } = useData();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  
  // Timer state
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  
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
      // Play a sound or show notification
      setActiveTimer(null);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const handleUpdateSession = async (updatedSession: WorkoutSession) => {
    if (!data) return;
    const newData = { ...data, sessions: data.sessions.map(s => s.id === updatedSession.id ? updatedSession : s) };
    await updateData(newData);
    setSession(updatedSession);
  };

  const addSet = (exerciseIndex: number) => {
    if (!session) return;
    const ex = session.exercises[exerciseIndex];
    const newSet: SetRecord = {
      id: Math.random().toString(36).substring(7),
      repsTarget: 10,
      repsActual: 10,
      weight: 0,
      unit: data?.settings?.weightUnit || 'lb',
      isCompleted: false
    };
    
    // Copy from previous set if exists
    if (ex.sets.length > 0) {
      const lastSet = ex.sets[ex.sets.length - 1];
      newSet.repsTarget = lastSet.repsTarget;
      newSet.repsActual = lastSet.repsActual;
      newSet.weight = lastSet.weight;
      newSet.unit = lastSet.unit;
    }

    const updatedSession = { ...session };
    updatedSession.exercises[exerciseIndex].sets.push(newSet);
    handleUpdateSession(updatedSession);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof SetRecord, value: any) => {
    if (!session) return;
    const updatedSession = { ...session };
    const set = updatedSession.exercises[exerciseIndex].sets[setIndex];
    
    if (field === 'isCompleted' && value === true && !set.isCompleted) {
      // Start rest timer if newly completed
      setActiveTimer(updatedSession.exercises[exerciseIndex].restTime || 90);
    }
    
    (updatedSession.exercises[exerciseIndex].sets[setIndex] as any)[field] = value;
    handleUpdateSession(updatedSession);
  };

  const handleReorderExercises = (newExercises: SessionExercise[]) => {
    if (!session) return;
    const updatedSession = { ...session, exercises: newExercises };
    setSession(updatedSession);
    handleUpdateSession(updatedSession);
  };

  if (!session) return <div>Loading...</div>;

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
      className="flex-col h-full"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '2rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-icon btn-ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 style={{ margin: 0 }}>{session.title}</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{new Date(session.date).toLocaleDateString()}</p>
          </div>
        </div>
        <button 
          className="btn-icon btn-ghost" 
          onClick={async () => {
            if (confirm('Delete this session?')) {
              if (data) {
                const newData = { ...data, sessions: data.sessions.filter(s => s.id !== session.id) };
                await updateData(newData);
                navigate(-1);
              }
            }
          }} 
          style={{ color: 'var(--danger)' }}
          title="Delete Session"
        >
          <Trash2 className="w-5 h-5" />
        </button>
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
              <span style={{ fontWeight: 600 }}>Rest Timer Active</span>
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

      <Reorder.Group 
        axis="y" 
        values={session.exercises || []} 
        onReorder={handleReorderExercises} 
        style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1, overflowY: 'auto', listStyle: 'none', padding: 0, margin: 0 }}
      >
        {session.exercises?.map((exercise, exIndex) => (
          <ExerciseCard 
            key={exercise.id} 
            exercise={exercise} 
            exIndex={exIndex} 
            updateSet={updateSet} 
            addSet={addSet} 
          />
        ))}
      </Reorder.Group>
    </motion.div>
  );
}
