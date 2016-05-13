'use strict';

module.exports = function(sequelize, DataTypes) {
  var Group = sequelize.define('Group', {
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
  }, {
    tableName: 'groups',
    instanceMethods: {

    },

    classMethods: {
      associate: function associate(models) {
        //Group.belongsTo()
        //Group.belongsTo(models.Chain, {
        //  foreignKey: 'chainId',
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

  return Group;
}

