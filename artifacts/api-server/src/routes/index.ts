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
import authRouter from "./auth";
import storeRouter from "./store";
import cartRouter from "./cart";
import checkoutRouter from "./checkout";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(storeRouter);
router.use(cartRouter);
router.use(checkoutRouter);
router.use(paymentsRouter);
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
