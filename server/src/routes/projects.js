const router = require("express").Router();
const { body, validationResult } = require("express-validator");
const prisma = require("../lib/prisma");
const { authenticate, requireProjectAdmin } = require("../middleware/auth");

// Helper: check if user can access project
const canAccessProject = async (userId, projectId, userRole) => {
  if (userRole === "ADMIN") return true;
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return !!membership;
};

// GET /api/projects - list projects user is part of
router.get("/", authenticate, async (req, res) => {
  try {
    let projects;
    if (req.user.role === "ADMIN") {
      projects = await prisma.project.findMany({
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      projects = await prisma.project.findMany({
        where: {
          members: { some: { userId: req.user.id } },
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/projects - create project (admin only)
router.post(
  "/",
  authenticate,
  [
    body("name").trim().notEmpty().withMessage("Project name is required"),
    body("description").optional().trim(),
  ],
  async (req, res) => {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admins can create projects" });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, description, memberIds = [] } = req.body;

    try {
      const project = await prisma.project.create({
        data: {
          name,
          description,
          ownerId: req.user.id,
          members: {
            create: [
              { userId: req.user.id, role: "ADMIN" },
              ...memberIds
                .filter((id) => id !== req.user.id)
                .map((userId) => ({ userId, role: "MEMBER" })),
            ],
          },
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          _count: { select: { tasks: true } },
        },
      });
      res.status(201).json(project);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// GET /api/projects/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) return res.status(404).json({ message: "Project not found" });

    const access = await canAccessProject(req.user.id, project.id, req.user.role);
    if (!access) return res.status(403).json({ message: "Access denied" });

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/projects/:id
router.put("/:id", authenticate, requireProjectAdmin, async (req, res) => {
  const { name, description } = req.body;
  try {
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { name, description },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { tasks: true } },
      },
    });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/projects/:id
router.delete("/:id", authenticate, requireProjectAdmin, async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/projects/:id/members - add member
router.post("/:id/members", authenticate, requireProjectAdmin, async (req, res) => {
  const { userId, role = "MEMBER" } = req.body;
  try {
    const member = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: req.params.id, userId } },
      update: { role },
      create: { projectId: req.params.id, userId, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/projects/:id/members/:userId
router.delete("/:id/members/:userId", authenticate, requireProjectAdmin, async (req, res) => {
  try {
    await prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId: req.params.id, userId: req.params.userId },
      },
    });
    res.json({ message: "Member removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
