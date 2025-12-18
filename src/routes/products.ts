import { Router } from "express";
import {
  createProduct,
  decreaseStock,
  getProduct,
  getTransactions,
  increaseStock,
} from "../controller/products";

const router = Router();

router.post("/", createProduct);

router.post("/:id/increase", increaseStock);

router.post("/:id/decrease", decreaseStock);

router.get("/:id", getProduct);

router.get("/:id/transactions", getTransactions);

export default router;
