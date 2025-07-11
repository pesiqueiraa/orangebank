const db = require("../config/database");

class User {
  // Define o construtor da classe User
  constructor(id, name, email, cpf, birthDate, password, createdAt, updatedAt) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.cpf = cpf;
    this.birthDate = birthDate;
    this.password = password;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
  // Método para criar um novo usuário
  static async create({ name, email, cpf, birthDate, password }) {
    try {
      const result = await db.query(
        `
        INSERT INTO users (name, email, cpf, birth_date, password, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
        `,
        [name, email, cpf, birthDate, password]
      );

      const user = result.rows[0];

      return new User(
        user.id,
        user.name,
        user.email,
        user.cpf,
        user.birth_date,
        user.password,
        user.created_at,
        user.updated_at
      );
    } catch (error) {
      throw new Error("Erro ao criar usuário: " + error.message);
    }
  }
  // Método para encontrar um usuário pelo email ou CPF
  static async findByEmailOrCpf(login) {
    try {
      const result = await db.query(
        `SELECT * FROM users WHERE email = $1 OR cpf = $1`,
        [login]
      );

      if (result.rows.length === 0) return null;

      const user = result.rows[0];

      return new User(
        user.id,
        user.name,
        user.email,
        user.cpf,
        user.birth_date,
        user.password,
        user.created_at,
        user.updated_at
      );
    } catch (error) {
      throw new Error("Erro ao buscar por email ou CPF: " + error.message);
    }
  }
  // Método para encontrar um usuário pelo email
  static async findByEmail(email) {
    try {
      const result = await db.query(`SELECT * FROM users WHERE email = $1`, [
        email,
      ]);

      if (result.rows.length === 0) return null;

      const user = result.rows[0];

      return new User(
        user.id,
        user.name,
        user.email,
        user.cpf,
        user.birth_date,
        user.password,
        user.created_at,
        user.updated_at
      );
    } catch (error) {
      throw new Error("Erro ao buscar por email: " + error.message);
    }
  }
  // Método para encontrar um usuário pelo CPF
  static async findByCpf(cpf) {
    try {
      const result = await db.query(`SELECT * FROM users WHERE cpf = $1`, [
        cpf,
      ]);

      if (result.rows.length === 0) return null;

      const user = result.rows[0];

      return new User(
        user.id,
        user.name,
        user.email,
        user.cpf,
        user.birth_date,
        user.password,
        user.created_at,
        user.updated_at
      );
    } catch (error) {
      throw new Error("Erro ao buscar por CPF: " + error.message);
    }
  }

  // Método para encontrar um usuário pelo ID
  static async findById(id) {
    try {
      const result = await db.query(`SELECT * FROM users WHERE id = $1`, [id]);

      if (result.rows.length === 0) return null;

      const user = result.rows[0];

      return new User(
        user.id,
        user.name,
        user.email,
        user.cpf,
        user.birth_date,
        user.password,
        user.created_at,
        user.updated_at
      );
    } catch (error) {
      throw new Error("Erro ao buscar por ID: " + error.message);
    }
  }

  // Método para atualizar dados do usuário
  static async update(id, { name, email, birthDate }) {
    try {
      const result = await db.query(
        `
        UPDATE users 
        SET name = COALESCE($1, name), 
            email = COALESCE($2, email), 
            birth_date = COALESCE($3, birth_date),
            updated_at = NOW()
        WHERE id = $4
        RETURNING *
        `,
        [name, email, birthDate, id]
      );

      if (result.rows.length === 0) return null;

      const user = result.rows[0];

      return new User(
        user.id,
        user.name,
        user.email,
        user.cpf,
        user.birth_date,
        user.password,
        user.created_at,
        user.updated_at
      );
    } catch (error) {
      throw new Error("Erro ao atualizar usuário: " + error.message);
    }
  }

  // Método para atualizar senha do usuário
  static async updatePassword(id, newPassword) {
    try {
      const result = await db.query(
        `
        UPDATE users 
        SET password = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id
        `,
        [newPassword, id]
      );

      if (result.rows.length === 0) {
        throw new Error("Usuário não encontrado");
      }

      return true;
    } catch (error) {
      throw new Error("Erro ao atualizar senha: " + error.message);
    }
  }

  static async findAll() {
    try {
      const result = await db.query("SELECT * FROM users ORDER BY name ASC");
      return result.rows.map(
        (row) =>
          new User(
            row.id,
            row.name,
            row.email,
            row.cpf,
            row.birth_date,
            row.password,
            row.created_at,
            row.updated_at
          )
      );
    } catch (error) {
      throw new Error("Erro ao buscar usuários: " + error.message);
    }
  }
}

module.exports = User;
