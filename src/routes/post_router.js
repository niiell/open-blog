const express = require('express');
const app = express();
const multer = require('multer'); // Upload image
const postController = require('../controllers/post_controller');
const path = require('path');
const fs = require('fs');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      try {
        const uploadPath = path.join(__dirname, '../../public/img/post');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      } catch (err) {
        cb(new Error('Failed to create upload directory'));
      }
    },
    filename: function (req, file, cb) {
      try {
        const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
        cb(null, filename);
      } catch (err) {
        cb(new Error('Failed to process filename'));
      }
    }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});


app.get("/post/:postSlug", postController.show);
app.get("/tag/:postTag", postController.showTag);
app.get("/admin/tambah-post-baru", postController.create);
app.post("/admin/tambah-post-baru", upload.single('image'), postController.store);
app.get("/admin/tampil-semua-post", postController.indexAdmin);
app.post("/admin/tampil-semua-post", postController.findAdmin);
app.get("/admin/post/:postSlug", postController.showAdmin);
app.get("/admin/tag/:postTag", postController.showTagAdmin);
app.post("/admin/mengarsipkan-post/:postSlug", postController.archievingPostAdmin);
app.post("/admin/menghapus-post/:postSlug", postController.destroy);
app.get("/admin/arsip-post", postController.indexArchieveAdmin);
app.post("/admin/arsip-post", postController.findArchieveAdmin);
app.post("/admin/mengaktifkan-post/:postSlug", postController.activatePost);
app.get("/admin/mengubah-post/:postSlug", postController.modify);
app.post("/admin/mengubah-post/:postSlug", upload.single('image'), postController.update);


module.exports = app;