'use strict';

const router = require('koa-router')();
const journal = require('./models.journal.js');

router.get('/journal/get', journal.get);

router.post('/journal/create', journal.createJournal);

module.exports = router.middleware();
