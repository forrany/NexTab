import React, { useState } from "react"
import { showErrorMessage, showMessage } from "../../helpers/actionsHelpersWithDOM"
import { syncManager } from "../../helpers/cloudSync"

export const CloudLoginModal = (p: { onClose: () => void }) => {
  const [token, setToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const onSave = async () => {
    if (!token) return

    setIsLoading(true)
    try {
      // We need to implement a way to pass token to syncManager instead of it prompting
      // But for now we can update the token in syncManager directly if we refactor it
      // Let's assume we update syncManager to accept token
      const success = await syncManager.loginWithToken("github", token)
      if (success) {
        p.onClose()
      } else {
        // Error handling inside loginWithToken check
      }
    } catch (e: any) {
      alert("Error: " + e.message)
    } finally {
      setIsLoading(false)
    }
  }

  return <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h3>Login to GitHub</h3>
        <button className="modal-close" onClick={p.onClose}>&times;</button>
      </div>
      <div className="modal-body">
        <p>To sync with GitHub, you need a <b>Personal Access Token</b> with <code>gist</code> scope.</p>
        <p><a href="https://github.com/settings/tokens/new?scopes=gist&description=TabMe+Sync" target="_blank" rel="noreferrer">Click here to generate one</a></p>
        
        <input
          type="text"
          className="input-text"
          placeholder="ghp_..."
          value={token}
          onChange={e => setToken(e.target.value)}
          style={{ width: "100%", marginTop: "10px" }}
        />
      </div>
      <div className="modal-footer">
        <button className="btn" onClick={p.onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={onSave} disabled={isLoading || !token}>
          {isLoading ? "Verifying..." : "Login"}
        </button>
      </div>
    </div>
  </div>
}
