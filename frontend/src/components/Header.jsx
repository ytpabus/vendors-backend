import React from 'react';
import { BASE_URL } from '../routes/App';

function Header({
  tab,
  setTab,
  allowedTab,
  isAdmin,
  isBoss,
  logout,
  adminMode,
  setAdminMode,
  setLogsModalOpen,
  setLogs
}) {
  return (
    <div>
      <div className="tab-buttons">
        {(isAdmin || isBoss) ? (
          <>
            <button
              className={tab === 'Хамза' ? 'selected' : ''}
              onClick={() => setTab('Хамза')}
            >
              Хамза
            </button>
            <button
              className={tab === 'Сергили' ? 'selected' : ''}
              onClick={() => setTab('Сергили')}
            >
              Сергили
            </button>
          </>
        ) : (
          <button className="selected" disabled>{allowedTab}</button>
        )}
        <button onClick={logout} style={{ marginLeft: 'auto' }}>🚪 Logout</button>
      </div>

      {isAdmin && (
        <>
          <hr />
          <button onClick={() => setAdminMode(!adminMode)}>
            🛠 Admin Mode: {adminMode ? 'ON' : 'OFF'}
          </button>
        </>
      )}

      {isAdmin && (
        <button
          onClick={() => {
            fetch(`${BASE_URL}/logs`)
              .then(res => res.json())
              .then(data => setLogs(Array.isArray(data) ? data : []));
            setLogsModalOpen(true);
          }}
        >
          📊 View Logs
        </button>
      )}
    </div>
  );
}

export default Header;
