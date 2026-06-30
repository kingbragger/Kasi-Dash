import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import ordersRouter from "./orders";
import productsRouter from "./products";
import customersRouter from "./customers";
import inventoryRouter from "./inventory";
import analyticsRouter from "./analytics";
import notificationsRouter from "./notifications";
import settingsRouter from "./settings";
import insightsRouter from "./insights";
import buildforgeRouter from "./buildforge";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(ordersRouter);
router.use(productsRouter);
router.use(customersRouter);
router.use(inventoryRouter);
router.use(analyticsRouter);
router.use(notificationsRouter);
router.use(settingsRouter);
router.use(insightsRouter);
router.use(buildforgeRouter);

export default router;
