const express = require("express");
const userController = require("../api/userController");
const multer = require("multer");
// var cloudinary = require("cloudinary").v2;

var path = require("path");

const router = express.Router();

router.post("/register-User", userController.registerUser);
router.get("/login-users", userController.loginUser);
router.get("/verifyEmail", userController.verifyEmail);

// router.get("/upload", fileUpload.single("image"), userController.upload);

// router.post("/uploadImage", userController.upload);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname + "/../uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 2,
  },
});
router.post(
  "/uploadImage",
  multer({ storage: storage }).single("myFile"),
  userController.imageUpload
);

router.post(
  "/upload-Image",
  multer({ storage: storage }).single("image"),
  userController.uploadImage
);

module.exports = router;
