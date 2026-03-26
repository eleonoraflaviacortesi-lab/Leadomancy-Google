import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-[var(--text-secondary)] mb-8">Pagina non trovata</p>
      <Link
        to="/"
        className="px-6 py-2 bg-[var(--accent)] text-[var(--accent-fg)] rounded-full text-sm font-medium"
      >
        Torna alla Dashboard
      </Link>
    </div>
  );
}
