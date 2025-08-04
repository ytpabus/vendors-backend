import React, { useState } from "react";
import ReactDOM from "react-dom";
import "../routes/App.css"; 
import { BASE_URL } from '../routes/App';

const FileModal = ({ vendorId, files, isOpen, onClose, onUpload, onDelete, isAdmin }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={() => {
          setSelectedFile(null);
           onClose();
        }}>✖</button>
        <h2>📂 Files for Vendor #{vendorId}</h2>

        <input
          type="file"
          onChange={async (e) => {
            const file = e.target.files[0];
            if (file) {
              await onUpload(file);
              setSelectedFile(null);
            }
          }}
        />

        <ul className="file-list">
  {Array.isArray(files) && files.length > 0 ? (
    files.map((url, idx) => {
      const filename = url.split("/").pop();
      return (
        <li key={idx} className="file-item">
          <a href={url} target="_blank" rel="noopener noreferrer" className="file-link">
            📄 {filename}
          </a>
          <span>
            <button onClick={() => setSelectedFile(selectedFile === url ? null : url)}>🔍</button>
            <a
              href={`${BASE_URL}/download?url=${encodeURIComponent(url)}`}
              className="download-button"
              target="_blank"
              rel="noopener noreferrer"
            >⬇️</a>
            {isAdmin && (
              <button onClick={() => onDelete(url)}>🗑️</button>
            )}
          </span>
        </li>
      );
    })
  ) : (
    <li>No files uploaded.</li>
  )}
</ul>

        {selectedFile && (
          <div className="preview">
            <h3>Preview:</h3>
            {selectedFile.match(/\.(pdf)$/i) ? (
              <iframe src={selectedFile} title="Preview" className="preview-box" />
            ) : (
              <img src={selectedFile} alt="Preview" className="preview-box" />
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default FileModal;
