const db = require("../config/database");

class Asset {
  constructor(id, nome, tipo, categoria, createdAt) {
    this.id = id;
    this.nome = nome;
    this.tipo = tipo; // 'ação' ou 'renda fixa'
    this.categoria = categoria; // ex.: Agro, Serviços, Tecnologia
    this.createdAt = createdAt;
  }
}

module.exports = Asset;
