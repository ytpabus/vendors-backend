import React, { useEffect, useState } from 'react';
import FieldEditor from '../components/FieldEditor';
import './App.css';
import FileModal from '../components/FileModal';
import LogsModal from '../components/LogsModal';


export const BASE_URL = 'http://127.0.0.1:5000';

const USERS = {
  xamza: { password: 'Z8r@Hamza1', tab: 'Хамза' },
  sergili: { password: 'S3r#Gili2', tab: 'Сергили' },
  admin: { password: 'Adm!nPower9', tab: 'all' },
  boss: { password: 'Bo$$Access3', tab: 'all' },
};

const monthMap = {
  "Январь": 1, "Февраль": 2, "Март": 3, "Апрель": 4,
  "Май": 5, "Июнь": 6, "Июль": 7, "Август": 8,
  "Сентябрь": 9, "Октябрь": 10, "Ноябрь": 11, "Декабрь": 12
};

function monthSequence(str) {
  if (!str) return 0;
  const [name, yy] = str.split(" ");
  const mm = monthMap[name] || 0;
  return parseInt(`${yy}${String(mm).padStart(2, "0")}`, 10);
}

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
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);   // '' = all
  const [availableMonths, setAvailableMonths] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('active');


  const supplierFirmMap = {
    "Света": "TOO Enrichment",
    "Жарас": "TOO Gross Ost Time",
    "Ильдар": "TOO AZK Esentai",
    "Салим": "TOO Saman Biday",
    "Тлек": "TOO Astana Grain",
    "Анастасия": "TOO Торговый Дом Арасан"
  };

  const isAdmin = user === 'admin';
  const isBoss = user === 'boss';
  const allowedTab = (isAdmin || isBoss) ? tab : USERS[user]?.tab;

  useEffect(() => {
    const all = [...(data['Хамза'] || []), ...(data['Сергили'] || [])];
    const unique = Array.from(new Set(all.map(r => r.x_studio_month_name).filter(Boolean))).sort(([a], [b]) => monthSequence(a) - monthSequence(b));
    setAvailableMonths(unique);
    setSelectedMonths(ms => ms.filter(m => unique.includes(m)));
  }, [data]);

  useEffect(() => {
    if (!user) return;

    fetch(`${BASE_URL}/log-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, action: "visit" })
    });

    if (!(user === 'admin' || user === 'boss')) {
      setTab(USERS[user].tab);
    }
    const params = new URLSearchParams();
    const archivedParam = (viewMode === 'active') ? '0' : 'all';
    params.set('archived', archivedParam);

    fetch(`${BASE_URL}/data?${params.toString()}`)
      .then(res => res.json())
      .then(setData);

    // keep fields-config fetch as-is
    fetch(`${BASE_URL}/fields-config`)
      .then(res => res.ok ? res.json() : Promise.reject(`Failed with ${res.status}`))
      .then(setFields)
      .catch(err => {
        console.error("❌ Field config fetch error:", err);
        alert("Failed to load field config.");
      });
  }, [user, viewMode]);

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
          fetch(`${BASE_URL}/log-event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: username, action: "login" })
          });
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

  const filtered = (data[tab] || [])
    .filter(r => allowedTab === 'all' || r.x_studio_station_to === (allowedTab === 'Хамза' ? 2 : 1))
    .filter(r => selectedMonths.length === 0 || selectedMonths.includes(r.x_studio_month_name))
    .filter(r => {
      const isArchived = !!(r.archived || r.Archived);
      if (viewMode === 'all') return true;
      return viewMode === 'arch' ? isArchived : !isArchived;
    });

  const toggleExpand = (id) => {
    setExpandedSuppliers(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const isVisible = (key, target) =>
    key !== 'id' && key !== 'x_studio_supplier_order' && key !== 'x_studio_supplier_name' &&
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
    fetch(`${BASE_URL}/admin/hard-delete-supplier`, {
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

    await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      body: formData,
      headers: { "X-User": user }
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

  // ✅ Group suppliers by month name (outer wrapper only)
  const groupedByMonth = filtered.reduce((acc, rec) => {
    const month = rec.x_studio_month_name || "Без месяца";
    if (!acc[month]) acc[month] = [];
    acc[month].push(rec);
    return acc;
  }, {});

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

      {isAdmin && (
        <button onClick={() => {
          fetch(`${BASE_URL}/logs`)
            .then(res => res.json())
            .then(data => setLogs(Array.isArray(data) ? data : []));
          setLogsModalOpen(true);
        }}>
          📊 View Logs
        </button>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '8px 0' }}>
        <button onClick={() => setFilterOpen(v => !v)}>Фильтр</button>

        {filterOpen && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: 8,
              background: '#f7f7f7',
              flexWrap: 'wrap'
            }}
          >
            {/* 3-way toggle */}
            <div style={{ display: 'inline-flex', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
              <button
                onClick={() => setViewMode('active')}
                style={{
                  padding: '6px 10px',
                  border: 'none',
                  background: viewMode === 'active' ? '#e6f4ea' : 'white',
                  fontWeight: viewMode === 'active' ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                В Процессе
              </button>
              <button
                onClick={() => setViewMode('all')}
                style={{
                  padding: '6px 10px',
                  borderLeft: '1px solid #ddd',
                  borderRight: '1px solid #ddd',
                  background: viewMode === 'all' ? '#e6f4ea' : 'white',
                  fontWeight: viewMode === 'all' ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                Все
              </button>
              <button
                onClick={() => setViewMode('arch')}
                style={{
                  padding: '6px 10px',
                  border: 'none',
                  background: viewMode === 'arch' ? '#e6f4ea' : 'white',
                  fontWeight: viewMode === 'arch' ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                Архив
              </button>
            </div>

            {/* Месяц multiselect (UI only) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600 }}>Месяц:</span>
              <select
                multiple
                size={Math.max(availableMonths.length, 4)}
                value={selectedMonths}
                onChange={() => { /* noop: selection is controlled via state below */ }}
              >
                {availableMonths.map(m => (
                  <option
                    key={m}
                    value={m}
                    onMouseDown={(e) => {
                      // prevent the native single-select behavior
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedMonths(prev =>
                        prev.includes(m) ? prev.filter(v => v !== m) : [...prev, m]
                      );
                    }}
                    onKeyDown={(e) => {
                      // keyboard toggle (Space/Enter)
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setSelectedMonths(prev =>
                          prev.includes(m) ? prev.filter(v => v !== m) : [...prev, m]
                        );
                      }
                    }}
                    aria-selected={selectedMonths.includes(m)}
                  >
                    {m}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => setSelectedMonths([])}>Сброс</button>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Month wrappers that include supplier cards as-is */}
      {Object.entries(groupedByMonth)
      .sort(([a], [b]) => monthSequence(a) - monthSequence(b))
      .map(([month, records]) => (
        <div key={month} className="month-card">
          <h2>{month}</h2>

          {records.slice().sort((l, r) => String(l.x_studio_deadline || '').localeCompare(String(r.x_studio_deadline || ''))).map((record, i) => {
            const isEditing = !!editingSuppliers[record.id];
            const hasMissingLab = (record.vendors || []).some(
              v => !v.x_studio_lab_kley || parseFloat(v.x_studio_lab_kley) === 0
            );
            const isExpanded = expandedSuppliers.includes(record.id);

            return (
              <div key={i} className="supplier-card" style={{ position: 'relative' }}>
                {(record.archived || record.Archived || record.x_status === 'Завершено') && (
                  <div className="wb-archived-watermark">Завершено</div>
                )}
                {/* ✅ Default firm name instead of Поставщик */}
                <div style={{
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
                }}>
                  {supplierFirmMap[record["x_studio_supplier_name"]] || record["x_studio_supplier_name"]}
                </div>

                <table className="record-table vendor-new">
                  <thead>
                    <tr>
                      {(fields || []).filter(f => f.target === 'supplier' && isVisible(f.key, 'supplier') && f.key !== 'x_studio_month_name').map(f => (
                        <th key={f.key}>{f.label}</th>
                      ))}
                      <th>
                        Лабаратория
                        {record.vendors?.some(v =>
                          !v.x_studio_lab_kley || parseFloat(v.x_studio_lab_kley) === 0
                        ) && <span style={{ color: 'red', marginLeft: 4 }}>⚠️</span>}
                      </th>
                      {adminMode && <th>Actions</th>}
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      {(fields || []).filter(f => f.target === 'supplier' && isVisible(f.key, 'supplier') && f.key !== 'x_studio_month_name').map(f => {
                        const value = isEditing ? editingSuppliers[record.id][f.key] : record[f.key];
                        let style = {};
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
                          const diffAbs = Math.abs(diff).toFixed(1);

                          return (
                            <>
                              {avg.toFixed(1)}{' '}
                              {diffArrow && (
                                <span style={{ color: diff > 0 ? 'green' : 'red' }}>
                                  {diffArrow} {diff > 0 ? '+' : ''}{diffAbs}
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
                            {record.vendors.map((vendor, vIdx) => {
                              const isEditingVendor = editingVendors[vendor.id];
                              return (
                                <tr key={vIdx}>
                                  {fields.filter(f => f.target === 'vendor' && isVisible(f.key, 'vendor')).map(f => {
                                    const value = isEditingVendor ? editingVendors[vendor.id][f.key] : vendor[f.key];
                                    let style = {};
                                    if (f.key === 'x_studio_lab_kley') {
                                      if (!value || parseFloat(value) === 0) {
                                        style.backgroundColor = '#fdd';
                                      }
                                    }

                                    return (
                                      <td key={f.key} style={style}>
                                        {isEditingVendor ? (
                                          <input
                                            value={value || ''}
                                            onChange={e => handleEditVendorChange(vendor.id, f.key, e.target.value)}
                                          />
                                        ) : (
                                          f.key === 'x_studio_lab_kley' ? (() => {
                                            const lab = parseFloat(value);
                                            const kley = parseFloat(record.x_studio_kley);
                                            if (!lab || isNaN(lab)) return <span style={{ color: 'red' }}>0</span>;
                                            if (!kley || isNaN(kley) || lab === kley) return <span>{lab}</span>;
                                            const diff = lab - kley;
                                            const isUp = diff > 0;
                                            const color = isUp ? 'green' : 'red';
                                            const arrow = isUp ? '↑' : '↓';
                                            return (
                                              <span>
                                                {lab} <span style={{ color }}>{arrow} {diff > 0 ? '+' : ''}{diff.toFixed(1)}</span>
                                              </span>
                                            );
                                          })() : value
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
                                        <span style={{ marginLeft: '4px', fontWeight: 'bold', color: vendor.file_count > 0 ? '#0d47a1' : 'gray' }}>
                                          ({vendor.file_count})
                                        </span>
                                      )}
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

                {/* Add-new-vendor block is intentionally kept commented out */}
                {/*
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
                */}
              </div>
            );
          })}
        </div>
      ))}

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
      <LogsModal
        isOpen={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
        logs={logs}
      />
    </div>
  );
}

export default App;
