import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";
import type { Request, Response } from "express";

export const createProduct = async (req: Request, res: Response) => {
  const { name, sku, initialStock } = req.body;

  if (!name || !sku || !initialStock || initialStock < 0) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        stock: initialStock,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({ message: "SKU must be unique" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const increaseStock = async (req: Request, res: Response) => {
  const { quantity } = req.body;
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  const parsedQuantity = parseInt(quantity, 10);

  if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
    return res
      .status(400)
      .json({ message: "Quantity must be a positive number" });
  }

  const product = await prisma.product.findUnique({
    where: { id: id },
  });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const updated = await prisma.$transaction([
    prisma.product.update({
      where: { id: product.id },
      data: { stock: product.stock + parsedQuantity },
    }),
    prisma.transaction.create({
      data: {
        productId: product.id,
        type: "INCREASE",
        quantity: parsedQuantity,
      },
    }),
  ]);

  res.json(updated[0]);
};

export const decreaseStock = async (req: Request, res: Response) => {
  const { quantity } = req.body;
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  const parsedQuantity = parseInt(quantity, 10);
  if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
    return res
      .status(400)
      .json({ message: "Quantity must be a positive number" });
  }

  const product = await prisma.product.findUnique({
    where: { id: id },
  });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (product.stock < parsedQuantity) {
    return res.status(400).json({ message: "Insufficient stock" });
  }

  const updated = await prisma.$transaction([
    prisma.product.update({
      where: { id: product.id },
      data: { stock: product.stock - parsedQuantity },
    }),
    prisma.transaction.create({
      data: {
        productId: product.id,
        type: "DECREASE",
        quantity: parsedQuantity,
      },
    }),
  ]);

  res.json(updated[0]);
};

export const getProduct = async (req: Request, res: Response) => {
  const id = req.params.id;
  
  if (!id) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  const product = await prisma.product.findUnique({
    where: { id: id },
    include: { transactions: true },
  });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const totalIncreased = product.transactions
    .filter((t) => t.type === "INCREASE")
    .reduce((sum, t) => sum + t.quantity, 0);

  const totalDecreased = product.transactions
    .filter((t) => t.type === "DECREASE")
    .reduce((sum, t) => sum + t.quantity, 0);

  res.json({
    id: product.id,
    name: product.name,
    sku: product.sku,
    currentStock: product.stock,
    totalIncreased,
    totalDecreased,
  });
};

export const getTransactions = async (req: Request, res: Response) => {
  const id = req.params.id;
  
  if (!id) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  const transactions = await prisma.transaction.findMany({
    where: { productId: id },
    orderBy: { createdAt: "desc" },
  });

  res.json(transactions);
};
