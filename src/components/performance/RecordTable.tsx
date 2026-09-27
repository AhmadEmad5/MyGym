import type { PersonalRecord } from '../../lib/api';

interface RecordTableProps {
  records: PersonalRecord[];
  emptyTitle: string;
  emptyDescription: string;
  labels?: {
    exercise: string;
    bestSet: string;
    oneRm: string;
    date: string;
  };
}

export function RecordTable({ records, emptyTitle, emptyDescription, labels }: RecordTableProps) {
  const tableLabels = labels || { exercise: 'Exercise', bestSet: 'Best set', oneRm: 'Est. 1RM', date: 'Date' };
  if (records.length === 0) {
    return (
      <div className="forma-ledger-empty">
        <strong>{emptyTitle}</strong>
        <span>{emptyDescription}</span>
      </div>
    );
  }

  return (
    <div className="forma-record-table-wrap">
      <table className="forma-record-table">
        <thead>
          <tr>
            <th>{tableLabels.exercise}</th>
            <th>{tableLabels.bestSet}</th>
            <th>{tableLabels.oneRm}</th>
            <th>{tableLabels.date}</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={`${record.exerciseName}-${record.date}`}>
              <th scope="row">{record.exerciseName}</th>
              <td className="tabular-nums">{record.maxWeight} {record.unit} × {record.reps}</td>
              <td className="tabular-nums">{record.estimated1RM} {record.unit}</td>
              <td className="tabular-nums">{new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
