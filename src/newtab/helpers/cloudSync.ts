export interface SyncProvider {
  name: "github" | "google";
  login(): Promise<void>;
  logout(): Promise<void>;
  isAuthenticated(): boolean;
  sync(localData: any): Promise<any>; // Returns merged data
  resolveConflict?(gistId: string, localData: any, choice: "upload" | "download"): Promise<any>;
}

class GitHubProvider implements SyncProvider {
  name: "github" = "github";
  private token: string | null = localStorage.getItem("tabme_gh_token");
  private gistDescription = "TabMe Dashboard Backup";
  private fileName = "tabme_data.json";

  async login(): Promise<void> {
    // Deprecated in favor of UI modal
  }

  async loginWithToken(token: string): Promise<boolean> {
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `token ${token}` }
      });
      if (res.ok) {
        this.token = token;
        localStorage.setItem("tabme_gh_token", token);
        // alert("Logged in successfully!"); // UI handles success
        return true;
      } else {
        alert("Invalid token.");
        return false;
      }
    } catch (e) {
      alert("Error logging in: " + e);
      return false;
    }
  }

  async logout(): Promise<void> {
    this.token = null;
    localStorage.removeItem("tabme_gh_token");
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  async sync(localData: any): Promise<any> {
    if (!this.token) throw new Error("Not logged in");

    // 1. Search for existing gist
    const gistsRes = await fetch("https://api.github.com/gists", {
      headers: { Authorization: `token ${this.token}` }
    });
    const gists = await gistsRes.json();
    const backupGist = gists.find((g: any) => g.description === this.gistDescription);

    if (backupGist) {
      // 2. Fetch content
      const contentRes = await fetch(backupGist.files[this.fileName].raw_url);
      const remoteData = await contentRes.json();

      // 3. Conflict Resolution
      const lastModified = new Date(backupGist.updated_at).toLocaleString();

      // Return Conflict Data to UI instead of using confirm()
      return {
        status: "conflict",
        remoteData,
        lastModified,
        gistId: backupGist.id
      };
    } else {
      // Create new Gist - AUTO CREATE for seamless UX?
      // Or return specific status to ask user confirmation to create?
      // Let's assume auto-create for "Sync Now" is fine, or we can prompt.
      // User complaint was about flickering, so prompts are bad.
      // Let's just create it.
      await fetch("https://api.github.com/gists", {
        method: "POST",
        headers: { Authorization: `token ${this.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          description: this.gistDescription,
          public: false,
          files: {
            [this.fileName]: {
              content: JSON.stringify(localData, null, 2)
            }
          }
        })
      });
      return { status: "created" };
    }
  }

  // Public method for UI to call when user resolves conflict
  async resolveConflict(gistId: string, localData: any, choice: "upload" | "download") {
    if (choice === "upload") {
      await this.updateGist(gistId, localData);
      return localData;
    } else {
      // Download was already fetched in sync() but we didn't save it. 
      // Optimization: we could pass it back, but fetching again is safer/easier here.
      // Actually, we returned remoteData in the conflict object, so the UI has it. 
      // But if we want to be strict, we can just return it.
      // Let's assume the UI will handle the state update if it chooses "download".
      // But if we want to keep logic here:
      const gistsRes = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: { Authorization: `token ${this.token}` }
      });
      const gist = await gistsRes.json();
      const contentRes = await fetch(gist.files[this.fileName].raw_url);
      return await contentRes.json();
    }
  }

  private async updateGist(gistId: string, data: any) {
    await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "PATCH",
      headers: { Authorization: `token ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        files: {
          [this.fileName]: {
            content: JSON.stringify(data, null, 2)
          }
        }
      })
    });
  }
}

export class CloudSyncManager {
  private provider: SyncProvider | undefined;
  private listeners: (() => void)[] = [];

  constructor() {
    // Restore provider if token exists
    if (localStorage.getItem("tabme_gh_token")) {
      this.provider = new GitHubProvider();
    }
  }

  get isLoggedIn() {
    return !!this.provider && this.provider.isAuthenticated();
  }

  get providerName() {
    return this.provider?.name;
  }

  async loginWithToken(providerName: "github" | "google", token: string): Promise<boolean> {
    console.log("Logging in to " + providerName + " with token");
    if (providerName === "github") {
      this.provider = new GitHubProvider();
      // Type assertion to access setToken (we need to update the interface or cast)
      // Simplified: GitHubProvider should have a setToken method or we pass it in constructor/login
      const success = await (this.provider as GitHubProvider).loginWithToken(token);
      if (success) {
        this.notifyListeners();
        return true;
      }
    }
    return false;
  }

  // Deprecated usage of prompt
  async login(providerName: "github" | "google") {
    // ... logic or just redirect to modal usage in UI
  }

  async logout() {
    await this.provider?.logout();
    this.provider = undefined;
    this.notifyListeners();
  }

  async sync(localData: any) {
    if (!this.provider) return;
    console.log("Syncing...");
    return this.provider.sync(localData);
  }

  async resolveConflict(gistId: string, localData: any, choice: "upload" | "download") {
    if (!this.provider || !this.provider.resolveConflict) return;
    return this.provider.resolveConflict(gistId, localData, choice);
  }

  addListener(cb: () => void) {
    this.listeners.push(cb);
  }

  removeListener(cb: () => void) {
    this.listeners = this.listeners.filter(l => l !== cb);
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb());
  }
}

export const syncManager = new CloudSyncManager();
