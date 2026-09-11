import { useState } from 'react';
import { format } from 'date-fns';
import { Activity, Flame, Trophy, CheckCircle, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../hooks/useData';

export function HistoryView() {
  const { data } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!data) return null;

  const historyItems = data.history.slice().reverse();
  const totalCompleted = historyItems.length;
  const streak = totalCompleted > 0 ? 3 : 0; // Mock streak
  const totalSessionsThisWeek = data.sessions.length;
  const completedThisWeek = data.sessions.filter(s => s.isCompleted).length;
  const completionPercentage = totalSessionsThisWeek === 0 ? 0 : Math.round((completedThisWeek / totalSessionsThisWeek) * 100);

  const filteredHistory = historyItems.filter(entry => 
    entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    entry.snapshot?.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex-col h-full"
    >
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Progress & History</h1>
        <p style={{ margin: 0 }}>Track your workout achievements over time</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '50%' }}>
            <Activity className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{totalCompleted}</div>
            <div style={{ color: 'var(--text-secondary)' }}>Total Workouts</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '50%' }}>
            <Flame className="w-8 h-8" style={{ color: 'var(--warning)' }} />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{streak}</div>
            <div style={{ color: 'var(--text-secondary)' }}>Day Streak</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '50%' }}>
            <Trophy className="w-8 h-8" style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{completionPercentage}%</div>
            <div style={{ color: 'var(--text-secondary)' }}>Weekly Completion</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Recent Activity</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search workouts..." 
            className="input" 
            style={{ paddingLeft: '2.25rem', width: '250px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {!filteredHistory.length ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No history found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredHistory.map((entry, idx) => (
              <div key={entry.id} style={{ borderBottom: idx === filteredHistory.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                <div 
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '1rem 1.5rem',
                    cursor: 'pointer',
                    backgroundColor: expandedId === entry.id ? 'var(--bg-tertiary)' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {entry.title || 'Workout Session'}
                      {entry.snapshot?.type && (
                        <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', fontWeight: 500 }}>
                          {entry.snapshot.type}
                        </span>
                      )}
                    </h4>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {format(new Date(entry.date), 'MMMM d, yyyy • h:mm a')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--success)', fontWeight: 500, gap: '0.5rem' }}>
                      <CheckCircle className="w-4 h-4" /> Completed
                    </div>
                    {expandedId === entry.id ? <ChevronUp className="w-5 h-5 text-muted" /> : <ChevronDown className="w-5 h-5 text-muted" />}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === entry.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-tertiary)', borderTop: '1px dashed var(--border-color)' }}>
                        {entry.snapshot?.exercises?.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {entry.snapshot.exercises.map((ex: any) => (
                              <div key={ex.id}>
                                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{ex.name}</h5>
                                <table style={{ width: '100%', fontSize: '0.875rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ color: 'var(--text-muted)' }}>
                                      <th style={{ padding: '0.25rem 0' }}>Set</th>
                                      <th style={{ padding: '0.25rem 0' }}>Weight</th>
                                      <th style={{ padding: '0.25rem 0' }}>Reps (Actual/Target)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ex.sets.map((set: any, sIdx: number) => (
                                      <tr key={set.id}>
                                        <td style={{ padding: '0.25rem 0' }}>{sIdx + 1}</td>
                                        <td style={{ padding: '0.25rem 0' }}>{set.weight} {set.unit}</td>
                                        <td style={{ padding: '0.25rem 0' }}>{set.repsActual} / {set.repsTarget}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No exercise data recorded for this session.</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
