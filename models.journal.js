'use strict';

class Journal {
  /**
   * Fetches all journal entries given a userID
   * @param  {object} ctx [uses state.user.id]
   */
  static async get(ctx) {
    try {
      let [journals] = await global.db.query('SELECT * FROM journal WHERE userID = ?', [ctx.state.user.id]);

      const dayJournals = [];
      const dreamJournals = [];

      for (const j of journals) {
        if (j.type === 1) dayJournals.push(j);
        else if (j.type === 2) dreamJournals.push(j);
      }

      journals = {
        day: dayJournals,
        dream: dreamJournals
      };

      ctx.body = {
        error: false,
        msg: 'Fetched journals',
        journals: journals
      };
    } catch (e) {
      ctx.body = {
        error: true,
        msg: `Caught error: ${e}`
      };
    }
  }

  /**
   * Creates a journal entry
   * @param  {object} ctx
   */
  static async createJournal(ctx) {
    // const body = JSON.parse(ctx.request.body);
    const body = ctx.request.body;

    console.log(ctx.state.user);

    try {
      await global.db.query('INSERT INTO journal (userID, dateAdded, content, type) values (?, ?, ?, ?)', [ctx.state.user.id, new Date(), body.content, body.type]);
      ctx.body = {
        error: false,
        msg: 'Successfully added journal entry'
      };
    } catch (e) {
      ctx.body = {
        error: true,
        msg: `Caught error: ${e}`
      };
    }
  }
}

module.exports = Journal;
