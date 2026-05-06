import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import TaskCard from "../components/TaskCard";
import {
  LayoutDashboard, FolderKanban, CheckCircle2, Clock, AlertTriangle,
  ListTodo, TrendingUp, ArrowRight
} from "lucide-react";

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/users/dashboard")
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
    </div>
  );

  const { stats = {}, myTasks = [], recentTasks = [] } = data || {};
  const completion = stats.totalTasks > 0
    ? Math.round((stats.doneTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-800">
          Good {getGreeting()}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Here's what's happening with your projects</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <div className="col-span-2 lg:col-span-1 xl:col-span-2">
          <StatCard label="Projects" value={stats.totalProjects ?? 0} icon={FolderKanban} color="bg-sky-500" />
        </div>
        <div className="col-span-1">
          <StatCard label="To Do" value={stats.todoTasks ?? 0} icon={ListTodo} color="bg-slate-500" />
        </div>
        <div className="col-span-1">
          <StatCard label="In Progress" value={stats.inProgressTasks ?? 0} icon={Clock} color="bg-blue-500" />
        </div>
        <div className="col-span-1">
          <StatCard label="Done" value={stats.doneTasks ?? 0} icon={CheckCircle2} color="bg-emerald-500" />
        </div>
        <div className="col-span-1">
          <StatCard label="Overdue" value={stats.overdueTasks ?? 0} icon={AlertTriangle} color="bg-red-500" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="card p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-sky-600" />
            <span className="text-sm font-semibold text-slate-700">Overall Completion</span>
          </div>
          <span className="text-sm font-bold text-sky-600">{completion}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-sky-400 to-sky-600 h-2.5 rounded-full transition-all duration-700"
            style={{ width: `${completion}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">{stats.doneTasks ?? 0} of {stats.totalTasks ?? 0} tasks completed</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">My Pending Tasks</h2>
            <Link to="/projects" className="text-xs text-sky-600 flex items-center gap-1 hover:underline">
              View projects <ArrowRight size={12} />
            </Link>
          </div>
          {myTasks.length === 0 ? (
            <div className="card p-8 text-center">
              <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">All caught up! No pending tasks.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTasks.map((task) => (
                <TaskCard key={task.id} task={task} compact />
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">Recent Tasks</h2>
          </div>
          {recentTasks.length === 0 ? (
            <div className="card p-8 text-center">
              <LayoutDashboard size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No tasks yet. Create a project to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.slice(0, 5).map((task) => (
                <TaskCard key={task.id} task={task} compact />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
