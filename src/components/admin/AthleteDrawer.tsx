import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Dumbbell,
  Flame,
  Layers,
  Scale,
  Trophy,
  Utensils,
  X
} from 'lucide-react';
import { adminCopy } from './copy';
import { formatDate, formatDateTime, formatNumber, initialsOf } from './format';
import { AdminEmptyState, StatusPill, TierBadge } from './AdminPrimitives';
import type { AthleteSummary } from '../../lib/adminData';
import type { PanelProps } from './types';

type TabId = 'workouts' | 'records' | 'planned' | 'meals' | 'weight';

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function AthleteDrawer({
  locale,
  isRTL,
  athlete,
  onClose
}: PanelProps & { athlete: AthleteSummary | null; onClose: () => void }) {
  const [tab, setTab] = useState<TabId>('workouts');
  const [expanded, setExpanded] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!athlete) return;
    setTab('workouts');
    setExpanded(null);
    restoreRef.current = (document.activeElement as HTMLElement) ?? null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => panelRef.current?.focus(), 40);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      const target = restoreRef.current;
      if (target && document.contains(target)) target.focus();
    };
  }, [athlete]);

  const tabs: Array<{ id: TabId; label: string; count: number; icon: typeof Dumbbell }> = athlete
    ? [
        { id: 'workouts', label: adminCopy.tabWorkouts(locale), count: athlete.history.length, icon: Dumbbell },
        { id: 'records', label: adminCopy.tabRecords(locale), count: athlete.personalRecords.length, icon: Trophy },
        { id: 'planned', label: adminCopy.tabPlanned(locale), count: athlete.sessions.length, icon: Calendar },
        { id: 'meals', label: adminCopy.tabMeals(locale), count: athlete.meals.length, icon: Utensils },
        { id: 'weight', label: adminCopy.tabWeight(locale), count: athlete.bodyMetrics.length, icon: Scale }
      ]
    : [];

  return (
    <AnimatePresence>
      {athlete && typeof document !== 'undefined' &&
        createPortal(
          <motion.div
            key="admin-drawer-backdrop"
            className="admin-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            role="presentation"
          >
            <motion.div
              ref={panelRef}
              className="admin-drawer"
              dir={isRTL ? 'rtl' : 'ltr'}
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-drawer-title"
              tabIndex={-1}
              initial={{ x: isRTL ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? '-100%' : '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.stopPropagation();
                  onClose();
                  return;
                }
                if (event.key !== 'Tab') return;
                const nodes = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
                if (nodes.length === 0) return;
                const first = nodes[0];
                const last = nodes[nodes.length - 1];
                const active = document.activeElement as HTMLElement | null;
                if (!event.shiftKey && (active === last || !panelRef.current?.contains(active))) {
                  event.preventDefault();
                  first.focus();
                } else if (event.shiftKey && (active === first || !panelRef.current?.contains(active))) {
                  event.preventDefault();
                  last.focus();
                }
              }}
            >
              <header className="admin-drawer-head">
                <span className="admin-avatar is-lg" aria-hidden="true">
                  {athlete.pfp ? <img src={athlete.pfp} alt="" /> : initialsOf(athlete.name)}
                </span>
                <div className="admin-drawer-identity">
                  <div className="admin-drawer-name-row">
                    <h2 id="admin-drawer-title">{athlete.name}</h2>
                    <TierBadge tier={athlete.tier} locale={locale} />
                  </div>
                  <p className="admin-drawer-mail">{athlete.email}</p>
                  <ul className="admin-drawer-meta">
                    <li>
                      <StatusPill tone="idle" label={`${adminCopy.uidLabel(locale)} ${athlete.uid.slice(0, 10)}`} />
                    </li>
                    <li>
                      <StatusPill tone="ok" label={`${formatNumber(athlete.totalWorkouts, locale)} ${adminCopy.tabWorkouts(locale)}`} icon={<Dumbbell size={12} aria-hidden="true" />} />
                    </li>
                    <li>
                      <StatusPill
                        tone="ok"
                        label={`${formatNumber(athlete.totalTonnage, locale)} ${athlete.weightUnit}`}
                        icon={<Layers size={12} aria-hidden="true" />}
                      />
                    </li>
                    {athlete.latestWeight ? (
                      <li>
                        <StatusPill
                          tone="ok"
                          label={`${athlete.latestWeight} ${athlete.weightUnit}`}
                          icon={<Scale size={12} aria-hidden="true" />}
                        />
                      </li>
                    ) : null}
                  </ul>
                </div>
                <button type="button" className="admin-icon-btn touch-target" onClick={onClose} aria-label={adminCopy.drawerClose(locale)}>
                  <X size={18} aria-hidden="true" />
                </button>
              </header>

              <div
                className="admin-drawer-tabs"
                role="tablist"
                aria-label={adminCopy.drawerTitle(locale)}
                onKeyDown={event => {
                  // Roving focus, so Tab leaves the tablist instead of walking all five
                  // tabs. Direction-aware: ArrowRight moves forward in LTR, backward in RTL.
                  const forward = isRTL ? event.key === 'ArrowLeft' : event.key === 'ArrowRight';
                  const back = isRTL ? event.key === 'ArrowRight' : event.key === 'ArrowLeft';
                  if (!forward && !back && event.key !== 'Home' && event.key !== 'End') return;
                  event.preventDefault();
                  const total = tabs.length;
                  if (total === 0) return;
                  const from = tabs.findIndex(item => item.id === tab);
                  const next =
                    event.key === 'Home' ? 0
                    : event.key === 'End' ? total - 1
                    : ((from < 0 ? 0 : from) + (forward ? 1 : -1) + total) % total;
                  setTab(tabs[next].id);
                  window.requestAnimationFrame(() => {
                    document.getElementById(`admin-drawer-tab-${tabs[next].id}`)?.focus();
                  });
                }}
              >
                {tabs.map((item) => {
                  const Icon = item.icon;
                  const selected = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`admin-drawer-tab-${item.id}`}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-controls="admin-drawer-tabpanel"
                      tabIndex={selected ? 0 : -1}
                      className={`admin-drawer-tab touch-target ${selected ? 'is-active' : ''}`}
                      onClick={() => setTab(item.id)}
                    >
                      <Icon size={14} aria-hidden="true" />
                      <span>{item.label}</span>
                      <em>{item.count}</em>
                    </button>
                  );
                })}
              </div>

              <div className="admin-drawer-body" role="tabpanel" id="admin-drawer-tabpanel" aria-labelledby={`admin-drawer-tab-${tab}`}>
                {tab === 'workouts' &&
                  (athlete.history.length === 0 ? (
                    <AdminEmptyState title={adminCopy.tabWorkouts(locale)} description={adminCopy.emptyTab(locale)} icon={<Dumbbell size={26} aria-hidden="true" />} />
                  ) : (
                    <ul className="admin-records">
                      {athlete.history.map((record) => {
                    const open = expanded === record.id;
                    const exercises = record.snapshot?.exercises ?? [];
                    return (
                      <li key={record.id} className="admin-record">
                        <button
                          type="button"
                          className="admin-record-head"
                          aria-expanded={open}
                          aria-label={open ? adminCopy.collapseWorkout(locale) : adminCopy.expandWorkout(locale)}
                          onClick={() => setExpanded(open ? null : record.id)}
                        >
                          <span className="admin-record-main">
                            <time dateTime={record.date}>{formatDateTime(record.date, locale)}</time>
                            <strong>{record.title}</strong>
                            <span className="admin-record-meta">
                              {record.snapshot?.duration ? <em>{record.snapshot.duration} min</em> : null}
                              {record.burnedCalories ? <em>{formatNumber(record.burnedCalories, locale)} kcal</em> : null}
                              <em>{adminCopy.exercisesCount(locale, exercises.length)}</em>
                            </span>
                          </span>
                          <ChevronDown size={17} aria-hidden="true" className={`admin-chevron ${open ? 'is-open' : ''}`} />
                        </button>
                        {open && (
                          <div className="admin-record-body">
                            {exercises.length === 0 ? (
                              <p className="admin-muted">{adminCopy.emptyTab(locale)}</p>
                            ) : (
                              <ul>
                                {exercises.map((exercise, index) => (
                                  <li key={exercise.id || index} className="admin-exercise">
                                    <div className="admin-exercise-head">
                                      <strong>{exercise.name}</strong>
                                      <span>{exercise.targetMuscle}</span>
                                    </div>
                                    <ul className="admin-set-chips">
                                      {(exercise.sets ?? []).map((set, setIndex) => (
                                        <li key={set.id || setIndex} className={set.isCompleted ? 'is-done' : ''}>
                                          <span className="admin-set-index">{adminCopy.setLabel(locale)} {setIndex + 1}</span>
                                          <span className="admin-set-value">
                                            <strong>{set.weight}</strong> {set.unit || athlete.weightUnit} ×{' '}
                                            <strong>{set.repsActual || set.repsTarget}</strong> {adminCopy.repsLabel(locale)}
                                          </span>
                                          {set.isCompleted && <CheckCircle2 size={13} aria-hidden="true" />}
                                        </li>
                                      ))}
                                    </ul>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                    </ul>
                  ))}

                {tab === 'records' &&
                  (athlete.personalRecords.length === 0 ? (
                    <AdminEmptyState title={adminCopy.tabRecords(locale)} description={adminCopy.emptyTab(locale)} icon={<Trophy size={26} aria-hidden="true" />} />
                  ) : (
                    <ul className="admin-pr-cards">
                      {athlete.personalRecords.map((pr, index) => (
                        <li key={`${pr.exerciseName}-${index}`}>
                          <span className="admin-pr-card-top">
                            <Trophy size={14} aria-hidden="true" />
                            <time dateTime={pr.date}>{formatDate(pr.date, locale)}</time>
                          </span>
                          <strong>{pr.exerciseName}</strong>
                          <span className="admin-pr-card-value">
                            {formatNumber(pr.weight, locale, 1)} <small>{pr.unit}</small>
                            <em>× {pr.reps}</em>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ))}

                {tab === 'planned' &&
                  (athlete.sessions.length === 0 ? (
                    <AdminEmptyState title={adminCopy.tabPlanned(locale)} description={adminCopy.emptyTab(locale)} icon={<Calendar size={26} aria-hidden="true" />} />
                  ) : (
                    <ul className="admin-records">
                      {athlete.sessions.map((session) => (
                        <li key={session.id} className="admin-record is-static">
                          <time dateTime={session.date}>{formatDate(session.date, locale)}</time>
                          <strong>{session.title}</strong>
                          <span className="admin-record-meta">
                            <em>{adminCopy.exercisesCount(locale, session.exercises?.length ?? 0)}</em>
                            {session.duration ? <em>{session.duration} min</em> : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ))}

                {tab === 'meals' &&
                  (athlete.meals.length === 0 ? (
                    <AdminEmptyState title={adminCopy.tabMeals(locale)} description={adminCopy.emptyTab(locale)} icon={<Utensils size={26} aria-hidden="true" />} />
                  ) : (
                    <ul className="admin-meal-list">
                      {athlete.meals.map((meal) => (
                        <li key={meal.id} className="admin-meal-row">
                          <span className={`admin-meal-chip is-${meal.mealType}`}>{meal.mealType}</span>
                          <span className="admin-meal-body">
                            <strong>{meal.title}</strong>
                            <span className="admin-meal-macros">
                              <em>P {formatNumber(meal.protein, locale)}g</em>
                              <em>C {formatNumber(meal.carbs, locale)}g</em>
                              <em>F {formatNumber(meal.fats, locale)}g</em>
                            </span>
                          </span>
                          <span className="admin-meal-kcal">
                            <Flame size={13} aria-hidden="true" />
                            {formatNumber(meal.calories, locale)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ))}

                {tab === 'weight' &&
                  (athlete.bodyMetrics.length === 0 ? (
                    <AdminEmptyState title={adminCopy.tabWeight(locale)} description={adminCopy.emptyTab(locale)} icon={<Scale size={26} aria-hidden="true" />} />
                  ) : (
                    <ul className="admin-records">
                      {athlete.bodyMetrics.map((entry) => (
                        <li key={entry.id} className="admin-record is-static">
                          <time dateTime={entry.date}>{formatDate(entry.date, locale)}</time>
                          <strong>
                            {entry.weight} {entry.unit}
                          </strong>
                          {entry.bodyFat ? (
                            <span className="admin-record-meta">
                              <em>
                                {adminCopy.bodyFat(locale)}: {entry.bodyFat}%
                              </em>
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ))}
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
    </AnimatePresence>
  );
}
