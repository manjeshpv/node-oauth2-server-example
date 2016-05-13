'use strict';

module.exports = function(sequelize, DataTypes) {
  var Chain = sequelize.define('Chain', {
    id: {
      type: DataTypes.INTEGER(11),
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
      validate: {
        len: {
          args: [0, 100],
          msg: 'Maximum length for name field is 100',
        },
      },
      allowNull: false,
    },
    ownerId: DataTypes.INTEGER(11)
  }, {
    tableName: 'chains',
    instanceMethods: {

    },

    classMethods: {
      associate: function associate(models) {
        //Chain.belongsTo(models.User, {
        //  as: 'Owner',
        //  foreignKey: 'ownerId',
        //  constraints: false,
        //});
      },

    },

    hooks: {
      beforeCreate: function beforeCreate(instance) {

      },

      beforeUpdate: function beforeUpdate(instance) {

      },
    },
  });

  return Chain;
}

