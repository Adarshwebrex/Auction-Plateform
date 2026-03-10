import { useEffect, useState } from "react";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AdminLayout from "../components/admin/AdminLayout";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to load users:", err);
      toast.error("Failed to load users");
    }
  }

  async function unbanUser(userId) {
    try {
      setLoading(true);
      await api.put(`/admin/users/${userId}/unban`);
      toast.success("User unbanned");
      loadUsers();
    } catch (err) {
      toast.error("Failed to unban user");
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(userId, newRole) {
    try {
      setLoading(true);
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success("User role updated");
      loadUsers();
    } catch {
      toast.error("Failed to update role");
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(userId) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      setLoading(true);
      await api.delete(`/admin/users/${userId}`);
      toast.success("User deleted");
      loadUsers();
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="relative pt-28 px-8 pb-20 max-w-7xl mx-auto text-white min-h-screen overflow-hidden">

      {/* === COSMIC BACKDROP === */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-10 w-[400px] h-[400px] bg-cyan-500 blur-[140px]" />
        <div className="absolute bottom-20 right-20 w-[400px] h-[400px] bg-purple-600 blur-[150px]" />
      </div>

      {/* === PAGE HEADER === */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-10 relative z-10"
      >
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition"
        >
          ← Back
        </button>

        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-300 to-purple-400 text-transparent bg-clip-text">
          User Management
        </h1>
      </motion.div>

      {/* === TABLE WRAPPER === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 overflow-x-auto no-scrollbar bg-white/10 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-xl"
      >
        <table className="w-full text-sm">
          <thead className="bg-white/10 border-b border-white/20">
            <tr>
              <th className="p-4 text-left text-gray-300">Name</th>
              <th className="p-4 text-left text-gray-300">Email</th>
              <th className="p-4 text-left text-gray-300">Role</th>
              <th className="p-4 text-left text-gray-300">Ban Status</th>
              <th className="p-4 text-center text-gray-300">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-6 text-center text-gray-400">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u, i) => (
                <motion.tr
                  key={u._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-white/10 hover:bg-white/5 transition"
                >
                  <td className="p-4 font-semibold text-white">{u.name}</td>
                  <td className="p-4 text-gray-300">{u.email}</td>

                  {/* ROLE DROPDOWN */}
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u._id, e.target.value)}
                      disabled={loading}
                      className="bg-white/10 backdrop-blur-lg border border-white/20 
                                 px-3 py-2 rounded-lg text-white outline-none cursor-pointer 
                                 hover:bg-white/20 transition disabled:opacity-50"
                    >
                      <option value="user" className="text-black">User</option>
                      <option value="seller" className="text-black">Seller</option>
                      <option value="admin" className="text-black">Admin</option>
                    </select>
                  </td>

                  {/* BAN STATUS */}
                  <td className="p-4">
                    {u.bannedUntil && new Date(u.bannedUntil) > new Date() ? (
                      <div>
                        <span className="px-2 py-0.5 text-xs rounded bg-red-600/20 border border-red-400/30 text-red-200">
                          Banned until {new Date(u.bannedUntil).toLocaleString()}
                        </span>
                        <div className="text-xs text-gray-300 mt-1">Violations: {u.withdrawalViolationCount || 0}</div>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 text-xs rounded bg-emerald-600/20 border border-emerald-400/30 text-emerald-200">Not Banned</span>
                    )}
                  </td>

                  {/* DELETE BUTTON */}
                  <td className="p-4 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      {u.bannedUntil && new Date(u.bannedUntil) > new Date() ? (
                        <button
                          onClick={() => unbanUser(u._id)}
                          disabled={loading}
                          className="px-4 py-2 bg-yellow-600 rounded-lg hover:bg-yellow-700 
                                     text-xs font-semibold transition disabled:opacity-50"
                        >
                          Unban
                        </button>
                      ) : null}
                      <button
                        onClick={() => deleteUser(u._id)}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 
                                   text-xs font-semibold transition disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>
      </div>
    </AdminLayout>
  );
}
