import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { authRouter } from "./auth";
import { studentsRouter } from "./students";
import { resultsRouter } from "./results";
import { adminRouter } from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/students", studentsRouter);
router.use("/results", resultsRouter);
router.use("/admin", adminRouter);

export default router;
