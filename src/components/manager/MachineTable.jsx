import { useTranslation } from 'react-i18next';
import React from 'react';
import MachineCard from './MachineCard';
import DataTable from '../shared/DataTable';
import PropTypes from 'prop-types';

export default function MachineTable({
  filteredMachines, // Not used strictly anymore, currentItems represents the data to show
  currentItems,
  regions,
  handleViewMachine,
  handleCopyNfc,
  toggleNode
}) {
  const { t } = useTranslation();

  const columns = [
    {
      header: t('machines.table.machineName'),
      accessor: 'name',
      render: (m) => (
        <>
          <div className="font-semibold text-gray-800 text-base flex items-center gap-1.5 w-fit cursor-pointer hover:text-blue-600 transition-colors" onClick={(e) => { if (m.hasChildren) { e.stopPropagation(); toggleNode(m.id); } else { e.stopPropagation(); handleViewMachine(m); } }}>
            <div style={{ marginLeft: `${m.depth * 1.5}rem` }} className="flex items-center gap-1.5">
              {m.depth > 0 && <i className="ph ph-arrow-elbow-down-right text-gray-400"></i>}
              {m.hasChildren ? (
                 <button className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 focus:outline-none p-1 rounded transition-colors shadow-sm">
                   <i className={`ph ${m.isCollapsed ? 'ph-caret-right' : 'ph-caret-down'}`}></i>
                 </button>
              ) : (
                <span className="w-6"></span>
              )}
              <span>{m.name}</span>
            </div>
          </div>
          <div className="text-xs font-mono text-gray-400 mt-1">ID: {m.id}</div>
        </>
      )
    },
    {
      header: t('machines.table.internalId'),
      accessor: 'internalId',
      render: (m) => (
        <>
          <div className="font-bold text-gray-700">{m.internalId || '-'}</div>
          {m.additionalDescription && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{m.additionalDescription}</div>}
        </>
      )
    },
    {
      header: t('machines.table.region'),
      accessor: 'regionId',
      render: (m) => (
        <span className="text-gray-600">
          {regions.find(r => r.id === m.regionId)?.name || '-'}
          {m.bay && ` / ${m.bay}`}
        </span>
      )
    },
    {
      header: t('machines.table.actions'),
      accessor: 'actions',
      align: 'right',
      render: (m) => (
        <div className="flex gap-1.5 justify-end">
          <button 
            onClick={(e) => { e.stopPropagation(); handleCopyNfc(m); }} 
            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-purple-600 font-semibold py-1.5 px-3 rounded-lg transition-colors shadow-sm inline-flex items-center gap-1 text-sm" 
            title={t('machines.table.copyNfc')}
          >
            <i className="ph ph-link text-lg"></i>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleViewMachine(m); }} 
            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-semibold py-1.5 px-4 rounded-lg transition-colors shadow-sm inline-flex items-center gap-1.5 text-sm"
          >
            {t('machines.table.details')} <i className="ph ph-caret-right font-bold"></i>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 md:p-6 overflow-x-auto">
      <DataTable
        data={currentItems}
        columns={columns}
        emptyMessage={t('machines.table.empty')}
        rowClassName={(m) => m.name?.includes('(DO WERYFIKACJI)') ? 'bg-orange-50 hover:bg-orange-100' : ''}
        renderMobileCard={(m) => (
          <MachineCard 
            key={m.id} 
            machine={m} 
            regions={regions} 
            onClick={handleViewMachine} 
            handleCopyNfc={handleCopyNfc} 
            toggleNode={toggleNode}
          />
        )}
      />
    </div>
  );
}

MachineTable.propTypes = {
  filteredMachines: PropTypes.array,
  currentItems: PropTypes.array.isRequired,
  regions: PropTypes.array.isRequired,
  handleViewMachine: PropTypes.func.isRequired,
  handleCopyNfc: PropTypes.func.isRequired,
  toggleNode: PropTypes.func
};
