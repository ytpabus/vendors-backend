import React, { useEffect, useState } from 'react';
import FieldEditor from '../components/FieldEditor';
import './App.css';

export const BASE_URL = 'https://vendors-backend-xkqt.onrender.com';

function App() {
  const [tab, setTab] = useState('Хамза');
  const [data, setData] = useState([]);
  const [fields, setFields] = useState([]);
  const [adminMode, setAdminMode] = useState(false);
  const [expandedSuppliers, setExpandedSuppliers] = useState([]);
  const [newVendors, setNewVendors] = useState({});
  const [editingVendors, setEditingVendors] = useState({});
  const [editingSuppliers, setEditingSuppliers] = useState({});

  useEffect(() => {
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
  }, []);

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
    }).then(() => {
      setData(prev => {
        const updated = { ...prev };
        updated[tab] = updated[tab].map(supplier =>
          supplier.id === supplierId
            ? { ...supplier, vendors: [...(supplier.vendors || []), newVendor] }
            : supplier
        );
        return updated;
      });
      setNewVendors(prev => {
        const updated = { ...prev };
        delete updated[supplierId];
        return updated;
      });
    });
  };

  const startEditVendor = (vendorId, supplierId, vendorData) => {
    setEditingVendors(prev => ({
      ...prev,
      [vendorId]: { ...vendorData, x_studio_supplier_order: supplierId }
    }));
  };

  const saveEditedVendor = (vendorId) => {
    const updatedVendor = editingVendors[vendorId];
    fetch(`${BASE_URL}/webhook/vendor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedVendor)
    }).then(() => {
      setData(prev => {
        const updated = { ...prev };
        updated[tab] = updated[tab].map(supplier => {
          if (supplier.id !== updatedVendor.x_studio_supplier_order) return supplier;
          return {
            ...supplier,
            vendors: supplier.vendors.map(v =>
              v.id === vendorId ? { ...v, ...updatedVendor } : v
            )
          };
        });
        return updated;
      });
      setEditingVendors(prev => {
        const updated = { ...prev };
        delete updated[vendorId];
        return updated;
      });
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
      setData(prev => {
        const updated = { ...prev };
        updated[tab] = updated[tab].map(supplier =>
          supplier.id === supplierId
            ? { ...supplier, ...editingSuppliers[supplierId] }
            : supplier
        );
        return updated;
      });
      setEditingSuppliers(prev => {
        const updated = { ...prev };
        delete updated[supplierId];
        return updated;
      });
    });
  };

  const deleteSupplier = (supplierId) => {
    fetch(`${BASE_URL}/webhook/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: supplierId })
    }).then(() => {
      setData(prev => {
        const updated = { ...prev };
        updated[tab] = updated[tab].filter(supplier => supplier.id !== supplierId);
        return updated;
      });
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
      {/* ...no change to rendering logic... */}
      {/* Just ensure deleteVendor is used inside the delete button */}
      {/* Example: */}
      {/* <button onClick={() => deleteVendor(record.id, vendor.id)}>🗑️</button> */}
    </div>
  );
}

export default App;
