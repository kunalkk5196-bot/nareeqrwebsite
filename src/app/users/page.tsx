'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: 'Password@123',
    role: 'OPERATOR',
    phone: '',
  });

  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      setUsers(res || []);
    } catch (err) {
      console.error('Error fetching users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.createUser(newUser);
      setShowAddModal(false);
      setNewUser({ name: '', email: '', password: 'Password@123', role: 'OPERATOR', phone: '' });
      fetchUsers();
    } catch (err: any) {
      alert(`User creation failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.toggleUserStatus(id);
      fetchUsers();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  return (
    <div className="flex bg-[#0b0f19] min-h-screen text-slate-100">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col pb-16">
        <Header title="Administrator & Operator Accounts" />

        <div className="pt-20 px-8 max-w-6xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Role-Based Access Control (RBAC) governing machine management and financial reconciliation.
            </p>

            {currentUser?.role === 'SUPER_ADMIN' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-pink-600/20 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Admin User</span>
              </button>
            )}
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">User</th>
                    <th className="py-3.5 px-4 font-semibold">Email</th>
                    <th className="py-3.5 px-4 font-semibold">Role</th>
                    <th className="py-3.5 px-4 font-semibold">Phone</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold">Last Login</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        Loading users...
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-200">{u.name}</td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                              u.role === 'SUPER_ADMIN'
                                ? 'bg-purple-950 text-purple-300 border-purple-800'
                                : u.role === 'ADMIN'
                                ? 'bg-blue-950 text-blue-300 border-blue-800'
                                : u.role === 'OPERATOR'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : 'bg-slate-900 text-slate-400 border-slate-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{u.phone || '—'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${u.isActive ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                            <span>{u.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {currentUser?.role === 'SUPER_ADMIN' && u.id !== currentUser.id && (
                            <button
                              onClick={() => handleToggleStatus(u.id)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-semibold transition-colors"
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Create User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <h3 className="text-base font-bold text-slate-100 mb-1">Create Admin / Operator Account</h3>
              <p className="text-xs text-slate-400 mb-4">Set up an administrator with appropriate access permissions.</p>

              <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                  >
                    <option value="ADMIN">ADMIN (Machines, Transactions, Reports, Stock)</option>
                    <option value="OPERATOR">OPERATOR (Machine Monitoring, Stock Refills)</option>
                    <option value="VIEWER">VIEWER (Read-Only Telemetry & Reports)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
