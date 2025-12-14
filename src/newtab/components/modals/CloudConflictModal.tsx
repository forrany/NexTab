import React, { useState } from "react"

export const CloudConflictModal = (p: { 
    lastModified: string, 
    onResolve: (choice: "upload" | "download") => void, 
    onCancel: () => void 
}) => {
  return <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h3>Sync Conflict</h3>
        <button className="modal-close" onClick={p.onCancel}>&times;</button>
      </div>
      <div className="modal-body">
        <p>We found an existing backup in the cloud.</p>
        <p><b>Last Updated:</b> {p.lastModified}</p>
        <p>Please choose an action:</p>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <div style={{ flex: 1, padding: "10px", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
                <strong>Download</strong>
                <p style={{ fontSize: "12px", opacity: 0.8 }}>Replace local data with cloud data.</p>
            </div>
            <div style={{ flex: 1, padding: "10px", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
                <strong>Upload</strong>
                <p style={{ fontSize: "12px", opacity: 0.8 }}>Overwrite cloud data with local data.</p>
            </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn" onClick={p.onCancel}>Cancel Sync</button>
        <button className="btn" onClick={() => p.onResolve("download")}>Download (Cloud wins)</button>
        <button className="btn btn-primary" onClick={() => p.onResolve("upload")}>Upload (Local wins)</button>
      </div>
    </div>
  </div>
}
