/**
 * Express configuration
 */

'use strict';

import express from 'express';
import favicon from 'serve-favicon';
import morgan from 'morgan';
import compression from 'compression';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';
import path from 'path';
import lusca from 'lusca';
import config from './environment';
import session from 'express-session';
import sqldb from '../sqldb';
var User = sqldb.User;
var App = sqldb.App;
var AccessToken = sqldb.AccessToken;
var AuthCode = sqldb.AuthCode;
var RefreshToken = sqldb.RefreshToken;

export default function(app) {
  var env = app.get('env');

  app.set('views', config.root + '/server/views');
  app.set('view engine', 'jade');
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser());

  var oauthServer = require('oauth2-server');
  var Request = oauthServer.Request;
  var Response = oauthServer.Response;

  var model = {
    // Or, calling a node-style callback.
    getClient: function(clientId,clientSecret) {
      console.log("getclient",clientId,clientSecret)
      const options = {
        where: { client_id: clientId },
        attributes: ['id', 'client_id', 'redirect_uri'],
      };
      if (clientSecret) options.where.client_secret = clientSecret;

      return sqldb.App
        .findOne(options)
        .then(function serializeClient(client) {
          if (!client) return new Error("client not found");
          var clientWithGrants = client.toJSON()
          clientWithGrants.grants = ['authorization_code', 'password', 'refresh_token', 'client_credentials']
          clientWithGrants.redirectUris = [clientWithGrants.redirect_uri]
          //clientWithGrants.refreshTokenLifetime = integer optional
          //clientWithGrants.accessTokenLifetime  = integer optional
          console.log("clientWithGrants",clientWithGrants)
          return clientWithGrants
        })
        //.catch(callback);
    },

    // Or, returning a promise.
    getUser: function (username, password) {
      console.log("getUser",username, password)
      return User
        .findOne({
          where: { username },
          attributes: ['id', 'name', 'client_id', 'group_id', 'email_id', 'password'],
        })
        .then(function verifyPass(user) {
          return user.verifyPasswordAsync(password);
        })
        .catch(console.log);
    },

    getAccessToken: function (bearerToken,two,three) {
      console.log("getAccessToken",bearerToken,two,three)
      return AccessToken
        .findOne({
          where: { access_token: bearerToken },
          attributes: [['access_token','accessToken'], ['expires','accessTokenExpiresAt']],
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'client_id', 'group_id', 'email_id'],
            },
          ],
        })
        .then(accessToken => {
          if (!accessToken) return false;
          const token = accessToken.toJSON();
          token.user = token.User;
          // Todo: token.scope and token.client

          return  token;
        })
        .catch(console.log);
    },

    grantTypeAllowed: function grantTypeAllowed(clientId, grantType, callback) {
      console.log("grantTypeAllowed")
      callback(null, true);
      return;
    },
