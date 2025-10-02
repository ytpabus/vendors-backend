import React, { useEffect, useState } from 'react';
import './App.css';
import FieldEditor from '../components/FieldEditor';
import FileModal from '../components/FileModal';
import LogsModal from '../components/LogsModal';

import Login from '../components/Login';
import Header from '../components/Header';
import FilterBar from '../components/FilterBar';
import MonthGroup from '../components/MonthGroup';

export const BASE_URL = 'https://vendors-backend-xkqt.onrender.com';

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

export function monthSequence(str) {
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
  const [selectedMonths, setSelectedMonths] = useState([]);
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

  // derive available months
  useEffect(() => {
    const all = [...(data['Хамза'] || []), ...(data['Сергили'] || [])];
    const unique = Array.from(
      new Set(all.map(r => r.x_studio_month_name).filter(Boolean))
    ).sort(([a], [b]) => monthSequence(a) - monthSequence(b));
    setAvailableMonths(unique);
    setSelectedMonths(ms => ms.filter(m => unique.includes(m)));
  }, [data]);

  // fetch data + fields
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
    params.set('archived', viewMode === 'active' ? '0' : 'all');

    fetch(`${BASE_URL}/data?${params.toString()}`)
      .then(res => res.json())
      .then(setData);

    fetch(`${BASE_URL}/fields-config`)
      .then(res => res.ok ? res.json() : Promise.reject(`Failed ${res.status}`))
      .then(setFields)
      .catch(err => {
        console.error("❌ Field config fetch error:", err);
        alert("Failed to load field config.");
      });
  }, [user, viewMode]);

  // fetch vendor files
  useEffect(() => {
    if (!activeVendorId) return;
    fetch(`${BASE_URL}/vendor-files?vendor_id=${activeVendorId}`)
      .then(res => res.json())
      .then(filesJson => setFileModalFiles(filesJson.files || []))
      .catch(err => console.error("❌ Vendor files fetch error:", err));
  }, [activeVendorId]);

  // logout
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setTab('Хамза');
  };

  // filter suppliers
  const filtered = (data[tab] || [])
    .filter(r => allowedTab === 'all' || r.x_studio_station_to === (allowedTab === 'Хамза' ? 2 : 1))
    .filter(r => selectedMonths.length === 0 || selectedMonths.includes(r.x_studio_month_name))
    .filter(r => {
      const isArchived = !!(r.archived || r.Archived);
      if (viewMode === 'all') return true;
      return viewMode === 'arch' ? isArchived : !isArchived;
    });

  const groupedByMonth = filtered.reduce((acc, rec) => {
    const month = rec.x_studio_month_name || "Без месяца";
    if (!acc[month]) acc[month] = [];
    acc[month].push(rec);
    return acc;
  }, {});

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
    setFileModalFiles(
      dataJson[tab].flatMap(s => s.vendors || []).find(v => v.id === activeVendorId)?.file || []
    );
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
    setFileModalFiles(
      dataJson[tab].flatMap(s => s.vendors || []).find(v => v.id === activeVendorId)?.file || []
    );
  };

  if (!user) {
    return <Login USERS={USERS} setUser={setUser} setTab={setTab} />;
  }

  return (
    <div className="app-container">
      <Header
        tab={tab}
        setTab={setTab}
        allowedTab={allowedTab}
        isAdmin={isAdmin}
        isBoss={isBoss}
        logout={logout}
        adminMode={adminMode}
        setAdminMode={setAdminMode}
        setLogsModalOpen={setLogsModalOpen}
        setLogs={setLogs}
      />

      <FilterBar
        viewMode={viewMode}
        setViewMode={setViewMode}
        availableMonths={availableMonths}
        selectedMonths={selectedMonths}
        setSelectedMonths={setSelectedMonths}
        filterOpen={filterOpen}
        setFilterOpen={setFilterOpen}
      />

      {Object.entries(groupedByMonth)
        .sort(([a], [b]) => monthSequence(a) - monthSequence(b))
        .map(([month, records]) => (
          <MonthGroup
            key={month}
            month={month}
            records={records}
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
