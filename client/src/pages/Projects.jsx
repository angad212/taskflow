import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import Modal from "../components/Modal";
import toast from "react-hot-toast";
import {
  Plus, FolderKanban, Users, CheckSquare, Trash2, Edit2,
  ChevronRight, Loader2, Search
} from "lucide-react";
import { format } from "date-fns";

export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", description: "", memberIds: [] });
  const [saving, setSaving] = useState(false);

  const fetchProjects = () =>
    api.get("/projects").then(({ data }) => setProjects(data));

  useEffect(() => {
    Promise.all([fetchProjects(), api.get("/users").then(({ data }) => setUsers(data))])
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditProject(null);
    setForm({ name: "", description: "", memberIds: [] });
    setShowModal(true);
  };

  const openEdit = (project) => {
    setEditProject(project);
    setForm({
      name: project.name,
      description: project.description || "",
      memberIds: project.members.map((m) => m.userId),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Project name required"); return; }
    setSaving(true);
    try {
      if (editProject) {
        await api.put(`/projects/${editProject.id}`, form);
        toast.success("Project updated");
      } else {
        await api.post("/projects", form);
        toast.success("Project created");
      }
      setShowModal(false);
      await fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving project");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this project and all its tasks? This cannot be undone.")) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success("Project deleted");
      setProjects((p) => p.filter((x) => x.id !== id));
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleMember = (userId) => {
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(userId)
        ? f.memberIds.filter((id) => id !== userId)
        : [...f.memberIds, userId],
    }));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
          <p className="text-sm text-slate-500 mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""} total</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          className="input pl-9"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderKanban size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No projects yet</p>
          {isAdmin && (
            <button className="btn-primary mt-4" onClick={openCreate}>
              <Plus size={16} /> Create first project
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <div key={project.id} className="card p-5 hover:shadow-md hover:border-sky-200 transition-all group">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                  <FolderKanban size={17} className="text-sky-600" />
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(project)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit2 size={13} className="text-slate-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={13} className="text-red-500" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-slate-800 mb-1">{project.name}</h3>
              {project.description && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{project.description}</p>
              )}

              <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1">
                  <Users size={11} /> {project.members.length} members
                </span>
                <span className="flex items-center gap-1">
                  <CheckSquare size={11} /> {project._count.tasks} tasks
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {format(new Date(project.createdAt), "MMM d, yyyy")}
                </span>
                <Link
                  to={`/projects/${project.id}`}
                  className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline"
                >
                  Open <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editProject ? "Edit Project" : "New Project"}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Project Name *</label>
            <input
              className="input"
              placeholder="e.g. Marketing Campaign Q2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[80px] resize-none"
              placeholder="What's this project about?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {!editProject && (
            <div>
              <label className="label">Add Team Members</label>
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                {users.map((u) => (
                  <label key={u.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.memberIds.includes(u.id)}
                      onChange={() => toggleMember(u.id)}
                      className="rounded border-slate-300"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                    <span className={`ml-auto badge ${u.role === "ADMIN" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}`}>
                      {u.role}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary flex-1 justify-center" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : null}
              {editProject ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
