'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, RefreshCw, FileText } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [actionSearch, setActionSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        entity: entityFilter,
        action: actionSearch,
        page: page.toString(),
        limit: '20',
      });
      setLogs(res.items || []);
      setPagination(res.pagination || { totalPages: 1, totalItems: 0 });
    } catch (err) {
      console.error('Error fetching audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, actionSearch, page]);

  return (
    <div className="flex bg-[#0b0f19] min-h-screen text-slate-100">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col pb-16">
        <Header title="Administrative Security & Operations Audit Logs" />

        <div className="pt-20 px-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Filter by action (e.g. REFILL, LOGIN, MACHINE)..."
                  value={actionSearch}
                  onChange={(e) => { setActionSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              <select
                value={entityFilter}
                onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500"
              >
                <option value="ALL">All Entities</option>
                <option value="Machine">Machine</option>
                <option value="Stock">Stock</option>
                <option value="Payment">Payment</option>
                <option value="User">User</option>
                <option value="System">System</option>
              </select>
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Action</th>
                    <th className="py-3.5 px-4 font-semibold">Entity</th>
                    <th className="py-3.5 px-4 font-semibold">Entity ID</th>
                    <th className="py-3.5 px-4 font-semibold">Actor / User</th>
                    <th className="py-3.5 px-4 font-semibold">IP Address</th>
                    <th className="py-3.5 px-4 font-semibold">Details</th>
                    <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        Loading audit trail...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No audit records found matching query.
                      </td>
                    </tr>
                  ) : (
                    logs.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-pink-400 font-mono">
                          {a.action}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold">
                            {a.entity}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">{a.entityId || 'N/A'}</td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200 font-semibold">{a.userName}</div>
                          <div className="text-[10px] text-slate-500">{a.userRole}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{a.ipAddress || '127.0.0.1'}</td>
                        <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate font-mono text-[11px]">
                          {a.metadata || a.newValues || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-400">
                          {new Date(a.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div>Page {page} of {pagination.totalPages} ({pagination.totalItems} entries)</div>
                <div className="flex space-x-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
