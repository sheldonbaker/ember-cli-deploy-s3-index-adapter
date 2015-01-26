var CoreObject  = require('core-object');
var SilentError = require('ember-cli/lib/errors/silent');

var Adapter = CoreObject.extend({
  init: function() {
    if (!this.connection) {
      throw new SilentError('Adapter must define a `connection` property\n');
    }

    this.appId = this.appId || 'default';
  },

  upload: function(data) {
    console.log('upload!');
  },

  setCurrent: function(key) {
    console.log('setCurrent yo!');
  }
});

Adapter.type = 'index-adapter';

module.exports = Adapter;