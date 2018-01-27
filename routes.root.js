'use strict';

const router = require('koa-router')(); // router middleware for koa

router.get('/', function getRoot(ctx) {
  const resources = { auth: { _uri: '/auth' } };
  const authentication = '‘GET /auth’ to obtain JSON Web Token; subsequent requests require JWT auth';
  ctx.body = { resources: resources, authentication: authentication };
});

module.exports = router.middleware();
