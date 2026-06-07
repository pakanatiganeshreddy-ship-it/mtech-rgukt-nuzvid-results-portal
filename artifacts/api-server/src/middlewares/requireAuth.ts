import { Request, Response, NextFunction } from "express";

export function requireStudent(req: Request, res: Response, next: NextFunction) {
  if (!req.session.role) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  return next();
}
