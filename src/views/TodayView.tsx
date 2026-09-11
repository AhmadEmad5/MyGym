import { useNavigate } from 'react-router-dom';
import { format, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, CheckCircle, Circle, Play } from 'lucide-react';
import { useData } from '../hooks/useData';

export function TodayView() {
  const { data, updateData } = useData();
  const navigate = useNavigate();

  if (!data) return null;

  const today = new Date();
  const todaySessions = data.sessions.filter(s => isSameDay(new Date(s.date), today));

  const toggleComplete = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data) return;
    const newData = {
      ...data,
      sessions: data.sessions.map(s => s.id === id ? { ...s, isCompleted: !currentStatus } : s)
    };
    
    if (!currentStatus) {
      const session = data.sessions.find(s => s.id === id);
      if (session) {
        newData.history.push({
          id: Date.now().toString(),
          sessionId: id,
          date: new Date().toISOString(),
          title: session.title,
          // Save the full snapshot for history
          snapshot: session
        });
      }
    } else {
      // Remove from history if unchecked
      newData.history = newData.history.filter(h => h.sessionId !== id || !isSameDay(new Date(h.date), today));
    }

    await updateData(newData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex-col h-full"
    >
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Today</h1>
        <p style={{ margin: 0 }}>{format(today, 'EEEE, MMMM do, yyyy')}</p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {todaySessions.length === 0 ? (
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <CalendarIcon className="w-16 h-16" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h2>No workouts scheduled for today</h2>
            <p>Enjoy your rest day, or schedule a new session!</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/calendar')}>
              Go to Calendar
            </button>
          </div>
        ) : (
          todaySessions.map(session => (
            <motion.div 
              layoutId={`session-${session.id}`}
              key={session.id}
              className="card"
              style={{ 
                borderLeft: `4px solid ${session.isCompleted ? 'var(--success)' : 'var(--accent-primary)'}`,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                opacity: session.isCompleted ? 0.7 : 1
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate(`/session/${session.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {session.title}
                  </h2>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                    <span>{format(new Date(session.date), 'h:mm a')}</span>
                    <span>{session.duration} min</span>
                    <span style={{ padding: '0.1rem 0.4rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                      {session.type}
                    </span>
                  </div>
                </div>
                <button 
                  className="btn-icon btn-ghost" 
                  onClick={(e) => toggleComplete(session.id, session.isCompleted, e)}
                  style={{ padding: '0.5rem' }}
                >
                  {session.isCompleted ? <CheckCircle className="w-8 h-8" style={{color: 'var(--success)'}} /> : <Circle className="w-8 h-8" />}
                </button>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {session.exercises?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Workout Overview</h3>
                    {session.exercises.map((ex, i) => (
                      <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <div style={{ width: '20px', color: 'var(--text-muted)' }}>{i + 1}.</div>
                        <div style={{ fontWeight: 500 }}>{ex.name}</div>
                        <div style={{ color: 'var(--text-muted)' }}>• {ex.sets.length} sets</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No exercises added yet.</div>
                )}
              </div>

              {!session.isCompleted && (
                <div style={{ marginTop: '1.5rem' }}>
                  <button className="btn btn-primary w-full" onClick={(e) => { e.stopPropagation(); navigate(`/session/${session.id}`); }}>
                    <Play className="w-5 h-5" /> Start Workout
                  </button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
