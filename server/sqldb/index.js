/**
 * Sequelize initialization module
 */

'use strict';

import path from 'path';
import config from '../config/environment';
import Sequelize from 'sequelize';
console.log(config.quantum)
var db = {
  Sequelize,
  sequelize: new Sequelize(    config.quantum.database, config.quantum.username,
    config.quantum.password, config.quantum)
};

// Insert models below
db.Chain = db.sequelize.import('./oauth/chain.model');
db.Group = db.sequelize.import('./oauth/group.model');
db.Thing = db.sequelize.import('../api/thing/thing.model');
db.User = db.sequelize.import('./oauth/user.model');
db.RefreshToken = db.sequelize.import('./oauth/refreshToken.model');
db.AccessToken = db.sequelize.import('./oauth/accessToken.model');
db.App = db.sequelize.import('./oauth/app.model');
db.AuthCode = db.sequelize.import('./oauth/authCode.model');

Object.keys(db).forEach(modelName => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});


module.exports = db;
