const express = require("express");
const router = express.Router();

const userController = require("../controllers/usercontroller");

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/:id", userController.getUserById);
router.get("/", userController.getAllUsers);

module.exports = router;
