const User = require("../models/User");

class UserController {
  // Método para criar um novo usuário
  static async createUser(req, res) {
    const { name, email, cpf, birthDate, password } = req.body;

    try {
      const user = await User.create({ name, email, cpf, birthDate, password });
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Método para autenticação com email e senha
  static async loginWithEmail(req, res) {
    const { email, password } = req.body;

    try {
      // Validar campos obrigatórios
      if (!email || !password) {
        return res.status(400).json({
          error: "Email e senha são obrigatórios",
        });
      }

      // Buscar usuário por email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: "Credenciais inválidas",
        });
      }

      // Verificar senha
      if (user.password !== password) {
        return res.status(401).json({
          error: "Credenciais inválidas",
        });
      }

      res.status(200).json({
        message: "Login realizado com sucesso",
        user: userResponse,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Método para autenticação com CPF e senha
  static async loginWithCpf(req, res) {
    const { cpf, password } = req.body;

    try {
      // Validar campos obrigatórios
      if (!cpf || !password) {
        return res.status(400).json({
          error: "CPF e senha são obrigatórios",
        });
      }

      // Buscar usuário por CPF
      const user = await User.findByCpf(cpf);
      if (!user) {
        return res.status(401).json({
          error: "Credenciais inválidas",
        });
      }

      // Verificar senha
      if (user.password !== password) {
        return res.status(401).json({
          error: "Credenciais inválidas",
        });
      }
      res.status(200).json({
        message: "Login realizado com sucesso",
        user: userResponse,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = UserController;
