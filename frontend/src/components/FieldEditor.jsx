import React, { useState } from 'react';
import { BASE_URL } from '../App.jsx';

export default function FieldEditor({ fields, setFields }) {
  const [editing, setEditing] = useState([...fields]);
  const [newFields, setNewFields] = useState([]);

  const handleChange = (index, field, value) => {
    const updated = [...editing];
    updated[index][field] = value;
    setEditing(updated);
  };

  const handleNewFieldChange = (index, field, value) => {
    const updated = [...newFields];
    updated[index][field] = value;
    setNewFields(updated);
  };

  const addNewField = () => {
    setNewFields([...newFields, { label: '', key: '', type: '', target: '', position: 0 }]);
  };

  const save = () => {
  const completedNewFields = newFields.filter(f => f.label && f.key && f.target);
  const updated = [...editing, ...completedNewFields];

  const unique = Array.from(new Map(updated.map(f => [f.key + f.target, f])).values());
  setFields(unique);
  setEditing(unique);
  setNewFields([]); // Clear only the completed ones

  fetch(`${BASE_URL}/fields-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(unique)
  }).then(() => {
    alert('Saved!');
  });
};

  return (
    <div>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Label</th>
            <th>Key</th>
            <th>Type</th>
            <th>Target</th>
            <th>Position</th>
          </tr>
        </thead>
        <tbody>
          {editing.map((f, i) => (
            <tr key={i}>
              <td><input value={f.label} onChange={e => handleChange(i, 'label', e.target.value)} /></td>
              <td><input value={f.key} onChange={e => handleChange(i, 'key', e.target.value)} /></td>
              <td><input value={f.type} onChange={e => handleChange(i, 'type', e.target.value)} /></td>
              <td><input value={f.target} onChange={e => handleChange(i, 'target', e.target.value)} /></td>
              <td><input type="number" value={f.position} onChange={e => handleChange(i, 'position', parseInt(e.target.value))} /></td>
            </tr>
          ))}

          {newFields.map((f, i) => (
            <tr key={`new-${i}`}>
              <td><input placeholder="Label" value={f.label} onChange={e => handleNewFieldChange(i, 'label', e.target.value)} /></td>
              <td><input placeholder="Key" value={f.key} onChange={e => handleNewFieldChange(i, 'key', e.target.value)} /></td>
              <td>
                <select value={f.type} onChange={e => handleNewFieldChange(i, 'type', e.target.value)}>
                  <option value="">—</option>
                  <option value="text">text</option>
                  <option value="number">number</option>
                </select>
              </td>
              <td>
                <select value={f.target} onChange={e => handleNewFieldChange(i, 'target', e.target.value)}>
                  <option value="">—</option>
                  <option value="supplier">supplier</option>
                  <option value="vendor">vendor</option>
                </select>
              </td>
              <td><input type="number" value={f.position} onChange={e => handleNewFieldChange(i, 'position', parseInt(e.target.value))} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={addNewField}>➕ Add New Field</button>
      <button onClick={save}>💾 Save Fields</button>
    </div>
  );
}
