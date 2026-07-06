"use client";

export function PrintButton() {
  return (
    <button className="button-secondary print-hidden" type="button" onClick={() => window.print()}>
      Print report
    </button>
  );
}
