const express = require("express");
const UserController = require("../controllers/UserController");
const router = express.Router();

// Rota para criar um novo usuário
router.post("/", UserController.createUser);

// Rota para login genérico (email ou CPF)
router.post("/login", UserController.loginUser);

// Rota para login com email
router.post("/login/email", UserController.loginWithEmail);

// Rota para login com CPF
router.post("/login/cpf", UserController.loginWithCpf);

// Rota para obter usuário por email
router.get("/email/:email", UserController.getUserByEmail);

// Rota para obter saldo de OrangeCoins
router.get('/:userId/orangecoins', UserController.getOrangeCoins);

module.exports = router;