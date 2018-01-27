class Test {
  /**
   * Removes a queued search
   * @param  {object} ctx
   */
  static async testThing(ctx) {
    console.log('here reached');
    // Set the toast message
    ctx.body = {
      msg: 'Successfully tested'
    };
  }
}

module.exports = Test;
