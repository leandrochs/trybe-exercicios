// index.js
const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');

const { Address, Employee } = require('./src/models');
const config = require('./src/config/config');

const app = express();
app.use(bodyParser.json());

// const sequelize = new Sequelize(config.development);
/*
  Essa linha será importante para que consigamos isolar nosso teste
  utilizando a configuração `test` do seu `config.{js | json}`
*/
const sequelize = new Sequelize(
  process.env.NODE_ENV === 'test' ? config.test : config.development,
);

app.get('/employees', async (_req, res) => {
  try {
    const employees = await Employee.findAll({
      include: { model: Address, as: 'addresses' },
    });

    return res.status(200).json(employees);
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ message: 'Ocorreu um erro' });
  }
});

app.get('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOne({
      where: { id },
      include: [{ model: Address, as: 'addresses' }],
    });

    if (!employee)
      return res.status(404).json({ message: 'Funcionário não encontrado' });

    return res.status(200).json(employee);
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ message: 'Algo deu errado' });
  }
});

// SEM GARANTIA ACID
// app.post('/employees', async (req, res) => {
//   try {
//     const { firstName, lastName, age, city, street, number } = req.body;

//     const employee = await Employee.create({ firstName, lastName, age });

//     await Address.create({ city, street, number, employeeId: employee.id });

//     return res.status(201).json({ message: 'Cadastrado com sucesso' });
//   } catch (e) {
//     console.log(e.message);
//     res.status(500).json({ message: 'Algo deu errado' });
//   }
// });

// Unmanaged transactions
app.post('/employees', async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { firstName, lastName, age, city, street, number } = req.body;

    const employee = await Employee.create(
      { firstName, lastName, age },
      { transaction: t },
    );

    await Address.create(
      { city, street, number, employeeId: employee.id },
      { transaction: t },
    );

    await t.commit();

    return res.status(201).json({
      id: employee.id, // esse dado será nossa referência para validar a transação
      message: 'Cadastrado com sucesso',
    });
  } catch (e) {
    await t.rollback();
    console.log(e.message);
    res.status(500).json({ message: 'Algo deu errado' });
  }
});

// Managed transactions
// app.post('/employees', async (req, res) => {
//   try {
//     const { firstName, lastName, age, city, street, number } = req.body;

//     const result = await sequelize.transaction(async (t) => {
//       const employee = await Employee.create({
//         firstName, lastName, age
//       }, { transaction: t });

//       await Address.create({
//         city, street, number, employeeId: employee.id
//       }, { transaction: t });

//       return res.status(201).json({ message: 'Cadastrado com sucesso' });
//     });

//     console.log(result);

//     // Se chegou até aqui é porque as operações foram concluídas com sucesso,
//     // não sendo necessário finalizar a transação manualmente.
//     // `result` terá o resultado da transação, no caso um empregado e o endereço cadastrado
//   } catch (e) {
//     // Se entrou nesse bloco é porque alguma operação falhou.
//     // Nesse caso, o sequelize irá reverter as operações anteriores com a função rollback, não sendo necessário fazer manualmente
//     console.log(e.message);
//     res.status(500).json({ message: 'Algo deu errado' });
//   }
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Ouvindo na porta ${PORT}`));

module.exports = app;
