const db = require("../config/database"); 

class Account {
    // Define o construtor da classe Account
    constructor(id, userId, balance, createdAt, updatedAt) {
        this.id = id;
        this.userId = userId;
        this.balance = balance;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}