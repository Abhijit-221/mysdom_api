const { Sequelize } = require("sequelize");

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
// const sequelize = new Sequelize('mysql://avnadmin:AVNS_9If4yV9DFE67N5_ogNM@mysql-80c0d57-swain-96d5.l.aivencloud.com:12504/defaultdb?ssl-mode=REQUIRED');
const connection = async () => {
  try {
    await sequelize.authenticate();
    // await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.sync({ force: false });
    // await BGVRequest.sync({ force: true });
    
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

module.exports = { sequelize, connection };
