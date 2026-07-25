function Bone({ className = '' }) {
  return <div className={`bg-slate-200 rounded-lg animate-pulse ${className}`} />;
}

export function SkeletonLine({ width = '100%', height = '0.75rem' }) {
  return <Bone className="rounded-md" style={{ width, height }} />;
}

export function SkeletonCircle({ size = '2.5rem' }) {
  return <Bone className="rounded-full shrink-0" style={{ width: size, height: size }} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
      <SkeletonCircle size="3rem" />
      <div className="flex-1 space-y-2">
        <SkeletonLine width="40%" height="1.5rem" />
        <SkeletonLine width="60%" height="0.75rem" />
      </div>
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr className="border-b border-slate-50">
      <td className="px-6 py-4"><div className="flex items-center gap-3"><SkeletonCircle size="2.5rem" /><div className="space-y-1.5 flex-1"><SkeletonLine width="70%" height="0.875rem" /><SkeletonLine width="50%" height="0.75rem" /></div></div></td>
      <td className="px-6 py-4"><SkeletonLine width="50%" /></td>
      <td className="px-4 py-4"><SkeletonLine width="3rem" height="1.5rem" /></td>
      <td className="px-4 py-4"><SkeletonLine width="2.5rem" height="1.5rem" /></td>
      <td className="px-6 py-4 text-right"><SkeletonLine width="4rem" height="1.5rem" className="ml-auto" /></td>
    </tr>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="px-6 py-3.5"><SkeletonLine width="4rem" height="0.625rem" /></th>
            <th className="px-6 py-3.5"><SkeletonLine width="5rem" height="0.625rem" /></th>
            <th className="px-4 py-3.5"><SkeletonLine width="3rem" height="0.625rem" /></th>
            <th className="px-4 py-3.5"><SkeletonLine width="3rem" height="0.625rem" /></th>
            <th className="px-6 py-3.5 text-right"><SkeletonLine width="3rem" height="0.625rem" className="ml-auto" /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => <SkeletonTableRow key={i} />)}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonPage({ stats = 4, rows = 5, hasSearch = true }) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1"><SkeletonLine width="10rem" height="1.5rem" /><SkeletonLine width="16rem" height="0.75rem" /></div>
      </div>
      <div className={`grid gap-4 ${stats <= 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {Array.from({ length: stats }, (_, i) => <SkeletonCard key={i} />)}
      </div>
      {hasSearch && (
        <div className="flex items-center justify-between">
          <SkeletonLine width="20rem" height="2.5rem" className="rounded-xl" />
          <SkeletonLine width="8rem" height="2.5rem" className="rounded-xl" />
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <SkeletonTable rows={rows} />
      </div>
    </div>
  );
}
