const User = require("../models/User");

class UserController {
  //POST /users - Método para criar um novo usuário
  static async createUser(req, res) {
    const { name, email, cpf, birthDate, password } = req.body;

    try {
      const user = await User.create({ name, email, cpf, birthDate, password });
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  //POST /users/login - Método para autenticação genérica (email ou CPF)
  static async loginUser(req, res) {
    const { login, password } = req.body;

    try {
      // Validar campos obrigatórios
      if (!login || !password) {
        return res.status(400).json({
          error: "Login e senha são obrigatórios",
        });
      }

      // Verificar se o login é um email (contém @) ou CPF
      const isEmail = login.includes('@');
      let user;

      if (isEmail) {
        user = await User.findByEmail(login);
      } else {
        user = await User.findByCpf(login);
      }

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

      // Criar resposta sem a senha
      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        birthDate: user.birthDate
      };

      res.status(200).json({
        message: "Login realizado com sucesso",
        user: userResponse,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  //POST /users - Método para autenticação com email e senha
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

      // Criar resposta sem a senha
      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        birthDate: user.birthDate
      };

      res.status(200).json({
        message: "Login realizado com sucesso",
        user: userResponse,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  //POST /users - Método para autenticação com CPF e senha
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

      // Criar resposta sem a senha
      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        birthDate: user.birthDate
      };

      res.status(200).json({
        message: "Login realizado com sucesso",
        user: userResponse,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  //GET /users - Método para encontrar um usuário pelo email ou CPF
  static async getUserByEmailOrCpf(req, res) {
    const { email, cpf } = req.query;

    try {
      // Validar pelo menos um campo
      if (!email && !cpf) {
        return res.status(400).json({
          error: "Pelo menos um dos campos (email ou CPF) é obrigatório",
        });
      }

      // Buscar usuário por email ou CPF
      const user = await User.findByEmailOrCpf(email, cpf);
      if (!user) {
        return res.status(404).json({
          error: "Usuário não encontrado",
        });
      }

      // Criar resposta sem a senha
      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        birthDate: user.birthDate
      };

      res.status(200).json(userResponse);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = UserController;
