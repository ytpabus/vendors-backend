import React from 'react';
import SupplierCard from './SupplierCard';
import { monthSequence } from '../routes/App';

function MonthGroup({
  month,
  records,
  fields,
  adminMode,
  expandedSuppliers,
  setExpandedSuppliers,
  editingSuppliers,
  setEditingSuppliers,
  editingVendors,
  setEditingVendors,
  newVendors,
  setNewVendors,
  data,
  setData,
  supplierFirmMap,
  setActiveVendorId,
  setFileModalFiles,
  setFileModalOpen
}) {
  return (
    <div key={month} className="month-card">
      <h2>{month}</h2>
      {records
        .slice()
        .sort((l, r) => String(l.x_studio_deadline || '').localeCompare(String(r.x_studio_deadline || '')))
        .map((record, i) => (
          <SupplierCard
            key={i}
            record={record}
            fields={fields}
            adminMode={adminMode}
            expandedSuppliers={expandedSuppliers}
            setExpandedSuppliers={setExpandedSuppliers}
            editingSuppliers={editingSuppliers}
            setEditingSuppliers={setEditingSuppliers}
            editingVendors={editingVendors}
            setEditingVendors={setEditingVendors}
            newVendors={newVendors}
            setNewVendors={setNewVendors}
            data={data}
            setData={setData}
            supplierFirmMap={supplierFirmMap}
            setActiveVendorId={setActiveVendorId}
            setFileModalFiles={setFileModalFiles}
            setFileModalOpen={setFileModalOpen}
          />
        ))}
    </div>
  );
}

export default MonthGroup;
