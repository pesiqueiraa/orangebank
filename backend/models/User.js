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
}

// Exporta a classe User para uso nos controllers e rotas
module.exports = User;
