import React, { useEffect, useState } from 'react';
import FieldEditor from '../components/FieldEditor';
import './App.css';
import FileModal from '../components/FileModal';


export const BASE_URL = 'https://vendors-backend-xkqt.onrender.com';

const USERS = {
  xamza: { password: 'Z8r@Hamza1', tab: 'Хамза' },
  sergili: { password: 'S3r#Gili2', tab: 'Сергили' },
  admin: { password: 'Adm!nPower9', tab: 'all' },
  boss: { password: 'Bo$$Access3', tab: 'all' },
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
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [activeVendorId, setActiveVendorId] = useState(null);
  const [fileModalFiles, setFileModalFiles] = useState([]);


  const isAdmin = user === 'admin';
  const isBoss = user === 'boss';
  const allowedTab = (isAdmin || isBoss) ? tab : USERS[user]?.tab;

  useEffect(() => {
    if (!user) return;
    if (!(user === 'admin' || user === 'boss')) {
      setTab(USERS[user].tab);
    }
    fetch(`${BASE_URL}/data`).then(res => res.json()).then(setData);
    fetch(`${BASE_URL}/fields-config`)
      .then(res => res.ok ? res.json() : Promise.reject(`Failed with ${res.status}`))
      .then(setFields)
      .catch(err => {
        console.error("❌ Field config fetch error:", err);
        alert("Failed to load field config.");
      });
  }, [user]);

  useEffect(() => {
  if (!activeVendorId) return;

  fetch(`${BASE_URL}/vendor-files?vendor_id=${activeVendorId}`)
    .then(res => res.json())
    .then(filesJson => {
      setFileModalFiles(filesJson.files || []);
    })
    .catch(err => {
      console.error("❌ Failed to fetch vendor files:", err);
    });
}, [activeVendorId]);


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
            setTab(username === 'admin' || username === 'boss' ? 'Хамза' : USERS[username].tab);
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
    r => allowedTab === 'all' || r.x_studio_station_to === (allowedTab === 'Хамза' ? 2 : 1)
  );

  const toggleExpand = (id) => {
    setExpandedSuppliers(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const isVisible = (key, target) =>
    key !== 'id' && key !== 'x_studio_supplier_order' &&
    (target === 'supplier' || target === 'vendor');

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
    const vendor = newVendors[supplierId];
    if (!vendor?.id) return;
    fetch(`${BASE_URL}/webhook/vendor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vendor)
    }).then(() => {
      setNewVendors(p => ({ ...p, [supplierId]: {} }));
      fetch(`${BASE_URL}/data`).then(res => res.json()).then(setData);
    });
  };

  const handleEditVendorChange = (id, field, value) => {
    setEditingVendors(p => ({
      ...p,
      [id]: { ...p[id], [field]: value }
    }));
  };

  const startEditVendor = (id, supplierId, data) => {
    setEditingVendors(p => ({
      ...p,
      [id]: { ...data, x_studio_supplier_order: supplierId }
    }));
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

  const startEditSupplier = (id, record) => {
    setEditingSuppliers(p => ({
      ...p,
      [id]: { ...record }
    }));
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
    fetch(`${BASE_URL}/webhook/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    }).then(() => fetch(`${BASE_URL}/data`).then(res => res.json()).then(setData));
  };

  const deleteVendor = (supplierId, vendorId) => {
    fetch(`${BASE_URL}/webhook/delete-vendor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: vendorId })
    }).then(() => {
      setData(p => {
        const updated = { ...p };
        updated[tab] = updated[tab].map(s =>
          s.id === supplierId
            ? { ...s, vendors: s.vendors.filter(v => v.id !== vendorId) }
            : s
        );
        return updated;
      });
    });
  };
  
  const handleFileUpload = async (file) => {
  const formData = new FormData();
  formData.append("vendor_id", activeVendorId);
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData
  });

  const dataRes = await fetch(`${BASE_URL}/data`);
  const dataJson = await dataRes.json();
  setData(dataJson);
  setFileModalFiles(dataJson[tab]
    .flatMap(s => s.vendors || [])
    .find(v => v.id === activeVendorId)?.file || []);
};

const handleFileDelete = async (fileUrl) => {
  await fetch(`${BASE_URL}/delete-file`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vendor_id: activeVendorId,
      file_url: fileUrl
    })
  });

  const dataRes = await fetch(`${BASE_URL}/data`);
  const dataJson = await dataRes.json();
  setData(dataJson);
  setFileModalFiles(dataJson[tab]
    .flatMap(s => s.vendors || [])
    .find(v => v.id === activeVendorId)?.file || []);
};


  return (
    <div className="app-container">
      <div className="tab-buttons">
        {(isAdmin || isBoss) ? (
          <>
            <button className={tab === 'Хамза' ? 'selected' : ''} onClick={() => setTab('Хамза')}>Хамза</button>
            <button className={tab === 'Сергили' ? 'selected' : ''} onClick={() => setTab('Сергили')}>Сергили</button>
          </>
        ) : <h3>{allowedTab}</h3>}
        <button onClick={logout} style={{ marginLeft: 'auto' }}>🚪 Logout</button>
      </div>

      {isAdmin && (
        <>
          <hr />
          <button onClick={() => setAdminMode(!adminMode)}>🛠 Admin Mode: {adminMode ? 'ON' : 'OFF'}</button>
        </>
      )}

      {filtered.map((record, i) => {
        const isEditing = !!editingSuppliers[record.id];
        const hasMissingLab = (record.vendors || []).some(
          v => !v.x_studio_lab_kley || parseFloat(v.x_studio_lab_kley) === 0
        );
        const isExpanded = expandedSuppliers.includes(record.id);

        return (
          <div key={i} className="supplier-card">
            <table className="record-table vendor-new">
              <thead>
                <tr>
                  {(fields || []).filter(f => f.target === 'supplier' && isVisible(f.key, 'supplier')).map(f => (


                    <th key={f.key}>{f.label}</th>
                  ))}
                  {adminMode && <th>Actions</th>}
                </tr>
              </thead>
              
              <tbody>
                <tr>
                  {(fields || []).filter(f => f.target === 'supplier' && isVisible(f.key, 'supplier')).map(f => {

                    
                    const value = isEditing ? editingSuppliers[record.id][f.key] : record[f.key];
                    let style = {};
                    if (f.key === 'x_studio_remains' && value > 0) style.backgroundColor = '#fdd';
                    if (f.key === 'x_studio_kley' && hasMissingLab) style.backgroundColor = '#fdd';
                    return (
                      <td key={f.key} className={`col-${f.key}`} style={style}>
                        {isEditing ? (
                          <input
                            value={value || ''}
                            onChange={e => setEditingSuppliers(p => ({
                              ...p,
                              [record.id]: {
                                ...p[record.id],
                                [f.key]: e.target.value
                              }
                            }))}
                          />
                        ) : value}
                      </td>
                    );
                  })}
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
                  <div className="vendor-table-wrapper">
                    <table className="record-table vendor-new">
                      <thead>
  <tr>
    {fields.filter(f => f.target === 'vendor' && isVisible(f.key, 'vendor')).map(f => (
      <th key={f.key}>{f.label}</th>
    ))}
    {adminMode && <th>Actions</th>}
    <th>📁</th> {/* ✅ Add this */}
  </tr>
</thead>
                      <tbody>
                        {record.vendors.map((vendor, vIdx) => {
                          const isEditingVendor = editingVendors[vendor.id];
                          return (
                            <tr key={vIdx}>
  {fields.filter(f => f.target === 'vendor' && isVisible(f.key, 'vendor')).map(f => {
    const value = isEditingVendor ? editingVendors[vendor.id][f.key] : vendor[f.key];
    let style = {};
    if (f.key === 'x_studio_lab_kley') {
      style.backgroundColor = !value || parseFloat(value) === 0 ? '#fdd' : '#dfd';
    }
    return (
      <td key={f.key} style={style}>
        {isEditingVendor ? (
          <input
            value={value || ''}
            onChange={e => handleEditVendorChange(vendor.id, f.key, e.target.value)}
          />
        ) : value}
      </td>
    );
  })}

  {/* Admin buttons */}
  {adminMode && (
    <td>
      {isEditingVendor
        ? <button onClick={() => saveEditedVendor(vendor.id)}>💾</button>
        : <button onClick={() => startEditVendor(vendor.id, record.id, vendor)}>✏️</button>}
      <button onClick={() => deleteVendor(record.id, vendor.id)}>🗑️</button>
    </td>
  )}

  {/* 📎 Files column (always visible) */}
  <td>
    <button onClick={() => {
      setActiveVendorId(vendor.id);
      setFileModalFiles(vendor.file || []);
      setFileModalOpen(true);
    }}>
      📎 Files
    </button>
  </td>
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
                      {fields.filter(f => f.target === 'vendor' && isVisible(f.key, 'vendor')).map(f => (
                        <td key={f.key}>
                          <input
                            placeholder={f.label}
                            value={newVendors[record.id]?.[f.key] || ''}
                            onChange={e => handleVendorChange(record.id, f.key, e.target.value)}
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
  <FileModal
  vendorId={activeVendorId}
  files={fileModalFiles}
  isOpen={fileModalOpen}
  onClose={() => setFileModalOpen(false)}
  onUpload={handleFileUpload}
  onDelete={handleFileDelete}
  isAdmin={adminMode}
/>
    </div>
  );
}

export default App;
