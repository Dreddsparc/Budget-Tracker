import { useState, useRef, useEffect } from "react";

interface Props {
  open: boolean;
  currentBalance: number | null;
  onSave: (amount: number) => void;
  onClose: () => void;
}

export default function SetBalanceModal({
  open,
  currentBalance,
  onSave,
  onClose,
}: Props) {
  const [amount, setAmount] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      setAmount(currentBalance !== null ? String(currentBalance) : "");
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open, currentBalance]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!isNaN(parsed)) {
      onSave(parsed);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box">
        <h3 className="font-bold text-lg">Set Current Balance</h3>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Balance Amount ($)</span>
            </label>
            <input
              type="number"
              step="0.01"
              className="input input-bordered w-full"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
}
