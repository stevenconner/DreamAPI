/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Route to handle authentication /auth element                                                  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const router = require('koa-router')();
const jwt = require('jsonwebtoken');
const scrypt = require('scrypt');
const randomstring = require('randomstring');

const User = require('./models.auth.js');

router.post('/auth', async function getAuth(ctx) {
  let user = null;
  let body = null;
  try {
    body = JSON.parse(ctx.request.body);
  } catch (e) {
    body = ctx.request.body;
  }

  console.log(body);
  if (body.refreshToken) {
    [user] = await User.getByToken(body.refreshToken);
    if (!user) {
      [user] = await User.getBy('refreshToken', body.refreshToken);
      if (!user) ctx.throw(401, 'Bad Token not found');
    }
  } else {
    [user] = await User.getBy('email', body.email);
    console.log('user', user);
    if (!user) ctx.throw(401, 'Username/password not found');

    // Check the password
    try {
      const match = await scrypt.verifyKdf(Buffer.from(user.password, 'base64'), body.password);
      if (!match) ctx.throw(401, 'Username/password not found.');
    } catch (e) {
      ctx.throw(401, 'Username/password not found!');
    }
  }

  ctx.state.user = user;

  try {
    const payload = {
      id: user.id,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: process.env.TOKEN_TIME });
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const refreshToken = randomstring.generate(50);
    User.addToken(user.id, refreshToken);

    ctx.body = {
      user: user,
      jwt: token,
      role: user.role,
      refreshToken: refreshToken,
      expires: decoded.exp
    };
  } catch (e) {
    ctx.throw(404, e.message);
  }
});

// router.post('/user/register', User.register);
router.get('/jwt', async function getJWT(ctx) {
  if (!ctx.header.authorization) ctx.throw(401, 'Authorisation required');
  const [scheme, token] = ctx.header.authorization.split(' ');
  if (scheme !== 'Bearer') ctx.throw(401, 'Invalid authorisation');

  const roles = { 1: 'user', 2: 'admin', 3: 'su' };

  try {
    const payload = jwt.verify(token, process.env.JWT_KEY);
    // If it's a valid token, accept it
    ctx.state.user = payload;
    ctx.state.user.Role = roles[payload.role];

    const curDate = new Date() / 1000;
    ctx.state.user.curDate = curDate;
    const seconds = Math.round(ctx.state.user.exp - curDate);
    ctx.state.user.remainingSeconds = Math.round(seconds);
    ctx.state.user.remainingMinutes = Math.round(seconds / 60);
    ctx.state.user.remainingHours = Math.round(seconds / 60 / 60);

    ctx.body = ctx.state.user;
    ctx.root = 'TOKEN';
  } catch (e) {
    if (e.message === 'invalid token') ctx.throw(401, 'Invalid JWT');
    ctx.throw(e.status || 500, e.message);
  }
});

module.exports = router.middleware();
