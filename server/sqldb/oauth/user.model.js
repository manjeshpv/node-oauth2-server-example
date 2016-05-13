'use strict';

var crypto = require('crypto');
var salt = 'DYhG93b0fIxfs2guVoUubasdfajfkljasdjfaklsdjflakrfWwvniR2G0FgaC9mi';

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User',  {
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
    username: {
      type: DataTypes.STRING(32),
      validate: {
        len: {
          args: [0, 32],
          msg: 'Maximum length for username field is 32',
        },
      },
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(32),
      validate: {
        len: {
          args: [7, 32],
          msg: 'password field length should be between 7 and 32',
        },
      },
      allowNull: false,
    },
    number: {
      type: DataTypes.INTEGER(15),
      validate: {
        isInt: {
          msg: 'number field should be an integer',
        },
        len: {
          args: [0, 15],
          msg: 'Maximum length for number field is 15',
        },
      },
      allowNull: false,
    },
    is_active: {
      type: DataTypes.INTEGER(1),
      validate: {
        isInt: {
          msg: 'is_active field should be an integer',
        },
        len: {
          args: [0, 1],
          msg: 'Maximum length for is_active field is 1',
        },
      },
      allowNull: false,
      defaultValue: 1,
    },
    email_id: {
      type: DataTypes.STRING(64),
      validate: {
        len: {
          args: [0, 64],
          msg: 'Maximum length for email_id field is 64',
        },
      },
      allowNull: false,
    },
    consultant_id: {
      type: DataTypes.INTEGER(11),
      validate: {
        isInt: {
          msg: 'consultant_id field should be an integer',
        },
        len: {
          args: [0, 11],
          msg: 'Maximum length for consultant_id field is 11',
        },
      },
    },
    recruiter_id: {
      type: DataTypes.INTEGER(11),
      validate: {
        isInt: {
          msg: 'recruiter_id field should be an integer',
        },
        len: {
          args: [0, 11],
          msg: 'Maximum length for recruiter_id field is 11',
        },
      },
    },
    candidate_id: {
      type: DataTypes.INTEGER(11),
      validate: {
        isInt: {
          msg: 'candidate_id field should be an integer',
        },
        len: {
          args: [0, 11],
          msg: 'Maximum length for candidate_id field is 11',
        },
      },
    },
    timestamp: {
      type: DataTypes.DATE,

      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'users',
    timestamps: false,
    underscored: true,
    instanceMethods: {
      verifyPasswordAsync: function verifyPassword(password) {
        var hashedPass = crypto
          .createHash('md5')
          .update(salt + password)
          .digest('hex');
        return (hashedPass === this.password) ?
          this.toJSON() : new Error('Check password!');
      },

      hashPasswordAsync: function hashPassword(password) {
        return crypto
          .createHash('md5')
          .update(salt + password)
          .digest('hex');
      },
      verifyPassword: function verifyPassword(password, cb) {
        var hashedPass = crypto
          .createHash('md5')
          .update(salt + password)
          .digest('hex');
        return (hashedPass === this.password) ?
          cb(null, this.toJSON()) : cb(new Error('Check password!'));
      },

      hashPassword: function hashPassword(password) {
        return crypto
          .createHash('md5')
          .update(salt + password)
          .digest('hex');
      },
    },

    classMethods: {
      associate: function associate(models) {

        User.hasMany(models.App);
      },
      checkEmailExists: function(models,email){
        if (!models) return Promise.reject({code: 500, desc: "checkEmailExiists: models not found"})
        if (!email) return Promise.reject({code: 500, desc: "checkEmailExiists: email not found"})
        return models.User.count({ where: {email: email}}).then(function(rows){
          if (rows > 0) return Promise.resolve(true)
          return Promise.resolve(false)
        })
      },
      checkMobileExists: function(models,mobile){
        if (!models) return Promise.reject({code: 500, desc: "checkMobileExiists: models not found"})
        if (!mobile) return Promise.reject({code: 500, desc: "checkMobileExiists: mobile not found"})
        return models.User.count({ where: {mobile: mobile}}).then(function(rows){
          if (rows > 0) return Promise.resolve(true)
          return Promise.resolve(false)
        })
      },
      checkExists: function(models, email, mobile){
        // TODO Validatio for email id and phone number for same job

        return Promise.all([
              email ? models.User.checkEmailExists(models, email) : Promise.resolve(false),
              mobile ? models.User.checkMobileExists(models,  mobile) : Promise.resolve(false)
            ])
            .then(function(rePr){ return {email: rePr[0], mobile: rePr[1]} })
      },
    },

    hooks: {
      beforeCreate: function beforeCreate(instance) {
        if (instance.changed('password')) {
          instance
            .set('password', instance.hashPassword(instance.password));
        }
      },

      beforeUpdate: function beforeUpdate(instance) {
        if (instance.changed('password')) {
          instance
            .set('password', instance.hashPassword(instance.password));
        }
      },
    },
  });

  return User;
}