// https://github.com/oauthjs/node-oauth2-server/wiki/Migrating-from-2.x-to-3.x
    saveToken: function(accessToken, client, user ) {
      console.log("savetoken",accessToken)
      return AccessToken
        .build({ expires: accessToken.accessTokenExpiresAt })
        .set('app_id', client.id)
        .set('access_token', accessToken.accessToken)
        .set('user_id', user.id)
        .save()
      .then(token => {
        console.log("token",token.toJSON())
        return {
          accessToken: token.access_token,
          accessTokenExpiresAt: token.expires,
          client: {id:token.app_id},
          refreshToken: undefined,
          refreshTokenExpiresAt: undefined,
          user: {}
        }
      }).catch(console.log)
    },

    getAuthorizationCode: function getAuthCode(code) {
      console.log("getAuthCode",code)
      return AuthCode
        .findOne({
          where: { auth_code: code.authorizationCode},
          attributes: [['app_id', 'client_id'], 'expires', ['user_id', 'user_id']],
        })
        .then(function verifyAuthCode(authCodeModel) {
          if (!authCodeModel) return false;
          return authCodeModel.toJSON();
        })
        .catch(console.log);
    },

    saveAuthorizationCode: function(code, client,  user) {
      console.log("saveAuthorizationCode",code, client,  user)
      return AuthCode
        .build({  })
        .set('app_id', client.id)
        .set('auth_code', code.authorizationCode)
        .set('user_id', user.id)
        .save()
        .then(() => {
          console.log("authCode.authorizationCode",code.authorizationCode)
          return code.authorizationCode
        })
        .catch(err => {
          return console.log("authcode: console.log",err)
        });
    },
    getUserFromClient(client) {
      console.log("getUserFromClient(client)",client)
      const options = {
        where: { client_id: client.client_id },
        include: [User],
        attributes: ['id', 'client_id','redirect_uri'],
      };
      if (client.client_secret) options.where.client_secret = client.client_secret;

      return App
        .findOne(options)
        .then(client => {
          if (!client) return null;
          if (!client.User) return null;
          console.log(client.User.toJSON())
          return client.User.toJSON();
        }).catch(console.log)
    },


    saveRefreshToken: function saveRefreshToken(refreshToken, client, expires, user, callback) {
      console.log("saveRefreshToken",refreshToken,client, expires, user)
      return RefreshToken
        .build({ expires })
        .set('app_id', client.id)
        .set('refresh_token', refreshToken)
        .set('user_id', user.id)
        .save()
        .then(token => callback(null, token))
        .catch(callback);
    },

    getRefreshToken: function getRefreshToken(refreshToken) {
      console.log("getRefreshToken",refreshToken)
      return RefreshToken
        .findOne({
          where: { refresh_token: refreshToken },
          attributes: [['app_id', 'client_id'], 'user_id', 'expires'],
        })
        .then(function sendRefreshToken(refreshTokenModel) {
          if (!refreshTokenModel) return  false;
          return  refreshTokenModel.toJSON();
        })
        .catch(console.log);
    },

    generateToken: function generateToken(type, req, callback) {
      // reissue refreshToken if grantType is refresh_token
      if (type === 'refreshToken' && req.body.grant_type === 'refresh_token') {
        return callback(null, { refreshToken: req.body.refresh_token });
      }

      callback(null, false);
      return
    },
  };

  var oauth = new oauthServer({ model: model });

  app.all('/oauth/token', function(req,res,next){
    var request = new Request(req);
    var response = new Response(res);

    oauth.token(request,response).then(token => {
      return res.json(token)
    }).catch(console.log)
  });

  app.get('/authorise', (req, res) => {
    return App.findOne({
        where: {
          client_id: req.query.client_id,
          redirect_uri: req.query.redirect_uri,
        },
        attributes: ['id', 'name'],
      })
      .then(model => {
        if (!model) return res.status(404).json({ error: 'Invalid Client' });
        return res.json(model);
      })
      .catch(err => handleError(res, 500, err));
  });

  app.post('/authorise', (req, res) => {
    var request = new Request(req);
    var response = new Response(res);

    return oauth.authorize(request, response).then(x => {
      res.json(x)
    }).catch(err => {
      console.log("catch",err)
      res.status(500).json(err)
    })

    //((req) => {
    //  if (req.body.allow !== 'true') return callback(null, false);
    //  return callback(null, true, req.user);
    //})
  });


  //app.use(function(req,res){
  //  var request = new Request({
  //    headers: { authorization: req.headers.authorization },
  //    method: req.method,
  //    query: req.query,
  //    body: req.body
  //  });
  //  var response = new Response(res);
  //
  //  oauth.authenticate(request,response)
  //    .then(function(data) {
  //      console.log("yes",data)
  //      // Request is authorized.
  //    })
  //    .catch(function(e) {
  //      console.log("no",e)
  //      // Request is not authorized.
  //    });
  //})


  app.set('appPath', path.join(config.root, 'client'));

  if ('production' === env) {
    app.use(favicon(path.join(config.root, 'client', 'favicon.ico')));
    app.use(express.static(app.get('appPath')));
    app.use(morgan('dev'));
  }

  if ('development' === env) {
    app.use(require('connect-livereload')({
      ignore: [
        /^\/api\/(.*)/,
        /\.js(\?.*)?$/, /\.css(\?.*)?$/, /\.svg(\?.*)?$/, /\.ico(\?.*)?$/, /\.woff(\?.*)?$/,
        /\.png(\?.*)?$/, /\.jpg(\?.*)?$/, /\.jpeg(\?.*)?$/, /\.gif(\?.*)?$/, /\.pdf(\?.*)?$/
      ]
    }));
  }

  if ('development' === env || 'test' === env) {
    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(app.get('appPath')));
    app.use(morgan('dev'));
    app.use(errorHandler()); // Error handler - has to be last
  }
}
