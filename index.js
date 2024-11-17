const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const cors = require("cors");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
// Middleware
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Vérifier si le répertoire 'uploads' existe et le créer s'il n'existe pas
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}



// Connexion à MongoDB
mongoose
  .connect(
    "mongodb+srv://abdoubencheikh01:191919AZ@cluster0.o3bel8w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connecté à MongoDB"))
  .catch((error) => console.error("Erreur de connexion à MongoDB :", error));

// Configurer multer pour stocker les images dans le dossier "uploads"
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Modèle d'article (Mongoose)
const articleSchema = new mongoose.Schema({
  title: String,
  domain: String,
  content: String,
  image: String,
  date: {
    type: Date,
    default: Date.now,
  },
});
const Article = mongoose.model("Article", articleSchema);

// Route pour ajouter un article avec une image
app.post("/addarticles", upload.single("image"), async (req, res) => {
  const { title, domain, content } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const newArticle = new Article({ title, domain, content, image });

  try {
    await newArticle.save();
    res.status(201).json(newArticle);
    console.log("articuleAdd");
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
    console.error("Erreur lors de la récupération des articles:", error);
    res.status(500).json({ message: error.message });
  }
});

app.post("/removearticle", async (req, res) => {
  try {
    const deletedArticle = await Article.findByIdAndDelete(req.body.id); // Utilise bien l'_id MongoDB
    if (!deletedArticle) {
      return res
        .status(404)
        .json({ success: false, error: "Article non trouvé" });
    }
    console.log("Article supprimé :", deletedArticle);
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'article :", error);
    res.status(500).json({ success: false, error: "Erreur serveur." });
  }
});

// Modèle d'article (Mongoose)
// Schéma de produit
const produitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ["Murs", "Dalles", "Poutres", "Colonnes", "Autres"], // Catégories possibles
  },
  description: {
    type: String,
    required: true,
  },
  dimensions: {
    length: { type: Number, required: true }, // en cm
    width: { type: Number, required: true }, // en cm
    height: { type: Number, required: true }, // en cm
  },
  weight: {
    type: Number, // en kg
    required: true,
  },
  material: {
    type: String,
    required: true,
    enum: ["Béton armé", "Béton précontraint", "Autre"], // Matériaux possibles
  },
  image: {
    type: String, // URL de l'image
    required: true,
  },
  price: {
    type: Number, // Prix en monnaie locale
    required: true,
  },
  availability: {
    type: Boolean,
    default: true,
  },
  customizable: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Produit = mongoose.model("Produit", produitSchema);

// Route POST pour ajouter un produit
app.post("/addproduct", upload.single("image"), async (req, res) => {
  const {
    name,
    category,
    description,
    dimensions,
    weight,
    material,
    price,
    availability,
    customizable,
  } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const newProduct = new Produit({
    name,
    category,
    description,
    dimensions: JSON.parse(dimensions), // Assurez-vous que les dimensions sont au format JSON
    weight,
    material,
    image,
    price,
    availability,
    customizable,
  });

  try {
    await newProduct.save();
    res.status(201).json(newProduct);
    console.log("Product added");
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route GET pour récupérer tous les produits
app.get("/products", async (req, res) => {
  try {
    const products = await Produit.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des produits." });
  }
});

app.post("/removeproduct", async (req, res) => {
  try {
    const deletedProduct = await Produit.findByIdAndDelete(req.body.id); // Utilise bien l'_id MongoDB
    if (!deletedProduct) {
      return res
        .status(404)
        .json({ success: false, error: "Product non trouvé" });
    }
    console.log("Product supprimé :", deletedProduct);
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'article :", error);
    res.status(500).json({ success: false, error: "Erreur serveur." });
  }
});


// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
