const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const axios = require("axios");
const FormData = require("form-data");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connecté à MongoDB"))
  .catch((error) => console.error("Erreur de connexion à MongoDB :", error));

// Configuration de multer pour l'upload local temporaire
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Modèle d'Article
const articleSchema = new mongoose.Schema({
  title: String,
  domain: String,
  content: String,
  image: String,
  date: { type: Date, default: Date.now },
});
const Article = mongoose.model("Article", articleSchema);

// Modèle de Produit
const produitSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: ["Murs", "Dalles", "Poutres", "Colonnes", "Autres"] },
  description: { type: String, required: true },
  dimensions: { length: Number, width: Number, height: Number },
  weight: { type: Number, required: true },
  material: { type: String, required: true, enum: ["Béton armé", "Béton précontraint", "Autre"] },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  availability: { type: Boolean, default: true },
  customizable: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const Produit = mongoose.model("Produit", produitSchema);

// Route pour ajouter un article avec une image
app.post("/addarticles", upload.single("image"), async (req, res) => {
  const { title, domain, content } = req.body;
  let imageUrl = null;

  if (req.file) {
    const formData = new FormData();
    formData.append("image", fs.createReadStream(req.file.path));
    try {
      const response = await axios.post("https://back-end-kappa-seven.vercel.app/upload", formData, {
        headers: { ...formData.getHeaders() },
      });
      imageUrl = response.data.imageUrl;
    } catch (error) {
      return res.status(500).json({ message: "Erreur lors du téléchargement de l'image", error: error.message });
    }
  }

  const newArticle = new Article({ title, domain, content, image: imageUrl });
  try {
    await newArticle.save();
    res.status(201).json(newArticle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route pour ajouter un produit avec une image
app.post("/addproduct", upload.single("image"), async (req, res) => {
  const { name, category, description, dimensions, weight, material, price, availability, customizable } = req.body;
  let imageUrl = null;

  if (req.file) {
    const formData = new FormData();
    formData.append("image", fs.createReadStream(req.file.path));
    try {
      const response = await axios.post("https://back-end-kappa-seven.vercel.app/upload", formData, {
        headers: { ...formData.getHeaders() },
      });
      imageUrl = response.data.imageUrl;
    } catch (error) {
      return res.status(500).json({ message: "Erreur lors du téléchargement de l'image", error: error.message });
    }
  }

  const newProduct = new Produit({
    name,
    category,
    description,
    dimensions: JSON.parse(dimensions),
    weight,
    material,
    image: imageUrl,
    price,
    availability,
    customizable,
  });
  try {
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route pour récupérer les articles
app.get("/articles", async (req, res) => {
  try {
    const articles = await Article.find();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route pour récupérer les produits
app.get("/products", async (req, res) => {
  try {
    const products = await Produit.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des produits." });
  }
});

// Route pour supprimer un article
app.post("/removearticle", async (req, res) => {
  try {
    const deletedArticle = await Article.findByIdAndDelete(req.body.id);
    if (!deletedArticle) return res.status(404).json({ success: false, error: "Article non trouvé" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erreur serveur." });
  }
});

// Route pour supprimer un produit
app.post("/removeproduct", async (req, res) => {
  try {
    const deletedProduct = await Produit.findByIdAndDelete(req.body.id);
    if (!deletedProduct) return res.status(404).json({ success: false, error: "Produit non trouvé" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erreur serveur." });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
