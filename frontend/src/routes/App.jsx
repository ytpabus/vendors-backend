import React, { useEffect, useState } from 'react';
import FieldEditor from '../components/FieldEditor';
import './App.css';

export const BASE_URL = 'https://vendors-backend-xkqt.onrender.com';

const USERS = {
  xamza: { password: 'Z8r@Hamza1', tab: 'Хамза' },
  sergili: { password: 'S3r#Gili2', tab: 'Сергили' },
  admin: { password: 'Adm!nPower9', tab: 'all' },
};

function App() {
  const [tab, setTab] = useState('Хамза');
  const [data, setData] = useState([]);
  const [fields, setFields] = useState([]);
  const [adminMode, setAdminMode] = useState(false);
  const [expandedSuppliers, setExpandedSuppliers] = useState([]);
  const [newVendors, setNewVendors] = useState({});
  const [editingVendors, setEditingVendors] = useState({});
  const [editingSuppliers, setEditingSuppliers] = useState({});
  const [user, setUser] = useState(localStorage.getItem('user') || null);

  const isAdmin = user === 'admin';
  const allowedTab = user === 'admin' ? tab : USERS[user]?.tab;

  useEffect(() => {
    if (!user) return;
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
  }, [user]);

  if (!user) {
    return (
      <div className="login-screen">
        <h2>Login</h2>
        <form onSubmit={e => {
          e.preventDefault();
          const username = e.target.username.value;
          const password = e.target.password.value;
          if (USERS[username] && USERS[username].password === password) {
            localStorage.setItem('user', username);
            setUser(username);
            setTab(username === 'admin' ? 'Хамза' : USERS[username].tab);
          } else {
            alert("Invalid credentials");
          }
        }}>
          <input name="username" placeholder="Username" autoFocus />
          <input name="password" type="password" placeholder="Password" />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setTab('Хамза');
  };

  const filtered = (data[tab] || []).filter(
    record => allowedTab === 'all' || record.x_studio_station_to === (allowedTab === 'Хамза' ? 2 : 1)
  );

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
    }).then(() => {
      setNewVendors(prev => ({ ...prev, [supplierId]: {} }));
      fetch(`${BASE_URL}/data`).then(res => res.json()).then(setData);
    });
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
    }).then(() => {
      setEditingVendors(prev => {
        const updated = { ...prev };
        delete updated[vendorId];
        return updated;
      });
      fetch(`${BASE_URL}/data`).then(res => res.json()).then(setData);
    });
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
    }).then(() => {
      setEditingSuppliers(prev => {
        const updated = { ...prev };
        delete updated[supplierId];
        return updated;
      });
      fetch(`${BASE_URL}/data`).then(res => res.json()).then(setData);
    });
  };

  const deleteSupplier = (supplierId) => {
    fetch(`${BASE_URL}/webhook/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: supplierId })
    }).then(() => {
      fetch(`${BASE_URL}/data`).then(res => res.json()).then(setData);
    });
  };

  const deleteVendor = (supplierId, vendorId) => {
    fetch(`${BASE_URL}/webhook/delete-vendor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: vendorId })
    }).then(() => {
      setData(prev => {
        const updated = { ...prev };
        updated[tab] = updated[tab].map(supplier =>
          supplier.id === supplierId
            ? {
                ...supplier,
                vendors: supplier.vendors.filter(v => v.id !== vendorId)
              }
            : supplier
        );
        return updated;
      });
    });
  };

  return (
    <div className="app-container">
      <div className="tab-buttons">
        {user === 'admin' && (
          <>
            <button className={tab === 'Хамза' ? 'selected' : ''} onClick={() => setTab('Хамза')}>Хамза</button>
            <button className={tab === 'Сергили' ? 'selected' : ''} onClick={() => setTab('Сергили')}>Сергили</button>
          </>
        )}
        {user !== 'admin' && <h3>{allowedTab}</h3>}
        <button onClick={logout} style={{ marginLeft: 'auto' }}>🚪 Logout</button>
      </div>

      {isAdmin && (
        <button onClick={() => setAdminMode(!adminMode)}>🛠 Admin Mode: {adminMode ? 'ON' : 'OFF'}</button>
      )}

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
                  {adminMode && <th>Actions</th>}
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
                  {adminMode && (
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
                  <div className="vendor-table-wrapper">
                    <table className="record-table vendor-new">
                      <thead>
                        <tr>
                          {fields.filter(f => f.target === 'vendor' && f.key !== 'x_studio_supplier_order').sort((a, b) => a.position - b.position).map(field => (
                            <th key={field.key}>{field.label}</th>
                          ))}
                          {adminMode && <th>Actions</th>}
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
                              {adminMode && (
                                <td>
                                  {isEditingVendor ? (
                                    <button onClick={() => saveEditedVendor(vendor.id)}>💾</button>
                                  ) : (
                                    <button onClick={() => startEditVendor(vendor.id, record.id, vendor)}>✏️</button>
                                  )}
                                  <button onClick={() => deleteVendor(record.id, vendor.id)}>🗑️</button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {adminMode && (
              <div className="vendor-add-form">
                <strong>➕ Add New Vendor Order</strong>
                <table className="record-table vendor-new">
                  <tbody>
                    <tr>
                      {fields.filter(f => f.target === 'vendor' && f.key !== 'x_studio_supplier_order').sort((a, b) => a.position - b.position).map(field => (
                        <td key={field.key}>
                          <input
                            placeholder={field.label}
                            value={(newVendors[record.id]?.[field.key]) || ''}
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

      {adminMode && (
        <>
          <h2>Admin Field Editor</h2>
          <FieldEditor fields={fields} setFields={setFields} />
        </>
      )}
    </div>
  );
}

export default App;
