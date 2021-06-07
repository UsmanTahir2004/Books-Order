const express = require("express");
const userController = require("../api/userController");
const router = express.Router();

router.post("/UserToAdmin", userController.assignRoleToUser);
router.post("/updateBook", userController.updateBook);
router.get("/buyBook", userController.buyBooks);
router.post("/publishBook", userController.publishBook);

module.exports = router;
