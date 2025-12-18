import express from "express";
import productRoutes from "./routes/products.js";

const app = express();
app.use(express.json());

app.use("/products", productRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
