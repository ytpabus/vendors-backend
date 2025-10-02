import React from 'react';
import { BASE_URL } from '../routes/App';

function VendorRow({
  vendor,
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
  const isEditingVendor = editingVendors[vendor.id];

  const handleEditVendorChange = (id, field, value) => {
    setEditingVendors(p => ({ ...p, [id]: { ...p[id], [field]: value } }));
  };

  const startEditVendor = (id, supplierId, vendorData) => {
    setEditingVendors(p => ({ ...p, [id]: { ...vendorData, x_studio_supplier_order: supplierId } }));
  };

  const saveEditedVendor = (id) => {
    fetch(`${BASE_URL}/webhook/vendor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingVendors[id])
    }).then(() => {
      setEditingVendors(p => {
        const updated = { ...p };
        delete updated[id];
        return updated;
      });
      fetch(`${BASE_URL}/data`).then(res => res.json()).then(setData);
    });
  };

  const deleteVendor = (supplierId, vendorId) => {
    fetch(`${BASE_URL}/webhook/delete-vendor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: vendorId })
    }).then(() => {
      setData(p => {
        const updated = { ...p };
        updated[record.tab] = updated[record.tab].map(s =>
          s.id === supplierId
            ? { ...s, vendors: s.vendors.filter(v => v.id !== vendorId) }
            : s
        );
        return updated;
      });
    });
  };

  const isVisible = (key, target) =>
    key !== 'id' &&
    key !== 'x_studio_supplier_order' &&
    key !== 'x_studio_supplier_name' &&
    (target === 'supplier' || target === 'vendor');

  return (
    <tr>
      {fields.filter(f => f.target === 'vendor' && isVisible(f.key, 'vendor')).map(f => {
        const value = isEditingVendor ? editingVendors[vendor.id][f.key] : vendor[f.key];
        let style = {};
        if (f.key === 'x_studio_lab_kley' && (!value || parseFloat(value) === 0)) {
          style.backgroundColor = '#fdd';
        }
        return (
          <td key={f.key} style={style}>
            {isEditingVendor ? (
              <input
                value={value || ''}
                onChange={e => handleEditVendorChange(vendor.id, f.key, e.target.value)}
              />
            ) : (
              f.key === 'x_studio_lab_kley'
                ? (() => {
                    const lab = parseFloat(value);
                    const kley = parseFloat(record.x_studio_kley);
                    if (!lab || isNaN(lab)) return <span style={{ color: 'red' }}>0</span>;
                    if (!kley || isNaN(kley) || lab === kley) return <span>{lab}</span>;
                    const diff = lab - kley;
                    const arrow = diff > 0 ? '↑' : '↓';
                    const color = diff > 0 ? 'green' : 'red';
                    return (
                      <span>
                        {lab} <span style={{ color }}>{arrow} {diff > 0 ? '+' : ''}{diff.toFixed(1)}</span>
                      </span>
                    );
                  })()
                : value
            )}
          </td>
        );
      })}

      {adminMode && (
        <td>
          {isEditingVendor
            ? <button onClick={() => saveEditedVendor(vendor.id)}>💾</button>
            : <button onClick={() => startEditVendor(vendor.id, record.id, vendor)}>✏️</button>}
          <button onClick={() => deleteVendor(record.id, vendor.id)}>🗑️</button>
        </td>
      )}

      <td>
        <button onClick={() => {
          setActiveVendorId(vendor.id);
          setFileModalFiles(vendor.file || []);
          setFileModalOpen(true);
        }}>
          📎 Files
          {vendor.file_count > 0 && (
            <span style={{
              marginLeft: '4px',
              fontWeight: 'bold',
              color: vendor.file_count > 0 ? '#0d47a1' : 'gray'
            }}>
              ({vendor.file_count})
            </span>
          )}
        </button>
      </td>
    </tr>
  );
}

export default VendorRow;
