'use strict';

const router = require('koa-router')(); // router middleware for koa
const user = require('./models.user.js');

// Posts
router.post('/user/create', user.createUser);

module.exports = router.middleware();
