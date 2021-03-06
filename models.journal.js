'use strict';

const sentiment = require('sentiment');
const axios = require('axios');

class Journal {
  /**
   * Fetches all journal entries given a userID
   * @param  {object} ctx [uses state.user.id]
   */
  static async get(ctx) {
    try {
      // Fetch a list of all journal entries
      let [journals] = await global.db.query('SELECT * FROM journal WHERE userID = ? ORDER BY dateAdded desc', [ctx.state.user.id]);

      // Categorize the journals
      const allJournals = journals;
      const dayJournals = [];
      const dreamJournals = [];

      // Other datasets
      const scores = [{}];

      for (const j of journals) {
        // Push journals in their respective arrays
        if (j.type === 1) dayJournals.push(j);
        else if (j.type === 2) dreamJournals.push(j);

        // Calculate sentiment
        const sent = sentiment(j.content);

        // Push the top three most significant words to the score for reference
        const words = [];
        let counter = 0;
        for (let i = 0; i < sent.words.length; i++) {
          if (counter < 2) {
            words.push(sent.words[i]);
            counter++;
          }
        }

        // Construct the object to push
        const obj = {
          score: sent.score,
          words: words
        };

        // Push the journal score object
        scores.push(obj);
      }

      // Construct JSON object for journals
      journals = {
        all: allJournals,
        day: dayJournals,
        dream: dreamJournals
      };

      // Construct response body
      ctx.body = {
        error: false,
        msg: 'Fetched journals',
        journals: journals,
        scores: scores
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
    console.log('body', ctx.request.body);
    const body = ctx.request.body;
    // const body = JSON.parse(ctx.request.body);

    // Calculate sentiment
    const sent = sentiment(body.content);

    // Push the top three most significant words to the score for reference
    const words = [];
    let counter = 0;
    for (let i = 0; i < sent.words.length; i++) {
      if (counter < 2) {
        words.push(sent.words[i]);
        counter++;
      }
    }

    // Construct the object to push
    const obj = {
      score: sent.score,
      words: words
    };

    console.log('here is the sentiment stuff', obj);

    let searchTerm = words[0] + ' ' + words[1] + ' art';
    axios.get(`https://api.cognitive.microsoft.com/bing/v7.0/images/search?q=${searchTerm}&count=1&safeSearch&license=ModifyCommercially`, { headers: { "Ocp-Apim-Subscription-Key": '54cbe24df84d498fa82e36e11fd8a3c3' } })
      .then(resp => {
      console.log('resp', resp.data.value);
    }).catch(e => {
      console.log('ERROR ROEWJRIWOERFJOIWJEFIO', e);
    })

    // try {
    //   await global.db.query('INSERT INTO journal (userID, dateAdded, content, type) values (?, ?, ?, ?)', [ctx.state.user.id, new Date(), body.content, body.type]);
    //   await Journal.get(ctx);
    // } catch (e) {
    //   ctx.body = {
    //     error: true,
    //     msg: `Caught error: ${e}`
    //   };
    // }
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
