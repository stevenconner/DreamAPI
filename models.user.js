'use strict';

const scrypt = require('scrypt');

class User {
  static async createUser(ctx) {
    console.log(ctx.request);
    const body = ctx.request.body;

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

    console.log(body);

    await global.db.execute(`INSERT INTO user (firstName, email, password) values (:firstName, :email, :password)`, {
      firstName: body.firstName,
      email: body.email,
      password: hashedPassword
    });

    // Set the response object
    ctx.body = {
      error: false,
      msg: 'Successfully added'
    };
  }
}

module.exports = User;
