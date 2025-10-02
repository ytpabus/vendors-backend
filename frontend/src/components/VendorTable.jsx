import React from 'react';
import VendorRow from './VendorRow';

function VendorTable({
  vendors,
  record,
  fields,
  adminMode,
  editingVendors,
  setEditingVendors,
  data,
  setData,
  setActiveVendorId,
  setFileModalFiles,
  setFileModalOpen
}) {
  const isVisible = (key, target) =>
    key !== 'id' &&
    key !== 'x_studio_supplier_order' &&
    key !== 'x_studio_supplier_name' &&
    (target === 'supplier' || target === 'vendor');

  return (
    <div className="vendor-table-wrapper">
      <table className="record-table vendor-new">
        <thead>
          <tr>
            {fields.filter(f => f.target === 'vendor' && isVisible(f.key, 'vendor')).map(f => (
              <th key={f.key}>{f.label}</th>
            ))}
            {adminMode && <th>Actions</th>}
            <th>📁</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor, vIdx) => (
            <VendorRow
              key={vIdx}
              vendor={vendor}
              record={record}
              fields={fields}
              adminMode={adminMode}
              editingVendors={editingVendors}
              setEditingVendors={setEditingVendors}
              data={data}
              setData={setData}
              setActiveVendorId={setActiveVendorId}
              setFileModalFiles={setFileModalFiles}
              setFileModalOpen={setFileModalOpen}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default VendorTable;
