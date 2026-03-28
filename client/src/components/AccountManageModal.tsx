import { useState } from "react";
import type { Account } from "../types";
import * as api from "../api";

interface Props {
  open: boolean;
  accounts: Account[];
  activeAccountId: string;
  onClose: () => void;
  onAccountsChange: () => void;
  onActiveAccountChange: (id: string) => void;
}

export default function AccountManageModal({
  open,
  accounts,
  activeAccountId,
  onClose,
  onAccountsChange,
  onActiveAccountChange,
}: Props) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    try {
      const account = await api.createAccount(newName.trim());
      setNewName("");
      onAccountsChange();
      onActiveAccountChange(account.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    }
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;
    setError(null);
    try {
      await api.updateAccount(id, editName.trim());
      setEditingId(null);
      onAccountsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename account");
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.deleteAccount(id);
      setConfirmDeleteId(null);
      if (activeAccountId === id) {
        const remaining = accounts.filter((a) => a.id !== id);
        if (remaining.length > 0) {
          onActiveAccountChange(remaining[0].id);
        }
      }
      onAccountsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    }
  }

  if (!open) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Manage Accounts</h3>

        {error && (
          <div className="alert alert-error mb-3 text-sm">
            <span>{error}</span>
            <button className="btn btn-xs btn-ghost" onClick={() => setError(null)}>dismiss</button>
          </div>
        )}

        <div className="space-y-2 mb-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`flex items-center gap-2 p-2 rounded-lg ${
                account.id === activeAccountId ? "bg-primary/10 border border-primary/30" : "bg-base-200"
              }`}
            >
              {editingId === account.id ? (
                <>
                  <input
                    type="text"
                    className="input input-bordered input-sm flex-1"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(account.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                  />
                  <button
                    className="btn btn-xs btn-primary"
                    onClick={() => handleRename(account.id)}
                  >
                    Save
                  </button>
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </>
              ) : confirmDeleteId === account.id ? (
                <>
                  <span className="flex-1 text-sm text-warning">
                    Delete "{account.name}" and all its data?
                  </span>
                  <button
                    className="btn btn-xs btn-error"
                    onClick={() => handleDelete(account.id)}
                  >
                    Delete
                  </button>
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium">{account.name}</span>
                  {account.id === activeAccountId && (
                    <span className="badge badge-primary badge-xs">Active</span>
                  )}
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={() => {
                      setEditingId(account.id);
                      setEditName(account.name);
                    }}
                  >
                    Rename
                  </button>
                  {accounts.length > 1 && (
                    <button
                      className="btn btn-xs btn-ghost text-error"
                      onClick={() => setConfirmDeleteId(account.id)}
                    >
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            className="input input-bordered input-sm flex-1"
            placeholder="New account name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-sm btn-primary"
            disabled={!newName.trim()}
          >
            Add Account
          </button>
        </form>

        <div className="modal-action">
          <button className="btn btn-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
