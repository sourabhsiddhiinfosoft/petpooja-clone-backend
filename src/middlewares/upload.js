import multer from "multer";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📦 Local storage (for development)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

// ☁️ Cloudinary storage (for production)
const cloudStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "menu_images",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

const storage = isProduction ? cloudStorage : localStorage;

// File filter
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) cb(null, true);
  else cb(new Error("Only image files are allowed"));
};

export const upload = multer({ storage, fileFilter });




// only multer code is commented 
// import multer from "multer";
// import path from "path";

// // Define storage for local uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/menu/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

// // File type filter
// const fileFilter = (req, file, cb) => {
//   const allowed = /jpeg|jpg|png|webp/;
//   const ext = allowed.test(path.extname(file.originalname).toLowerCase());
//   if (ext) cb(null, true);
//   else cb(new Error("Only images are allowed!"));
// };

// const upload = multer({ storage, fileFilter });

// export default upload;
