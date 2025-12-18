import dotenv from "dotenv";
import express from "express";
import productRoutes from "./routes/products.js";
dotenv.config();

const app = express();
app.use(express.json());

app.use("/products", productRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
