export default function DataTable({
  rows,
  columns,
  rowKey = 'id',
  emptyMessage = 'No hay datos para mostrar.'
}) {
  if (rows.length === 0) {
    return <div className="empty card"><p>{emptyMessage}</p></div>;
  }

  return (
    <div className="table-wrap card">
      <table className="data-table">
        <thead>
          <tr>{columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey]}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
