import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://localhost/clientmarket", { useNewUrlParser: true, useUnifiedTopology: true });

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "user" }
});
const User = mongoose.model("User", UserSchema);

const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  image: String
});
const Product = mongoose.model("Product", ProductSchema);

const OrderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  items: [{ productId: String, quantity: Number }],
  total: Number,
  status: { type: String, default: "pending" }
});
const Order = mongoose.model("Order", OrderSchema);

// Регистрация
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ name, email, password: hash });
    res.json({ message: "Пользователь создан" });
  } catch (e) {
    res.status(400).json({ error: "Пользователь уже существует" });
  }
});

// Логин
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Неверный email или пароль" });
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(401).json({ error: "Неверный email или пароль" });
  const token = jwt.sign({ id: user._id, role: user.role }, "SECRET_KEY", { expiresIn: "1d" });
  res.json({ token, name: user.name });
});

// Получить товары
app.get("/api/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Добавить товар (для админа, здесь без проверки роли пока)
app.post("/api/products", async (req, res) => {
  const { name, price, category, image } = req.body;
  const product = await Product.create({ name, price, category, image });
  res.json(product);
});

// Создать заказ
app.post("/api/orders", async (req, res) => {
  const { userId, items, total } = req.body;
  const order = await Order.create({ userId, items, total });
  res.json(order);
});

// Получить заказы пользователя
app.get("/api/orders/:userId", async (req, res) => {
  const orders = await Order.find({ userId: req.params.userId });
  res.json(orders);
});

// Запуск сервера
app.listen(4000, () => console.log("Server running on http://localhost:4000"));

