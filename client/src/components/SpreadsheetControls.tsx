import { useState, useRef } from "react";
import * as api from "../api";

interface Props {
  onImportComplete: () => void;
}

interface ImportResults {
  balance: { updated: boolean };
  income: { created: number; updated: number; deleted: number };
  expenses: { created: number; updated: number; deleted: number };
  priceAdjustments: { created: number; updated: number; deleted: number };
  categories: { created: number; updated: number };
  errors: string[];
}

export default function SpreadsheetControls({ onImportComplete }: Props) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      const blob = await api.exportSpreadsheet();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `budget-tracker-${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setImportResult(null);
    try {
      const res = await api.importSpreadsheet(file);
      setImportResult(res.results as unknown as ImportResults);
      onImportComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function summaryLine(label: string, counts: { created: number; updated: number; deleted: number }) {
    const parts: string[] = [];
    if (counts.created > 0) parts.push(`${counts.created} added`);
    if (counts.updated > 0) parts.push(`${counts.updated} updated`);
    if (counts.deleted > 0) parts.push(`${counts.deleted} removed`);
    if (parts.length === 0) return null;
    return (
      <li key={label}>
        <span className="font-medium">{label}:</span> {parts.join(", ")}
      </li>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          className="btn btn-sm btn-outline gap-1"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          Export
        </button>

        <label className={`btn btn-sm btn-outline gap-1 ${importing ? "btn-disabled" : ""}`}>
          {importing ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
          Import
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleImport}
            disabled={importing}
          />
        </label>
      </div>

      {/* Import result toast */}
      {importResult && (
        <div className="toast toast-end toast-bottom z-50">
          <div className="alert alert-success shadow-lg max-w-sm">
            <div>
              <h4 className="font-bold text-sm">Import Complete</h4>
              <ul className="text-xs mt-1 space-y-0.5">
                {importResult.balance.updated && <li>Balance updated</li>}
                {summaryLine("Income", importResult.income)}
                {summaryLine("Expenses", importResult.expenses)}
                {summaryLine("Price Adj.", importResult.priceAdjustments)}
                {importResult.categories.updated > 0 && (
                  <li><span className="font-medium">Categories:</span> {importResult.categories.updated} synced</li>
                )}
              </ul>
              {importResult.errors.length > 0 && (
                <details className="mt-1">
                  <summary className="text-xs text-warning cursor-pointer">
                    {importResult.errors.length} warning(s)
                  </summary>
                  <ul className="text-xs mt-1">
                    {importResult.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => setImportResult(null)}
            >
              dismiss
            </button>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="toast toast-end toast-bottom z-50">
          <div className="alert alert-error shadow-lg max-w-sm">
            <span className="text-sm">{error}</span>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => setError(null)}
            >
              dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
}
