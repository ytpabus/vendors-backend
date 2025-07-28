import React, { useEffect, useState } from 'react';
import FieldEditor from '../components/FieldEditor';
import './App.css';

export const BASE_URL = 'https://vendors-backend-xkqt.onrender.com';

function App() {
  const [tab, setTab] = useState('');
  const [role, setRole] = useState(localStorage.getItem('role') || '');
  const [data, setData] = useState([]);
  const [fields, setFields] = useState([]);
  const [adminMode, setAdminMode] = useState(false);
  const [expandedSuppliers, setExpandedSuppliers] = useState([]);
  const [newVendors, setNewVendors] = useState({});
  const [editingVendors, setEditingVendors] = useState({});
  const [editingSuppliers, setEditingSuppliers] = useState({});

  const allowedTabs = role === 'admin' ? ['Хамза', 'Сергили'] : [role === 'xamza' ? 'Хамза' : 'Сергили'];

  useEffect(() => {
    if (!tab && allowedTabs.length > 0) setTab(allowedTabs[0]);

    fetch(`${BASE_URL}/data`).then(res => res.json()).then(setData);
    fetch(`${BASE_URL}/fields-config`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch fields: ${res.status}`);
        return res.json();
      })
      .then(setFields)
      .catch(err => {
        console.error("❌ Could not load fields config:", err);
        alert("Unable to load field configuration. Check backend connection.");
      });
  }, [role]);

  const login = (username, password) => {
    const credentials = {
      xamza: 'Z8r@Hamza1',
      sergili: 'S3r#Gili2',
      admin: 'Adm!nPower9'
    };
    if (credentials[username] === password) {
      localStorage.setItem('role', username);
      setRole(username);
      setTab(username === 'admin' ? 'Хамза' : username === 'xamza' ? 'Хамза' : 'Сергили');
    } else {
      alert('Invalid login');
    }
  };

  const logout = () => {
    localStorage.removeItem('role');
    setRole('');
    setTab('');
  };

  const filtered = data[tab] || [];

  const toggleExpand = (supplierId) => {
    setExpandedSuppliers(prev =>
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const handleVendorChange = (supplierId, field, value) => {
    setNewVendors(prev => ({
      ...prev,
      [supplierId]: {
        ...prev[supplierId],
        [field]: value,
        x_studio_supplier_order: supplierId
      }
    }));
  };

  const saveNewVendor = (supplierId) => {
    const newVendor = newVendors[supplierId];
    if (!newVendor || !newVendor.id) return;
    fetch(`${BASE_URL}/webhook/vendor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVendor)
    }).then(() => window.location.reload());
  };

  const startEditVendor = (vendorId, supplierId, vendorData) => {
    setEditingVendors(prev => ({
      ...prev,
      [vendorId]: { ...vendorData, x_studio_supplier_order: supplierId }
    }));
  };

  const saveEditedVendor = (vendorId) => {
    fetch(`${BASE_URL}/webhook/vendor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingVendors[vendorId])
    }).then(() => window.location.reload());
  };

  const handleEditVendorChange = (vendorId, field, value) => {
    setEditingVendors(prev => ({
      ...prev,
      [vendorId]: {
        ...prev[vendorId],
        [field]: value
      }
    }));
  };

  const startEditSupplier = (supplierId, record) => {
    setEditingSuppliers(prev => ({
      ...prev,
      [supplierId]: { ...record }
    }));
  };

  const saveEditedSupplier = (supplierId) => {
    fetch(`${BASE_URL}/webhook/supplier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingSuppliers[supplierId])
    }).then(() => window.location.reload());
  };

  const deleteSupplier = (supplierId) => {
    fetch(`${BASE_URL}/webhook/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: supplierId })
    }).then(() => window.location.reload());
  };

  if (!role) {
    return (
      <div className="login-screen">
        <h2>Login</h2>
        <input placeholder="Username" id="username" />
        <input placeholder="Password" id="password" type="password" />
        <button onClick={() => login(
          document.getElementById('username').value,
          document.getElementById('password').value
        )}>Login</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="tab-buttons">
        {allowedTabs.map(tabName => (
          <button key={tabName} className={tab === tabName ? 'selected' : ''} onClick={() => setTab(tabName)}>
            {tabName}
          </button>
        ))}
        <button style={{ float: 'right' }} onClick={logout}>🚪 Logout</button>
      </div>

      {filtered.map((record, index) => {
        const hasMissingLabKley = (record.vendors || []).some(
          v => !v.x_studio_lab_kley || parseFloat(v.x_studio_lab_kley) === 0
        );
        const isExpanded = expandedSuppliers.includes(record.id);
        const isEditing = !!editingSuppliers[record.id];

        return (
          <div key={index} className={`supplier-card ${isExpanded ? 'expanded' : ''}`}>
            <table className="record-table vendor-new">
              <thead>
                <tr>
                  {fields.filter(f => f.target === 'supplier').sort((a, b) => a.position - b.position).map(field => (
                    <th key={field.key}>{field.label}</th>
                  ))}
                  {role === 'admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {fields.filter(f => f.target === 'supplier').sort((a, b) => a.position - b.position).map(field => {
                    const value = isEditing ? editingSuppliers[record.id][field.key] : record[field.key];
                    let style = {};

                    if (field.key === 'x_studio_remains' && value > 0) style.backgroundColor = '#fdd';
                    if (field.key === 'x_studio_kley' && hasMissingLabKley) style.backgroundColor = '#fdd';

                    return (
                      <td key={field.key} className={`col-${field.key}`} style={style}>
                        {isEditing ? (
                          <input
                            value={value || ''}
                            onChange={(e) => setEditingSuppliers(prev => ({
                              ...prev,
                              [record.id]: {
                                ...prev[record.id],
                                [field.key]: e.target.value
                              }
                            }))}
                          />
                        ) : value}
                      </td>
                    );
                  })}
                  {role === 'admin' && (
                    <td>
                      {isEditing ? (
                        <button onClick={() => saveEditedSupplier(record.id)}>💾</button>
                      ) : (
                        <button onClick={() => startEditSupplier(record.id, record)}>✏️</button>
                      )}
                      <button onClick={() => deleteSupplier(record.id)}>🗑️</button>
                    </td>
                  )}
                </tr>
              </tbody>
            </table>

            {record.vendors && record.vendors.length > 0 && (
              <>
                <button onClick={() => toggleExpand(record.id)}>{isExpanded ? '🔼' : '🔽'}</button>
                {isExpanded && (
                  <div style={{ marginTop: '1px', marginLeft: '10px', fontSize: '0.9em' }}>
                    <div className="vendor-table-wrapper">
                      <table className="record-table vendor-new">
                        <thead>
                          <tr>
                            {fields.filter(f => f.target === 'vendor' && f.key !== 'x_studio_supplier_order').sort((a, b) => a.position - b.position).map(field => (
                              <th key={field.key}>{field.label}</th>
                            ))}
                            {role === 'admin' && <th>Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {record.vendors.map((vendor, vIdx) => {
                            const isEditingVendor = editingVendors[vendor.id];
                            return (
                              <tr key={vIdx}>
                                {fields.filter(f => f.target === 'vendor' && f.key !== 'x_studio_supplier_order').sort((a, b) => a.position - b.position).map(field => {
                                  const value = isEditingVendor ? editingVendors[vendor.id][field.key] : vendor[field.key];
                                  let style = {};
                                  if (field.key === 'x_studio_lab_kley') {
                                    style.backgroundColor = !value || parseFloat(value) === 0 ? '#fdd' : '#dfd';
                                  }
                                  return (
                                    <td key={field.key} style={style}>
                                      {isEditingVendor ? (
                                        <input
                                          value={value || ''}
                                          onChange={(e) => handleEditVendorChange(vendor.id, field.key, e.target.value)}
                                        />
                                      ) : value}
                                    </td>
                                  );
                                })}
                                {role === 'admin' && (
                                  <td>
                                    {isEditingVendor ? (
                                      <button onClick={() => saveEditedVendor(vendor.id)}>💾</button>
                                    ) : (
                                      <button onClick={() => startEditVendor(vendor.id, record.id, vendor)}>✏️</button>
                                    )}
                                    <button onClick={() => {
                                      fetch(`${BASE_URL}/webhook/delete-vendor`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ id: vendor.id }),
                                      }).then(() => window.location.reload());
                                    }}>🗑️</button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {role === 'admin' && (
              <div style={{ marginTop: '10px', marginLeft: '10px' }}>
                <strong>➕ Add New Vendor Order</strong>
                <table className="record-table vendor-new">
                  <tbody>
                    <tr>
                      {fields.filter(f => f.target === 'vendor' && f.key !== 'x_studio_supplier_order').sort((a, b) => a.position - b.position).map(field => (
                        <td key={field.key}>
                          <input
                            placeholder={field.label}
                            onChange={(e) => handleVendorChange(record.id, field.key, e.target.value)}
                          />
                        </td>
                      ))}
                      <td><button onClick={() => saveNewVendor(record.id)}>Save</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      <hr />
      {role === 'admin' && (
        <>
          <button onClick={() => setAdminMode(!adminMode)}>🛠 Admin Mode</button>
          {adminMode && (
            <>
              <h2>Admin Field Editor</h2>
              <FieldEditor fields={fields} setFields={setFields} />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
