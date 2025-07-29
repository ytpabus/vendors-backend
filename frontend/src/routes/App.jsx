import React, { useEffect, useState } from 'react';
import FieldEditor from '../components/FieldEditor';
import './App.css';

export const BASE_URL = 'https://vendors-backend-xkqt.onrender.com';

const USERS = {
  xamza: { password: 'Z8r@Hamza1', tab: 'Хамза' },
  sergili: { password: 'S3r#Gili2', tab: 'Сергили' },
  admin: { password: 'Adm!nPower9', tab: 'all' },
  boss: { password: 'B0ssAccess4', tab: 'all' }, // ✅ Boss added
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
  const isBoss = user === 'boss'; // ✅ Boss flag
  const allowedTab = isAdmin || isBoss ? tab : USERS[user]?.tab;

  useEffect(() => {
    if (!user) return;
    fetch(`${BASE_URL}/data`).then(res => res.json()).then(setData);
    fetch(`${BASE_URL}/fields-config`)
      .then(res => res.ok ? res.json() : Promise.reject(`Failed with ${res.status}`))
      .then(setFields)
      .catch(err => {
        console.error("❌ Field config fetch error:", err);
        alert("Failed to load field config.");
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
            setTab(USERS[username].tab === 'all' ? 'Хамза' : USERS[username].tab);
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
    key !== 'id' && key !== 'x_studio_supplier_order';

  const isEditable = isAdmin && adminMode;

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

      {/* ...rest of render logic is unchanged, using isEditable instead of adminMode directly */}
    </div>
  );
}

export default App;
