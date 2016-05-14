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
var App = sqldb.App;

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



  var oauth = new oauthServer({ model: require('./model') });

  app.all('/oauth/token', function(req,res,next){
    var request = new Request(req);
    var response = new Response(res);

    oauth.token(request,response).then(token => {
      return res.json(token)
    }).catch(err => {
      //return res.status(err.code || 500).json(err)
      console.log(err)
      return res.status( 500).json(err)
    })
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


  app.use(function(req,res,next){
    var request = new Request({
      headers: { authorization: req.headers.authorization },
      method: req.method,
      query: req.query,
      body: req.body
    });
    var response = new Response(res);

    oauth.authenticate(request,response,{scope:"foo"})
      .then(function(data) {
        // Request is authorized.
        next()

      })
      .catch(function(e) {
        // Request is not authorized.
        res.status(500).json(e)
        //res.status(e.code || 500).json(e)
      });
  })


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
