'use strict';

// const Lib = require('../lib/lib.js');
const scrypt = require('scrypt');

class Auth {
  static async getBy(field, value) {
    try {
      const sql = `SELECT * FROM user WHERE ${field} = :${field} ORDER BY firstName`;

      const [users] = await global.db.query(sql, { [field]: value });

      return users;
    } catch (e) {
      switch (e.code) {
        case 'ER_BAD_FIELD_ERROR':
        default:
          console.log('e', e);
      }
    }
  }

  static async addToken(userID, refreshToken) {
    const sql = 'INSERT INTO userToken (userID, refreshToken) values (:userID, :refreshToken)';
    const response = await global.db.query(sql, { userID: userID, refreshToken: refreshToken });
    return response;
  }

  static async getByToken(token) {
    const sql = 'SELECT * FROM user WHERE id in (select userID from userToken where refreshToken = :token)';
    const [users] = await global.db.query(sql, { token: token });

    const sql2 = 'DELETE FROM userToken WHERE refreshToken = :token'; // This token has been used so we delete it.
    const response = await global.db.query(sql2, { token: token });

    return users;
  }
}

module.exports = Auth;
