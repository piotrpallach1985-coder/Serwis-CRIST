import React from 'react';
import PropTypes from 'prop-types';
import EmptyState from './EmptyState';

export default function DataTable({
  data,
  columns,
  emptyMessage = 'Brak danych.',
  onRowClick,
  rowClassName,
  renderMobileCard
}) {
  return (
    <>
      {renderMobileCard && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:hidden">
          {data.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-sm border border-slate-200">
              <EmptyState title="Brak wyników" message={emptyMessage} />
            </div>
          ) : (
            data.map((row, i) => renderMobileCard(row, i))
          )}
        </div>
      )}

      <div className={`${renderMobileCard ? 'hidden lg:block' : 'block'} w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
              <tr>
                {columns.map((col, idx) => {
                  if (col.hidden) return null;
                  return (
                    <th 
                      key={idx} 
                      className={`px-4 py-3 sm:px-6 sm:py-4 tracking-wider ${col.className || ''} ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}
                    >
                      {col.header}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.filter(c => !c.hidden).length} className="p-0">
                    <EmptyState title="Brak wyników" message={emptyMessage} />
                  </td>
                </tr>
              ) : (
                data.map((row, i) => (
                  <tr 
                    key={row.id || i}
                    onClick={(e) => {
                      if (e.target.closest('button') || e.target.closest('a')) return;
                      if (onRowClick) onRowClick(row);
                    }}
                    className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-blue-50/50' : 'hover:bg-slate-50'} ${rowClassName ? rowClassName(row) : ''}`}
                  >
                    {columns.map((col, idx) => {
                      if (col.hidden) return null;
                      
                      let cellValue;
                      if (col.render) {
                        cellValue = col.render(row, i);
                      } else if (typeof col.accessor === 'function') {
                        cellValue = col.accessor(row);
                      } else {
                        cellValue = row[col.accessor];
                      }

                      return (
                        <td 
                          key={idx} 
                          className={`px-4 py-3 sm:px-6 sm:py-4 ${col.tdClassName || ''} ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}
                        >
                          {cellValue}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

DataTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.arrayOf(PropTypes.shape({
    header: PropTypes.node.isRequired,
    accessor: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    render: PropTypes.func,
    className: PropTypes.string,
    tdClassName: PropTypes.string,
    align: PropTypes.oneOf(['left', 'center', 'right']),
    hidden: PropTypes.bool
  })).isRequired,
  emptyMessage: PropTypes.node,
  onRowClick: PropTypes.func,
  rowClassName: PropTypes.func,
  renderMobileCard: PropTypes.func
};
