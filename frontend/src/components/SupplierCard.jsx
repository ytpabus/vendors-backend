import React from 'react';
import VendorTable from './VendorTable';
import { BASE_URL } from '../routes/App';

function SupplierCard({
  record,
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
  const isEditing = !!editingSuppliers[record.id];
  const isExpanded = expandedSuppliers.includes(record.id);

  const toggleExpand = (id) => {
    setExpandedSuppliers(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const startEditSupplier = (id, rec) => {
    setEditingSuppliers(p => ({ ...p, [id]: { ...rec } }));
  };

  const saveEditedSupplier = (id) => {
    fetch(`${BASE_URL}/webhook/supplier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingSuppliers[id])
    }).then(() => {
      setEditingSuppliers(p => {
        const updated = { ...p };
        delete updated[id];
        return updated;
      });
      fetch(`${BASE_URL}/data`).then(res => res.json()).then(setData);
    });
  };

  const deleteSupplier = (id) => {
    fetch(`${BASE_URL}/admin/hard-delete-supplier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    }).then(() => fetch(`${BASE_URL}/data`).then(res => res.json()).then(setData));
  };

  const isVisible = (key, target) =>
    key !== 'id' &&
    key !== 'x_studio_supplier_order' &&
    key !== 'x_studio_supplier_name' &&
    (target === 'supplier' || target === 'vendor');

  return (
    <div key={record.id} className="supplier-card" style={{ position: 'relative' }}>
      {(record.archived || record.Archived || record.x_status === 'Завершено') && (
        <div className="wb-archived-watermark">Завершено</div>
      )}
      <div
        style={{
          background: '#D0EDE5',
          border: '1px solid #B2D2CA',
          borderRadius: '6px',
          boxShadow: '0 5px 6px #B2D2CA',
          padding: '6px 10px',
          display: 'inline-block',
          marginBottom: '6px',
          color: '#000000',
          fontWeight: 'bold',
          fontSize: '14px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        {supplierFirmMap[record["x_studio_supplier_name"]] || record["x_studio_supplier_name"]}
      </div>

      <table className="record-table vendor-new">
        <thead>
          <tr>
            {(fields || [])
              .filter(f => f.target === 'supplier' && isVisible(f.key, 'supplier') && f.key !== 'x_studio_month_name')
              .map(f => <th key={f.key}>{f.label}</th>)}
            <th>Лабаратория</th>
            {adminMode && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          <tr>
            {(fields || [])
              .filter(f => f.target === 'supplier' && isVisible(f.key, 'supplier') && f.key !== 'x_studio_month_name')
              .map(f => {
                const value = isEditing ? editingSuppliers[record.id][f.key] : record[f.key];
                return (
                  <td key={f.key}>
                    {isEditing ? (
                      <input
                        value={value || ''}
                        onChange={e =>
                          setEditingSuppliers(p => ({
                            ...p,
                            [record.id]: { ...p[record.id], [f.key]: e.target.value }
                          }))
                        }
                      />
                    ) : value}
                  </td>
                );
              })}
            <td>
              {(() => {
                const vendorValues = (record.vendors || [])
                  .map(v => parseFloat(v.x_studio_lab_kley))
                  .filter(v => v && v !== 0);
                if (vendorValues.length === 0) return '';
                const avg = vendorValues.reduce((a, b) => a + b, 0) / vendorValues.length;
                const supplierValue = parseFloat(record.x_studio_kley) || 0;
                const diff = avg - supplierValue;
                const diffArrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '';
                return (
                  <>
                    {avg.toFixed(1)}{' '}
                    {diffArrow && (
                      <span style={{ color: diff > 0 ? 'green' : 'red' }}>
                        {diffArrow} {diff > 0 ? '+' : ''}{Math.abs(diff).toFixed(1)}
                      </span>
                    )}
                  </>
                );
              })()}
            </td>
            {adminMode && (
              <td>
                {isEditing
                  ? <button onClick={() => saveEditedSupplier(record.id)}>💾</button>
                  : <button onClick={() => startEditSupplier(record.id, record)}>✏️</button>}
                <button onClick={() => deleteSupplier(record.id)}>🗑️</button>
              </td>
            )}
          </tr>
        </tbody>
      </table>

      {record.vendors?.length > 0 && (
        <>
          <button onClick={() => toggleExpand(record.id)}>{isExpanded ? '🔼' : '🔽'}</button>
          {isExpanded && (
            <VendorTable
              vendors={record.vendors}
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
          )}
        </>
      )}
    </div>
  );
}

export default SupplierCard;
