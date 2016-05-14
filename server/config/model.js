/**
 * Created by Manjesh on 14-05-2016.
 */
import _ from 'lodash';
import sqldb from '../sqldb';
var User = sqldb.User;
var App = sqldb.App;
var AccessToken = sqldb.AccessToken;
var AuthCode = sqldb.AuthCode;
var RefreshToken = sqldb.RefreshToken;

/**
 * Access Token
 * @typedef AccessToken
 * @type Object
 * @property {string} accessToken
 * @property {Date} accessTokenExpiresAt
 * @property {Client} client
 * @property {string} scope  Options
 * @property {User} user
 */

/**
 * Returns a Access Token
 * @param bearerToken String
 * @returns { AccessToken }
 */
const getAccessToken = (bearerToken) => {
  console.log("getAccessToken",bearerToken)
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
    .catch(err => console.log("getAccessToken - Err: "));
}



// Or, calling a node-style callback.
function getClient(clientId,clientSecret) {
  console.log("getclient",clientId, clientSecret)
  const options = {
    where: { client_id: clientId },
    attributes: ['id', 'client_id', 'redirect_uri'],
  };
  if (clientSecret) options.where.client_secret = clientSecret;

  return sqldb.App
    .findOne(options)
    .then(function serializeClient(client) {
      console.log("client details",client.toJSON())
      if (!client) return new Error("client not found");
      var clientWithGrants = client.toJSON()
      clientWithGrants.grants = ['authorization_code', 'password', 'refresh_token', 'client_credentials']
      // Todo: need to create another table for redirect URIs
      clientWithGrants.redirectUris = [clientWithGrants.redirect_uri]
      delete clientWithGrants.redirect_uri
      //clientWithGrants.refreshTokenLifetime = integer optional
      //clientWithGrants.accessTokenLifetime  = integer optional
      return clientWithGrants
    }).catch(err => console.log("getClient - Err: ", err));
}

// Or, returning a promise.
function getUser (username, password) {
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
}

/**
 *
 * @param code
 * @returns {*} expiresAt
 */

const revokeAuthorizationCode = (code) => {
  console.log('revokeAuthorizationCode',code);
  return AuthCode.findOne({
    where:{
      auth_code: code.code
    }
  }).then(rCode => {
    //if(rCode) rCode.destroy();
    /***
     * As per the discussion we need set older date
     * revokeToken will expected return a boolean in future version
     * https://github.com/oauthjs/node-oauth2-server/pull/274
     * https://github.com/oauthjs/node-oauth2-server/issues/290
     */
    var expiredCode = code
    expiredCode.expiresAt  = new Date('2015-05-28T06:59:53.000Z')
    return expiredCode
  }).catch(err => console.log('revokeToken - Err: ',err))
  //return code
  //return RefreshToken.findOne({
  //  where:{
  //    refresh_token: token.refreshToken
  //  }
  //}).then(rT => {
  //  if(rT) rT.destroy();
  //  /***
  //   * As per the discussion we need set older date
  //   * revokeToken will expected return a boolean in future version
  //   * https://github.com/oauthjs/node-oauth2-server/pull/274
  //   * https://github.com/oauthjs/node-oauth2-server/issues/290
  //   */
  //  var expiredToken = token
  //  expiredToken.refreshTokenExpiresAt = new Date('2015-05-28T06:59:53.000Z')
  //  return expiredToken
  //})
}

/**
 * RefreshToken as param to revokeToken - got from getRefreshToken()
 * @typedef RefreshTokenforRevokeToken
 * @type Object
 * @property {string} refreshToken
 * @property {string} refresh_token  - Proxy to refreshToken
 * @property {Date} refreshTokenExpiresAt - Optional
 * @property {Client} client
 * @property {User} user
 */

/**
 *
 * @param {RefreshTokenforRevokeToken} token
 * @returns {*}
 */

const revokeToken = (token) => {
  return RefreshToken.findOne({
    where:{
      refresh_token: token.refreshToken
    }
  }).then(rT => {
    if(rT) rT.destroy();
    /***
     * As per the discussion we need set older date
     * revokeToken will expected return a boolean in future version
     * https://github.com/oauthjs/node-oauth2-server/pull/274
     * https://github.com/oauthjs/node-oauth2-server/issues/290
      */
    var expiredToken = token
    expiredToken.refreshTokenExpiresAt = new Date('2015-05-28T06:59:53.000Z')
    return expiredToken
  }).catch(err => console.log('revokeToken - Err: ',err))
}


/**
 * SavedAccessToken
 * @typedef SavedAccessToken
 * @type Object
 * @property {string} accessToken
 * @property {Date} accessTokenExpiresAt
 * @property {Client} client
 * @property {string} scope  Optional
 * @property {string} refreshToken optional
 * @property {Date} refreshTokenExpiresAt optional
 * @property {User} user
 */

/**
 * TokenToSave
 * @typedef TokenToSave
 * @type Object
 * @property {string} accessToken
 * @property {Date} accessTokenExpiresAt
 * @property {string} refreshToken
 * @property {Date} refreshTokenExpiresAt
 * @property {string} scope
 */

/**
 * Client Object as Parameter to SaveToken()
 * @typedef ClientAsParam
 * @type Object
 * @property {number} id
 * @property {string} client_id
 * @property {Array} grants - Array of OAuth grants allowed for the client
 * @property {Array} redirectUris - Array of redirectURIs allowed
 * @property {Date} refreshTokenExpiresAt
 * @property {string} scope
 * We can add extra fields while returning from getClient()
 */

