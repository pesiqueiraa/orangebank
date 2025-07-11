// Importa o pool de conexão com o banco de dados PostgreSQL
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
  }

  // Método para encontrar um usuário pelo email ou CPF
  static async findByEmailOrCpf(login) {
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
  }

  // Método para encontrar um usuário pelo email
  static async findByEmail(email) {
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
  }
}

// Exporta a classe User para uso nos controllers e rotas
module.exports = User;
