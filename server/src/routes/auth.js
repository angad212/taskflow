const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role } = req.body;

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing)
        return res.status(409).json({ message: "Email already in use" });

      const hashed = await bcrypt.hash(password, 12);

      // First user becomes admin automatically
      const count = await prisma.user.count();
      const assignedRole = count === 0 ? "ADMIN" : role === "ADMIN" ? "ADMIN" : "MEMBER";

      const user = await prisma.user.create({
        data: { name, email, password: hashed, role: assignedRole },
        select: { id: true, name: true, email: true, role: true },
      });

      const token = signToken(user.id);
      res.status(201).json({ user, token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user)
        return res.status(401).json({ message: "Invalid credentials" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid)
        return res.status(401).json({ message: "Invalid credentials" });

      const token = signToken(user.id);
      res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// GET /api/auth/me
router.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
