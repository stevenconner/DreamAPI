#!/usr/bin/env node
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Simple app to explore Node.js + Koa + MySQL basics for CRUD admin + API                        */
/*                                                                                                */
/* App comprises three (composed) sub-apps:                                                       */
/*  - www.   (public website pages)                                                               */
/*  - admin. (pages for interactively managing data)                                              */
/*  - api.   (RESTful CRUD API)                                                                   */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

/* eslint no-shadow:off */
/* app is already declared in the upper scope */
const Koa = require('koa'); // Koa framework
const body = require('koa-body'); // body parser
const compose = require('koa-compose'); // middleware composer
const compress = require('koa-compress'); // HTTP compression
const session = require('koa-session'); // session for flash messages
const mysql = require('mysql2/promise'); // fast mysql driver
const debug = require('debug')('app'); // small debugging utility
const cors = require('koa2-cors'); // CORS for Koa 2
const jwt = require('jsonwebtoken'); // JSON Web Token implementation
const xmlify = require('xmlify'); // JS object to XML
const yaml = require('js-yaml'); // JS object to YAML
const bunyan = require('bunyan'); // logging
const koaLogger = require('koa-bunyan'); // logging

require('dotenv').config();

const app = new Koa();

// MySQL connection pool (set up on app initialisation)
// const config = {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_DATABASE
// };

// global.connectionPool = mysql.createPool(config);

// Return response time in X-Response-Time header
app.use(async function responseTime(ctx, next) {
    const t1 = Date.now();
    await next();
    const t2 = Date.now();
    ctx.set('X-Response-Time', Math.ceil(t2 - t1) + 'ms');
});

// HTTP compression
app.use(compress({}));

// Only search-index www subdomain
app.use(async function robots(ctx, next) {
    await next();
    ctx.response.set('X-Robots-Tag', 'noindex, nofollow');
});

// Parse request body into ctx.request.body
app.use(body());

// Set signed cookie keys for JWT cookie & session cookie
app.keys = ['7R%k2s*d$ehj76w@ere'];

// It's useful to be able to track each request...
app.use(async function(ctx, next) {
    debug(ctx.method + ' ' + ctx.url);
    await next();
});

app.use(cors({ 'Access-Control-Allow-Origin': '*' }));

app.use(async function contentNegotiation(ctx, next) {
    await next();
    if (!ctx.body) return;
    // We are always returning json therefore we do not need the root
    delete ctx.body.root;
});

// Handle thrown or uncaught exceptions anywhere down the line
app.use(async function handleErrors(ctx, next) {
    try {
        await next();
    } catch (e) {
        ctx.status = e.status || 500;
        switch (ctx.status) {
            case 409:
                ctx.body = { message: e.message, root: 'error' };
                break;
            // Internal Server Error
            case 500:
            default:
                console.error(ctx.status, e.message);
                ctx.body = { message: e.message, root: 'error' };
                if (app.env !== 'production') ctx.body.stack = e.stack;
                ctx.app.emit('error', e, ctx);
                break;
        }
    }
});

// Establish s MySQL connection
// app.use(async function mysqlConnection(ctx, next) {
//     try {
//         ctx.state.db = global.db = await global.connectionPool.getConnection();
//         ctx.state.db.connection.config.namedPlaceholders = true;
//         // Traditional mode ensures not null is respected for unsupplied fields
//         await ctx.state.db.query('SET SESSION sql_mode = "TRADITIONAL"');

//         await next();

//         ctx.state.db.release();
//     } catch (e) {
//         // If getConnection() fails, we need to release the connection
//         if (ctx.state.db) ctx.state.db.release();
//         throw e;
//     }
// });

// Logging
const access = { type: 'rotating-file', path: './logs/api-access.log', level: 'trace', period: '1d', count: 4 };
const error = { type: 'rotating-file', path: './logs/api-error.log', level: 'error', period: '1d', count: 4 };
const logger = bunyan.createLogger({ name: 'api', streams: [access, error] });
app.use(koaLogger(logger, {}));

// Import public (unsecure) routes first
// app.use(require('./routes-root.js'));
// app.use(require('./routes-auth.js'));

// app.use(async function verifyJwt(ctx, next) {
//     if (!ctx.header.authorization) ctx.throw(401, 'Authorisation required');
//     const [scheme, token] = ctx.header.authorization.split(' ');
//     if (scheme !== 'Bearer') ctx.throw(401, 'Invalid authorisation');

//     // Attempt to verify the token
//     try {
//         const payload = jwt.verify(token, process.env.JWT_KEY);
//         // If it's a valid token, accept it
//         ctx.state.user = payload;
//     } catch (e) {
//         if (e.message === 'invalid token') ctx.throw(401, 'Invalid JWT');
//         ctx.body = { loginError: true };
//     }

//     await next();
// });

// Import other routes that depend on the JWT
app.use(require('./routes-test.js'));

// Create the server
app.listen(process.env.PORT);
// console.info(`${process.version} listening on port ${process.env.PORT || 3000} (${app.env}/${config.database})`);
console.info(`${process.version} listening on port ${process.env.PORT} (${app.env}/)`);

module.exports = app;
