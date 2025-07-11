const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const routes = require('./routes'); 

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Usar as rotas com prefixo opcional (ex: /api/users)
app.use('/api', routes);


app.listen(port, () => {
    console.log(`Servidor rodando na porta http://localhost:${port}`);
}); 
