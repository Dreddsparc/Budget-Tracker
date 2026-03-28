import { useState } from "react";
import type { CategoryColor } from "../types";
import * as api from "../api";

interface Props {
  open: boolean;
  categories: CategoryColor[];
  onClose: () => void;
  onCategoriesChange: () => void;
}

export default function CategoryManageModal({
  open,
  categories,
  onClose,
  onCategoriesChange,
}: Props) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [newDesc, setNewDesc] = useState("");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", color: "", description: "" });
  const [confirmDeleteName, setConfirmDeleteName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    try {
      await api.createCategory({
        name: newName.trim(),
        color: newColor,
        description: newDesc.trim(),
      });
      setNewName("");
      setNewColor("#3b82f6");
      setNewDesc("");
      onCategoriesChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    }
  }

  function startEditing(cat: CategoryColor) {
    setEditingName(cat.name);
    setEditForm({ name: cat.name, color: cat.color, description: cat.description });
    setConfirmDeleteName(null);
  }

  async function handleSaveEdit() {
    if (!editingName || !editForm.name.trim()) return;
    setError(null);
    try {
      await api.updateCategory(editingName, {
        color: editForm.color,
        description: editForm.description.trim(),
        newName: editForm.name.trim() !== editingName ? editForm.name.trim() : undefined,
      });
      setEditingName(null);
      onCategoriesChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category");
    }
  }

  async function handleDelete(name: string) {
    setError(null);
    try {
      await api.deleteCategory(name);
      setConfirmDeleteName(null);
      onCategoriesChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    }
  }

  if (!open) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-lg">
        <h3 className="font-bold text-lg mb-4">Manage Categories</h3>

        {error && (
          <div className="alert alert-error mb-3 text-sm">
            <span>{error}</span>
            <button className="btn btn-xs btn-ghost" onClick={() => setError(null)}>dismiss</button>
          </div>
        )}

        {/* Existing categories */}
        <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
          {categories.length === 0 && (
            <p className="text-base-content/50 text-sm text-center py-4">
              No categories yet. Add one below.
            </p>
          )}
          {categories.map((cat) => (
            <div key={cat.name}>
              {editingName === cat.name ? (
                <div className="p-3 bg-base-200 rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered input-sm flex-1"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Category name"
                    />
                    <input
                      type="color"
                      className="w-10 h-8 rounded cursor-pointer border border-base-content/20"
                      value={editForm.color}
                      onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                    />
                  </div>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Description (optional)"
                  />
                  <div className="flex gap-2 justify-end">
                    <button className="btn btn-xs btn-ghost" onClick={() => setEditingName(null)}>
                      Cancel
                    </button>
                    <button
                      className="btn btn-xs btn-primary"
                      onClick={handleSaveEdit}
                      disabled={!editForm.name.trim()}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : confirmDeleteName === cat.name ? (
                <div className="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
                  <span className="flex-1 text-sm text-warning">
                    Delete "{cat.name}"? Expenses using it will become uncategorized.
                  </span>
                  <button className="btn btn-xs btn-error" onClick={() => handleDelete(cat.name)}>
                    Delete
                  </button>
                  <button className="btn btn-xs btn-ghost" onClick={() => setConfirmDeleteName(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <span
                    className="w-4 h-4 rounded-full shrink-0 border border-base-content/20"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{cat.name}</span>
                    {cat.description && (
                      <p className="text-xs text-base-content/50 truncate">{cat.description}</p>
                    )}
                  </div>
                  <button className="btn btn-xs btn-ghost" onClick={() => startEditing(cat)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-xs btn-ghost text-error"
                    onClick={() => setConfirmDeleteName(cat.name)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add new category */}
        <form onSubmit={handleCreate} className="space-y-2 p-3 bg-base-200 rounded-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-base-content/70">
            Add New Category
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              className="input input-bordered input-sm flex-1"
              placeholder="Category name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              type="color"
              className="w-10 h-8 rounded cursor-pointer border border-base-content/20"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
            />
          </div>
          <input
            type="text"
            className="input input-bordered input-sm w-full"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-sm btn-primary"
              disabled={!newName.trim()}
            >
              Add Category
            </button>
          </div>
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
