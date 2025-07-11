const express = require("express");
const UserController = require("../controllers/UserController");
const router = express.Router();

// Rota para criar um novo usuário
router.post("/users", UserController.createUser);