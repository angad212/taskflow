const router = require("express").Router();
const prisma = require("../lib/prisma");
const { authenticate, requireAdmin } = require("../middleware/auth");

// GET /api/users - list all users (admin) or project members searchable
router.get("/", authenticate, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { name: "asc" },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/dashboard - overview stats for the logged-in user
router.get("/dashboard", authenticate, async (req, res) => {
  try {
    const now = new Date();

    let projectsWhere = {};
    let tasksWhere = {};

    if (req.user.role !== "ADMIN") {
      projectsWhere = { members: { some: { userId: req.user.id } } };
      tasksWhere = { project: { members: { some: { userId: req.user.id } } } };
    }

    const [
      totalProjects,
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      overdueTasks,
      myTasks,
      recentTasks,
    ] = await Promise.all([
      prisma.project.count({ where: projectsWhere }),
      prisma.task.count({ where: tasksWhere }),
      prisma.task.count({ where: { ...tasksWhere, status: "TODO" } }),
      prisma.task.count({ where: { ...tasksWhere, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { ...tasksWhere, status: "DONE" } }),
      prisma.task.count({
        where: {
          ...tasksWhere,
          dueDate: { lt: now },
          status: { not: "DONE" },
        },
      }),
      prisma.task.findMany({
        where: { assigneeId: req.user.id, status: { not: "DONE" } },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      prisma.task.findMany({
        where: tasksWhere,
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

    res.json({
      stats: { totalProjects, totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks },
      myTasks,
      recentTasks,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
