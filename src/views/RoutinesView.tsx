import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Routine } from '../lib/api';
import { useData } from '../hooks/useData';
import { Modal } from '../components/Modal';

export function RoutinesView() {
  const { data, updateData } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Partial<Routine> | null>(null);

  if (!data) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    const newRoutine = {
      ...editingRoutine,
      id: editingRoutine?.id || Date.now().toString(),
      exercises: editingRoutine?.exercises || []
    } as Routine;

    const newData = { ...data };
    if (editingRoutine?.id) {
      newData.routines = newData.routines.map(r => r.id === newRoutine.id ? newRoutine : r);
    } else {
      newData.routines.push(newRoutine);
    }

    await updateData(newData);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!data) return;
    if (!confirm('Delete this routine?')) return;
    
    const newData = { ...data, routines: data.routines.filter(r => r.id !== id) };
    await updateData(newData);
  };

  const openModal = (routine?: Routine) => {
    setEditingRoutine(routine || { name: '', description: '' });
    setIsModalOpen(true);
  };

  const generateDefaultTemplates = async () => {
    if (!data) return;

    const pushRoutine: Routine = {
      id: Date.now().toString() + '1',
      name: 'Push Workout',
      description: 'Focuses on Chest, Shoulders, and Triceps.',
      exercises: [
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
      ]
    };

    const pullRoutine: Routine = {
      id: Date.now().toString() + '2',
      name: 'Pull Workout',
      description: 'Focuses on Back and Biceps.',
      exercises: [
        { id: Date.now()+Math.random()+'', name: 'Cable Lat Pulldown', targetMuscle: 'Back', restTime: 90, notes: 'Think about pulling your elbows down to your back pockets rather than just pulling with your hands.', videoUrl: 'https://www.youtube.com/embed/5s6KGLTMgoI', sets: [
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
      ]
    };

    const legsRoutine: Routine = {
      id: Date.now().toString() + '3',
      name: 'Legs Workout',
      description: 'Focuses on Quads, Hamstrings, and Calves.',
      exercises: [
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
      ]
    };

    const newData = { ...data, routines: [...data.routines, pushRoutine, pullRoutine, legsRoutine] };
    await updateData(newData);
  };

  return (
    <div className="flex-col h-full" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem', fontSize: '2.5rem' }}>Routines Library</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Manage your workout templates</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus className="w-5 h-5" /> Add Routine
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {!data?.routines.length ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '1.25rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Empty Library</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>No routines found. Create your first workout template, or generate the default PPL (Push, Pull, Legs) routines!</p>
            <button className="btn btn-primary" onClick={generateDefaultTemplates}>
              Generate Default PPL Routines
            </button>
          </div>
        ) : (
          data.routines.map(routine => (
            <div key={routine.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>{routine.name}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-icon btn-ghost" onClick={() => openModal(routine)}>
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="btn-icon btn-ghost" onClick={() => handleDelete(routine.id)} style={{ color: 'var(--danger)' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p style={{ flex: 1 }}>{routine.description}</p>
              <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {routine.exercises.length} exercises
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRoutine?.id ? 'Edit Routine' : 'New Routine'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name</label>
            <input 
              required
              type="text" 
              className="input" 
              value={editingRoutine?.name || ''}
              onChange={e => setEditingRoutine(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
            <textarea 
              className="input" 
              rows={3}
              value={editingRoutine?.description || ''}
              onChange={e => setEditingRoutine(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Routine</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
