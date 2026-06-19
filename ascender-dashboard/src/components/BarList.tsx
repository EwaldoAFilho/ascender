type BarListProps = {
  title: string;
  rows: Array<{
    label: string;
    value: number;
    caption: string;
  }>;
  formatter?: (value: number) => string;
};

export function BarList({ title, rows, formatter = (value) => String(value) }: BarListProps) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
      </div>
      <div className="bar-list">
        {rows.map((row) => (
          <div className="bar-row" key={row.label}>
            <div className="bar-row-top">
              <span>{row.label}</span>
              <strong>{formatter(row.value)}</strong>
            </div>
            <div className="bar-track">
              <span style={{ width: `${Math.max((row.value / max) * 100, 4)}%` }} />
            </div>
            <small>{row.caption}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
