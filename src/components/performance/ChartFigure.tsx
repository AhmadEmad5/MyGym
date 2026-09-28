import { useId, useState, type ReactNode } from 'react';
import { Table2, ChartNoAxesColumn } from 'lucide-react';

interface ChartFigureProps {
  /** Names the figure for assistive technology; rendered inside the caption. */
  title: string;
  /** Short sentence describing what the visual encodes, read by screen readers. */
  summary: string;
  /** Long-form caption rendered under the visual and kept in the accessibility tree. */
  caption: string;
  children: ReactNode;
  /** Table alternative mirroring the plotted values. */
  table: ReactNode;
  /** Hides the table toggle when a single non-tabular visual is shown. */
  tableToggleLabel?: { show: string; hide: string };
  className?: string;
  isRTL?: boolean;
  childrenLabel?: string;
}

export function ChartFigure({
  title,
  summary,
  caption,
  children,
  table,
  tableToggleLabel,
  className,
  isRTL,
  childrenLabel
}: ChartFigureProps) {
  const [showTable, setShowTable] = useState(false);
  const captionId = useId();
  const tableId = useId();

  const labels = tableToggleLabel || {
    show: isRTL ? 'عرض الجدول' : 'Show data table',
    hide: isRTL ? 'إخفاء الجدول' : 'Hide data table'
  };

  return (
    <figure className={`forma-figure ${className || ''}`.trim()}>
      <div className="forma-figure-body">
        {children}
        <figcaption id={captionId} className="forma-figure-caption">
          <span className="forma-sr-only">{`${title}. `}</span>
          {caption}
        </figcaption>
      </div>
      <button
        type="button"
        className="forma-figure-toggle"
        aria-expanded={showTable}
        aria-controls={tableId}
        onClick={() => setShowTable(prev => !prev)}
      >
        {showTable ? <Table2 size={13} aria-hidden="true" /> : <ChartNoAxesColumn size={13} aria-hidden="true" />}
        <span>{showTable ? labels.hide : labels.show}</span>
      </button>
      {showTable && (
        <div id={tableId} className="forma-record-table-wrap">
          {table}
        </div>
      )}
      <span className="forma-sr-only">{summary}</span>
      {childrenLabel && <span className="forma-sr-only">{childrenLabel}</span>}
    </figure>
  );
}
