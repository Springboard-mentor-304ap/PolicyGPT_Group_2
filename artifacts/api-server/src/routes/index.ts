import { Router, type IRouter } from "express";
import healthRouter from "./health";
import policygptRouter from "./policygpt";

const router: IRouter = Router();

router.use(healthRouter);
router.use(policygptRouter);

export default router;
