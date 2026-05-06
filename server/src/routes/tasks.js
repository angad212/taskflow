const router = require("express").Router();
const { body, validationResult } = require("express-validator");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");

const canAccessProject = async (userId, projectId, userRole) => {
  if (userRole === "ADMIN") return true;
  const m = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return !!m;
};

const isProjectAdmin = async (userId, projectId, userRole) => {
  if (userRole === "ADMIN") return true;
  const m = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return m?.role === "ADMIN";
};

// GET /api/projects/:projectId/tasks
router.get("/projects/:projectId/tasks", authenticate, async (req, res) => {
  const { projectId } = req.params;
  const access = await canAccessProject(req.user.id, projectId, req.user.role);
  if (!access) return res.status(403).json({ message: "Access denied" });

  const { status, priority, assigneeId } = req.query;
  const where = { projectId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId;

  try {
    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/projects/:projectId/tasks
router.post(
  "/projects/:projectId/tasks",
  authenticate,
  [
    body("title").trim().notEmpty().withMessage("Task title is required"),
    body("status").optional().isIn(["TODO", "IN_PROGRESS", "DONE"]),
    body("priority").optional().isIn(["LOW", "MEDIUM", "HIGH"]),
    body("dueDate").optional().isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { projectId } = req.params;
    const access = await canAccessProject(req.user.id, projectId, req.user.role);
    if (!access) return res.status(403).json({ message: "Access denied" });

    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    try {
      const task = await prisma.task.create({
        data: {
          title,
          description,
          status: status || "TODO",
          priority: priority || "MEDIUM",
          dueDate: dueDate ? new Date(dueDate) : null,
          projectId,
          assigneeId: assigneeId || null,
          createdById: req.user.id,
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
      });
      res.status(201).json(task);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// PUT /api/tasks/:id
router.put("/tasks/:id", authenticate, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
    });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const adminAccess = await isProjectAdmin(req.user.id, task.projectId, req.user.role);
    const isAssignee = task.assigneeId === req.user.id;
    const isCreator = task.createdById === req.user.id;

    // Members can update status of their assigned tasks; admins can edit everything
    if (!adminAccess && !isAssignee && !isCreator) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    const updateData = { status };
    if (adminAccess) {
      Object.assign(updateData, {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId !== undefined ? assigneeId : task.assigneeId,
      });
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/tasks/:id
router.delete("/tasks/:id", authenticate, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const adminAccess = await isProjectAdmin(req.user.id, task.projectId, req.user.role);
    if (!adminAccess) return res.status(403).json({ message: "Only project admins can delete tasks" });

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
