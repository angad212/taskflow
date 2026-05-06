import { Calendar, User, AlertCircle } from "lucide-react";
import { format, isPast, isToday } from "date-fns";

const STATUS_STYLES = {
  TODO: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-emerald-100 text-emerald-700",
};

const PRIORITY_STYLES = {
  LOW: "bg-slate-100 text-slate-500",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-red-100 text-red-600",
};

const STATUS_LABELS = { TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" };

export default function TaskCard({ task, onClick, compact = false }) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "DONE";
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <div
      onClick={onClick}
      className={`card p-4 cursor-pointer hover:shadow-md hover:border-sky-200 transition-all ${compact ? "py-3" : ""}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={`text-sm font-medium text-slate-800 leading-snug ${task.status === "DONE" ? "line-through text-slate-400" : ""}`}>
          {task.title}
        </p>
        <span className={`badge shrink-0 ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
      </div>

      {task.description && !compact && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`badge ${STATUS_STYLES[task.status]}`}>{STATUS_LABELS[task.status]}</span>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          {task.assignee && (
            <span className="flex items-center gap-1">
              <User size={11} />
              {task.assignee.name}
            </span>
          )}
          {task.dueDate && (
            <span className={`flex items-center gap-1 ${isOverdue ? "text-red-500 font-medium" : isDueToday ? "text-amber-500 font-medium" : ""}`}>
              {isOverdue && <AlertCircle size={11} />}
              <Calendar size={11} />
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
        </div>
      </div>

      {task.project && !compact && (
        <p className="text-xs text-slate-400 mt-2">📁 {task.project.name}</p>
      )}
    </div>
  );
}