/**
 * User Object as Parameter to SaveToken()
 * @typedef UserAsParam
 * @type Object
 * @property {number} id
 * @property {string} username
 * @property {Array} password
 * As per need We can add extra fields while returning from getUser()
 */

/**
 * Returns Saved AccessToken
 * @param {TokenToSave} token
 * @param {ClientAsParam} client
 * @param user
 * @returns {Promise.<T>|*}
 */


function saveToken(token, client, user) {
  console.log("savetoken",token,!!client,!!user)
  return Promise.all([
    AccessToken.create({
      access_token: token.accessToken,
      expires: token.accessTokenExpiresAt,
      app_id: client.id,
      user_id: user.id,
    }),
    RefreshToken.create({
      refresh_token: token.refreshToken,
      expires: token.refreshTokenExpiresAt,
      app_id: client.id,
      user_id: user.id,
    }),

  ])
    .then(resultsArray => _.assign(  // expected to return client and user, but not returning
      {
        client,
        user,
        access_token: token.accessToken, // proxy
        refresh_token: token.refreshToken, // proxy
      },
      token
    ))
    .catch(err=> console.log("saveToken - Error:", err))
}

/**
 * RefreshToken returning from  getRefreshToken()
 * @typedef getAuthorizationCodeReturn
 * @type Object
 * @property {Client} client
 * @property {Date} expiresAt
 * @property {string} redirectUri - Optional
 * @property {User} user
 */

/***
 *
 * @param {string} code
 * @returns  * @returns {Promise.<getAuthorizationCodeReturn>|*}
 */

function getAuthorizationCode(code) {
  console.log("getAuthCode",code)
  return AuthCode
    .findOne({
      attributes: [['app_id', 'client_id'], 'expires', ['user_id', 'user_id']],
      where: { auth_code: code},
      include: [User,App]
    })
    .then(function verifyAuthCode(authCodeModel) {
      if (!authCodeModel) return false;
      console.log("get auth code return ", authCodeModel.toJSON())
      const client = authCodeModel.App.toJSON()
      const user =  authCodeModel.User.toJSON()
      return {
        code,
        client,
        expiresAt: authCodeModel.expires,
        redirectUri: client.redirect_uri,
        user
      };
    })
    .catch(err => console.log("getAuthorizationCode",err));
}

function saveAuthorizationCode(code, client,  user) {
  console.log("saveAuthorizationCode",code, !!client,  !!user)
  return AuthCode
    .build({ expires: code.expiresAt })
    .set('app_id', client.id)
    .set('auth_code', code.authorizationCode)
    .set('user_id', user.id)
    .save()
    .then(() => {
      console.log("authCode.authorizationCode",code.authorizationCode)
      code.code = code.authorizationCode
      return code
    })
    .catch(err => {
      return console.log("saveAuthorizationCode: Err: ",err)
    });
}

function getUserFromClient(client) {
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
    }).catch(err => console.log('getUserFromClient', err))
}


/**
 * RefreshToken returning from  getRefreshToken()
 * @typedef RefreshTokenReturn
 * @type Object
 * @property {string} refreshToken
 * @property {Client} client
 * @property {Date} refreshTokenExpiresAt - Optional
 * @property {string} scope - Optional
 * @property {User} user
 */


/**
 * Returns a RefreshToken Object
 * @param {string} token
 * @returns {RefreshTokenReturn}
 */

const getRefreshToken = (refreshToken) => {
  console.log("getRefreshToken",refreshToken)
  if(!refreshToken || refreshToken==='undefined') return false

  return RefreshToken
    .findOne({
      attributes: [['app_id', 'client_id'], 'user_id', 'expires'],
      where: { refresh_token: refreshToken },
      include: [App,User]

    })
    .then(savedRT => {
        const tokenTemp ={
          user: savedRT ? savedRT.User.toJSON() : {},
          client: savedRT ? savedRT.App.toJSON() : {},
          refreshTokenExpiresAt: savedRT ? new Date(savedRT.expires) : null,
          refreshToken,
          refresh_token: refreshToken
        };
      console.log("tokenTemp",tokenTemp)
        return tokenTemp;
    }).catch(err => console.log("getRefershToken - Error: ",err));
}

const validateScope = (token, scope) => {
  console.log("validateScope", token, scope)
  return 1
}


module.exports = {
  //generateAccessToken, optional - used for jwt
  //generateAuthorizationCode, optional
  //generateRefreshToken, - optional
  getAccessToken,
  //getAuthCode,
  getClient,
  getRefreshToken,
  getUser,
  getUserFromClient,
  getAuthorizationCode,

  //grantTypeAllowed, Removed in oauth2-server 3.0
  revokeAuthorizationCode,
  revokeToken,
  saveToken,//saveAccessToken, renamed to
  saveAuthorizationCode, //renamed saveAuthCode,
  validateScope,
}



//function saveRefreshToken(token, client, user, callback) {
//  console.log("saveRefreshToken",refreshToken,client, expires, user)
//  return RefreshToken
//    .build({ expires })
//    .set('app_id', client.id)
//    .set('refresh_token', refreshToken)
//    .set('user_id', user.id)
//    .save()
//    .then(token => callback(null, token))
//    .catch(callback);
//}

//function  generateToken(type, req, callback) {
//  // reissue refreshToken if grantType is refresh_token
//  if (type === 'refreshToken' && req.body.grant_type === 'refresh_token') {
//    return callback(null, { refreshToken: req.body.refresh_token });
//  }
//
//  callback(null, false);
//  return
//}

