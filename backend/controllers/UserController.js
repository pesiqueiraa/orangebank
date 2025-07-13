const User = require("../models/User");

class UserController {
  //POST /users - Método para criar um novo usuário
  static async createUser(req, res) {
    const { name, email, cpf, birthDate, password } = req.body;

    try {
      // O método User.create agora cria tanto o usuário quanto suas contas
      const user = await User.create({ name, email, cpf, birthDate, password });

      // Preparar resposta sem incluir a senha
      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        birthDate: user.birthDate,
        accounts: user.accounts, // Incluir as contas criadas na resposta
      };

      res.status(201).json({
        message: "Usuário e contas criados com sucesso",
        user: userResponse,
      });
    } catch (error) {
      // Tratar erros específicos de validação
      if (
        error.message.includes("Email já cadastrado") ||
        error.message.includes("CPF já cadastrado")
      ) {
        return res.status(400).json({ error: error.message });
      }

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
      const isEmail = login.includes("@");
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
        birthDate: user.birthDate,
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
        birthDate: user.birthDate,
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
        birthDate: user.birthDate,
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
        birthDate: user.birthDate,
      };

      res.status(200).json(userResponse);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Buscar usuário pelo Email
   * GET /api/users/email/:email
   */
  static async getUserByEmail(req, res) {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email é obrigatório",
        });
      }

      const user = await User.findByEmail(email);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      // Return only necessary data
      return res.status(200).json({
        success: true,
        message: "Usuário encontrado",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      });
    }
  }

  /**
   * Obter saldo de OrangeCoins do usuário
   * GET /api/users/:userId/orangecoins
   */
  static async getOrangeCoins(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "ID do usuário é obrigatório"
        });
      }

      // Usar o modelo para buscar os OrangeCoins
      const orangeCoins = await User.getOrangeCoins(userId);
      
      if (orangeCoins === null) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado"
        });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          orangeCoins: orangeCoins
        }
      });
    } catch (error) {
      console.error(`Erro ao obter saldo de OrangeCoins: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "Erro ao obter saldo de OrangeCoins",
        error: error.message
      });
    }
  }
}

module.exports = UserController;
