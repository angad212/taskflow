import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import Modal from "../components/Modal";
import TaskCard from "../components/TaskCard";
import toast from "react-hot-toast";
import {
  ArrowLeft, Plus, Users, Trash2, Edit2, Loader2,
  Filter, SlidersHorizontal, UserPlus, X, CheckCircle2
} from "lucide-react";
import { format } from "date-fns";

const STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
const STATUS_LABELS = { TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" };
const STATUS_COLORS = {
  TODO: "border-slate-300 bg-slate-50",
  IN_PROGRESS: "border-blue-300 bg-blue-50",
  DONE: "border-emerald-300 bg-emerald-50",
};
const STATUS_HEADER = {
  TODO: "bg-slate-200 text-slate-700",
  IN_PROGRESS: "bg-blue-200 text-blue-800",
  DONE: "bg-emerald-200 text-emerald-800",
};

const EMPTY_TASK = {
  title: "", description: "", status: "TODO", priority: "MEDIUM",
  dueDate: "", assigneeId: "",
};

export default function ProjectDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");

  const fetchProject = async () => {
    const { data } = await api.get(`/projects/${id}`);
    setProject(data);
  };

  useEffect(() => {
    Promise.all([
      fetchProject(),
      api.get("/users").then(({ data }) => setAllUsers(data)),
    ]).finally(() => setLoading(false));
  }, [id]);

  const isProjectAdmin = useMemo(() => {
    if (isAdmin) return true;
    if (!project) return false;
    const m = project.members.find((m) => m.userId === user.id);
    return m?.role === "ADMIN";
  }, [project, user, isAdmin]);

  const filteredTasks = useMemo(() => {
    if (!project) return {};
    return STATUSES.reduce((acc, s) => {
      acc[s] = project.tasks.filter((t) => {
        if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
        if (filterPriority !== "ALL" && t.priority !== filterPriority) return false;
        return true;
      }).filter((t) => t.status === s);
      return acc;
    }, {});
  }, [project, filterStatus, filterPriority]);

  const openCreateTask = () => {
    setEditTask(null);
    setTaskForm(EMPTY_TASK);
    setTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
      assigneeId: task.assigneeId || "",
    });
    setTaskModal(true);
  };

  const saveTask = async () => {
    if (!taskForm.title.trim()) { toast.error("Task title required"); return; }
    setSaving(true);
    try {
      if (editTask) {
        await api.put(`/tasks/${editTask.id}`, taskForm);
        toast.success("Task updated");
      } else {
        await api.post(`/projects/${id}/tasks`, taskForm);
        toast.success("Task created");
      }
      setTaskModal(false);
      await fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving task");
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success("Task deleted");
      await fetchProject();
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const addMember = async (userId) => {
    try {
      await api.post(`/projects/${id}/members`, { userId });
      toast.success("Member added");
      await fetchProject();
    } catch {
      toast.error("Failed to add member");
    }
  };

  const removeMember = async (userId) => {
    if (!confirm("Remove this member?")) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      toast.success("Member removed");
      await fetchProject();
    } catch {
      toast.error("Failed to remove member");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
    </div>
  );
  if (!project) return <div className="p-8 text-center text-slate-500">Project not found</div>;

  const memberUserIds = project.members.map((m) => m.userId);
  const nonMembers = allUsers.filter((u) => !memberUserIds.includes(u.id));

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link to="/projects" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft size={16} className="text-slate-500" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-800">{project.name}</h1>
              {project.description && (
                <p className="text-xs text-slate-500">{project.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Member avatars */}
            <div className="flex -space-x-2 mr-2">
              {project.members.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  title={m.user.name}
                  className="w-7 h-7 rounded-full bg-sky-100 border-2 border-white flex items-center justify-center text-xs font-bold text-sky-700"
                >
                  {m.user.name[0].toUpperCase()}
                </div>
              ))}
              {project.members.length > 5 && (
                <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-500">
                  +{project.members.length - 5}
                </div>
              )}
            </div>

            {isProjectAdmin && (
              <button className="btn-secondary text-xs py-1.5" onClick={() => setMemberModal(true)}>
                <UserPlus size={13} /> Manage
              </button>
            )}
            <button className="btn-primary text-xs py-1.5" onClick={openCreateTask}>
              <Plus size={14} /> Add Task
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <SlidersHorizontal size={13} /> Filters:
          </div>
          <select
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="ALL">All Priorities</option>
            {["LOW", "MEDIUM", "HIGH"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {(filterStatus !== "ALL" || filterPriority !== "ALL") && (
            <button
              className="text-xs text-red-500 flex items-center gap-1 hover:underline"
              onClick={() => { setFilterStatus("ALL"); setFilterPriority("ALL"); }}
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-5 min-w-[600px] h-full">
          {STATUSES.map((status) => (
            <div key={status} className={`flex-1 min-w-[260px] rounded-xl border-2 ${STATUS_COLORS[status]} flex flex-col overflow-hidden`}>
              <div className={`px-4 py-3 flex items-center justify-between ${STATUS_HEADER[status]} rounded-t-lg`}>
                <span className="text-sm font-semibold">{STATUS_LABELS[status]}</span>
                <span className="text-xs font-bold bg-white/50 px-2 py-0.5 rounded-full">
                  {filteredTasks[status]?.length ?? 0}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {filteredTasks[status]?.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <CheckCircle2 size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No tasks here</p>
                  </div>
                ) : (
                  filteredTasks[status].map((task) => (
                    <div key={task.id} className="relative group">
                      <TaskCard task={task} onClick={() => openEditTask(task)} />
                      {isProjectAdmin && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                          className="absolute top-2 right-2 p-1 bg-white border border-slate-200 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                        >
                          <Trash2 size={11} className="text-red-500" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-dashed border-current opacity-20">
                <button
                  onClick={openCreateTask}
                  className="w-full text-xs text-center py-1.5 rounded-lg hover:bg-black/5 transition-colors opacity-100"
                >
                  + Add task
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Modal */}
      <Modal
        isOpen={taskModal}
        onClose={() => setTaskModal(false)}
        title={editTask ? "Edit Task" : "New Task"}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              placeholder="Task title"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[80px] resize-none"
              placeholder="Optional details..."
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={taskForm.status}
                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input"
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
              >
                {["LOW", "MEDIUM", "HIGH"].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Due Date</label>
              <input
                type="date"
                className="input"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Assign To</label>
              <select
                className="input"
                value={taskForm.assigneeId}
                onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
              >
                <option value="">Unassigned</option>
                {project.members.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.user.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setTaskModal(false)}>Cancel</button>
            <button className="btn-primary flex-1 justify-center" onClick={saveTask} disabled={saving}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : null}
              {editTask ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Member Management Modal */}
      <Modal
        isOpen={memberModal}
        onClose={() => setMemberModal(false)}
        title="Manage Members"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Current Members ({project.members.length})</p>
            <div className="space-y-2">
              {project.members.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sm font-bold text-sky-700">
                      {m.user.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{m.user.name}</p>
                      <p className="text-xs text-slate-500">{m.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${m.role === "ADMIN" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}`}>
                      {m.role}
                    </span>
                    {m.userId !== user.id && (
                      <button
                        onClick={() => removeMember(m.userId)}
                        className="p-1.5 hover:bg-red-50 rounded-lg"
                      >
                        <X size={13} className="text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {nonMembers.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Add Members</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {nonMembers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                        {u.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => addMember(u.id)}
                      className="btn-primary text-xs py-1.5"
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
