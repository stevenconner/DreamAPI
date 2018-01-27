'use strict';

const sentiment = require('sentiment');

class Journal {
  /**
   * Fetches all journal entries given a userID
   * @param  {object} ctx [uses state.user.id]
   */
  static async get(ctx) {
    try {
      let [journals] = await global.db.query('SELECT * FROM journal WHERE userID = ? ORDER BY dateAdded desc', [ctx.state.user.id]);

      const allJournals = journals;
      const dayJournals = [];
      const dreamJournals = [];

      for (const j of journals) {
        if (j.type === 1) dayJournals.push(j);
        else if (j.type === 2) dreamJournals.push(j);
      }

      journals = {
        all: allJournals,
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
    const body = JSON.parse(ctx.request.body);

    try {
      await global.db.query('INSERT INTO journal (userID, dateAdded, content, type) values (?, ?, ?, ?)', [ctx.state.user.id, new Date(), body.content, body.type]);
      await Journal.get(ctx);
    } catch (e) {
      ctx.body = {
        error: true,
        msg: `Caught error: ${e}`
      };
    }
  }

  /**
   * Analyzes a journal entry and calculates sentiment
   * @param  {object} ctx
   */
  static async calcualateSentiment(ctx) {
    try {
      const [[entry]] = await global.db.query('SELECT content FROM journal WHERE id = ?', [ctx.params.journalID]);

      const result = sentiment(entry.content);

      ctx.body = {
        sentiment: result,
        error: false,
        msg: 'Analyzed sentiment'
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
