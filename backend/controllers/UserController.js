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
}

module.exports = UserController;