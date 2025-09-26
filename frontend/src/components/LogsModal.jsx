import React from "react";

function LogsModal({ isOpen, onClose, logs }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{
          width: "80%",          // wide modal
          maxWidth: "1200px",
          margin: "40px auto",
          padding: "20px",
        }}
      >
        <button
          onClick={onClose}
          style={{
            float: "right",
            background: "transparent",
            border: "none",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          ❌
        </button>
        <h2 style={{ marginTop: 0 }}>Activity Logs</h2>
        <p style={{ fontSize: "0.9rem", color: "#555", margin: "5px 0" }}>
            Total logs: {logs.length}
        </p>
        <table
          className="record-table"
          style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              <th style={{ width: "20%" }}>Timestamp</th>
              <th style={{ width: "8%" }}>User</th>
              <th style={{ width: "8%" }}>Action</th>
              <th style={{ width: "10%" }}>IP</th>
              <th style={{ width: "54%" }}>User Agent</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i}>
                <td>{new Date(log.ts).toLocaleString()}</td>
                <td>{log.username}</td>
                <td>{log.action}</td>
                <td>{log.ip}</td>
                <td
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {log.user_agent}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LogsModal;
