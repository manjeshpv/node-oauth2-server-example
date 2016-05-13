'use strict';

// Development specific configuration
// ==================================
module.exports = {

  // Sequelize connection opions
  quantum: {
    username: 'gloryque',
    password: 'intranet@quezx',
    database: 'gloryque_quantum',
    host: 'db.quezx.dev',
    dialect: 'mysql',
    logging: true,
    timezone: '+05:30',
  },

  // Seed database on startup
  seedDB: true

};
