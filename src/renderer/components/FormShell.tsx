import type React from 'react';

type Props = {
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  onCancel?: () => void;
};

export function FormShell({ title, children, onSubmit, onCancel }: Props) {
  return (
    <div className="mb-5 border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 text-base font-semibold text-ink">{title}</div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
      <div className="mt-4 flex gap-2">
        <button onClick={onSubmit} className="bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
          Salvar
        </button>
        {onCancel ? (
          <button onClick={onCancel} className="border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancelar
          </button>
        ) : null}
      </div>
    </div>
  );
}
