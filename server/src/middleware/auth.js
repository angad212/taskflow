const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Check if user is project admin OR global admin
const requireProjectAdmin = async (req, res, next) => {
  if (req.user.role === "ADMIN") return next();

  const projectId = req.params.id || req.params.projectId;
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: req.user.id } },
  });

  if (!membership || membership.role !== "ADMIN") {
    return res.status(403).json({ message: "Project admin access required" });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireProjectAdmin };
