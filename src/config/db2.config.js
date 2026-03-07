const { Sequelize } = require("sequelize");

// console.log('dbConfig:',dbConfig);
const sequelize = new Sequelize(
  process.env.DATABASE,
  process.env.USER_NAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.HOST,
    dialect: process.env.DIALECT,
    // dialectModule: require("mysql2"), // Add this line
    logging: false,
  }
);

const connection = async () => {
  try {
    await sequelize.authenticate();
    // await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.sync({ force: false });
    // await Admin.sync({ force: true });
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

module.exports = { sequelize, connection };
