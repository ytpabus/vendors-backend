import React, { useState } from "react";

const FileModal = ({ vendorId, files, isOpen, onClose, onUpload, onDelete, isAdmin }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-xl w-full max-w-xl max-h-[80vh] overflow-y-auto relative shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl"
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
            className="border p-1 w-full"
          />
        </div>

        <ul className="space-y-2">
          {files.map((url, idx) => {
            const filename = url.split("/").pop();
            return (
              <li
                key={idx}
                className="flex items-center justify-between border p-2 rounded hover:bg-gray-100"
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate w-3/4"
                >
                  📄 {filename}
                </a>
                <div className="flex space-x-2">
                  <button
                    className="text-green-600 hover:text-green-800"
                    onClick={() => setSelectedFile(url)}
                  >
                    🔍
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => onDelete(url)}
                      className="text-red-500 hover:text-red-700"
                    >
                      🗑️
                    </button>
                  )}
                </div>
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
