import React, { useState, useEffect } from "react";

const FileModal = ({ vendorId, files, isOpen, onClose, onUpload, onDelete, isAdmin }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-xl w-full max-w-xl max-h-[80vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-black"
        >
          ✖
        </button>

        <h2 className="text-xl font-semibold mb-4">📂 Files for Vendor #{vendorId}</h2>

        <div className="mb-4">
          <input
            type="file"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (file) {
                await onUpload(file);
              }
            }}
          />
        </div>

        <ul className="space-y-2">
          {files.map((url, idx) => {
            const filename = url.split("/").pop();
            return (
              <li
                key={idx}
                className="flex items-center justify-between border p-2 rounded hover:bg-gray-100 cursor-pointer"
                onClick={() => setSelectedFile(url)}
              >
                <span className="truncate w-3/4">📄 {filename}</span>
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(url);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {selectedFile && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Preview:</h3>
            {selectedFile.match(/\.(pdf)$/i) ? (
              <iframe
                src={selectedFile}
                title="PDF Preview"
                className="w-full h-96 border rounded"
              />
            ) : (
              <img
                src={selectedFile}
                alt="File Preview"
                className="max-w-full max-h-96 border rounded"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileModal;