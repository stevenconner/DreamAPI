'use strict';

const scrypt = require('scrypt');
const jwt = require('jsonwebtoken');
const randomstring = require('randomstring');

class User {
  static async createUser(ctx) {
    const body = JSON.parse(ctx.request.body);

    let hashedPassword = '';
    try {
      if (body.password && body.password.length > 3) {
        while (hashedPassword.length < 10) {
          hashedPassword = scrypt.kdfSync(body.password, { N: 16, r: 8, p: 2 });
        }
      }
    } catch (e) {
      // Set the response object
      ctx.body = {
        error: true,
        msg: `Error saving ${body}: ${e}`
      };
    }

    try {
      await global.db.execute(`INSERT INTO user (firstName, email, password) values (?, ?, ?)`, [body.firstName, body.email, hashedPassword]);

      const [[user]] = await global.db.execute('SELECT * FROM user WHERE email = ?', [body.email]);

      ctx.state.user = user;

      const payload = {
        id: user.id
      };

      const token = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: process.env.TOKEN_TIME });
      const decoded = jwt.verify(token, process.env.JWT_KEY);
      const refreshToken = randomstring.generate(50);
      await User.addToken(user.id, refreshToken);

      // Set the response object
      ctx.body = {
        user: user,
        jwt: token,
        refreshToken: refreshToken,
        error: false,
        msg: 'Successfully added'
      };
    } catch (e) {
      ctx.body = {
        error: true,
        msg: `Error saving ${body}: ${e}`
      };
    }
  }

  static async addToken(userID, refreshToken) {
    await global.db.query(`INSERT INTO userToken (userID, refreshToken) VALUES (?, ?)`, [userID, refreshToken]);
  }
}

module.exports = User;
