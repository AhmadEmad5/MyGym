import type { PersonalRecord } from '../../lib/api';

interface RecordTableProps {
  records: PersonalRecord[];
  emptyTitle: string;
  emptyDescription: string;
  title?: string;
  caption?: string;
  isRTL?: boolean;
  labels?: {
    exercise: string;
    bestSet: string;
    oneRm: string;
    date: string;
  };
}

const DEFAULT_LABELS = { exercise: 'Exercise', bestSet: 'Best set', oneRm: 'Est. 1RM', date: 'Date' };

function formatRecordDate(value: string, isRTL: boolean): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(isRTL ? 'ar' : undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function RecordTable({
  records,
  emptyTitle,
  emptyDescription,
  title = 'Personal records',
  caption,
  isRTL,
  labels
}: RecordTableProps) {
  const tableLabels = labels || DEFAULT_LABELS;

  if (records.length === 0) {
    return (
      <div className="forma-ledger-empty" role="status">
        <strong>{emptyTitle}</strong>
        <span>{emptyDescription}</span>
      </div>
    );
  }

  const tableCaption = caption
    || (isRTL
      ? `${title}: ${records.length} سجل. أعلى تقدير 1RM ${records[0].estimated1RM} ${records[0].unit}.`
      : `${title}: ${records.length} records. Top estimated 1RM ${records[0].estimated1RM} ${records[0].unit}.`);

  return (
    <div className="forma-record-table-wrap">
      <table className="forma-record-table">
        <caption className="forma-figure-caption">{tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{tableLabels.exercise}</th>
            <th scope="col">{tableLabels.bestSet}</th>
            <th scope="col">{tableLabels.oneRm}</th>
            <th scope="col">{tableLabels.date}</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={`${record.exerciseName}-${record.date}`}>
              <th scope="row">{record.exerciseName}</th>
              <td className="tabular-nums">
                <span className="forma-sr-only">
                  {isRTL ? 'أفضل جولة:' : 'Best set:'}
                </span>
                {record.maxWeight} {record.unit} × {record.reps}
              </td>
              <td className="tabular-nums">
                <span className="forma-sr-only">
                  {isRTL ? 'الوزن الأقصى التقديري:' : 'Estimated 1RM:'}
                </span>
                {record.estimated1RM} {record.unit}
              </td>
              <td className="tabular-nums">{formatRecordDate(record.date, !!isRTL)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
