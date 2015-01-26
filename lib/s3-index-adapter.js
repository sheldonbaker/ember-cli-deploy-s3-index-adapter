var GitCommand  = require('gitty/lib/command');
var CoreObject  = require('core-object');
var SilentError = require('ember-cli/lib/errors/silent');
var CLIPromise  = require('ember-cli/lib/ext/promise');

var Adapter = CoreObject.extend({
  init: function() {
    if (!this.connection) {
      throw new SilentError('Adapter must define a `connection` property\n');
    }

    this.appId        = this.appId || 'default';
    this.client       = this.client|| this._client.apply(this);
  },

  upload: function(data) {
    var key          = this._key();

    return this._uploadIfNotInVersionList(key, data)
      .then(function() {
        return key;
      });
  },

  setCurrent: function(key) {
    return this._setCurrentIfInVersionList(key);
  },

  listVersions: function(){
    return this._listVersions().then(function(keys){
      return keys.map(function(key){
        return { key: key };
      });
    });
  },

  _key: function() {
    var cmd = new GitCommand('./', 'rev-parse', ['--short=10'], 'HEAD');
    return cmd.execSync().trim();
  },

  _uploadIfNotInVersionList: function(key, value) {
    var self     = this;
    
    return this._listVersions()
      .then(function(keys) {
        if (keys.indexOf(key) === -1) {
          return self.upload(key, value);
        } else {
          var message = 'Version for key [' + key + ']' + ' has already been uploaded\n';
          return CLIPromise.reject(new SilentError(message));
        }
      });
  },

  _setCurrentIfInVersionList: function(key) {
    var self  = this;
    var appId = this.appId;

    return this._listVersions()
      .then(function(versions) {
        if (versions.indexOf(key) === -1) {
          var message = 'Version for key [' + key + ']' + ' does not exist\n';
          return CLIPromise.reject(new SilentError(message));
        } else {
          return self._getObjectBody(key).then(function(body) {
            return self.upload(key, body).then(function() {
              return key;
            });
          });
        }
      });
  },

  _listVersions: function(count) {
    return new CLIPromise(function(resolve, reject) {
      this.client.listObjects({ Bucket: this.connection.bucket }, function(err, data) {
        if (err) {
          return reject(new SilentErrorError(err));
        }

        var versionObjects = data.Contents.filter(function(obj) {
          return obj.Key !== 'index.html';
        });

        var versionKeys = versionObjects.map(function(obj) {
          return obj.Key;
        });

        resolve(versionKeys);
      });
    });
  },

  _getObjectBody: function(key) {
    var self = this;

    return new CLIPromise(function(resolve, reject) {
      self.client.getObject({ Bucket: this.connection.bucket, Key: key }, function(err, data) {
        if (err) {
          return reject(new SilentErrorError(err));
        }

        return data.Body;
      });
    });
  },

  _upload: function(key, value) {
    var self = this;

    return new CLIPromise(function(resolve, reject) {
      self.client.putObject({ Bucket: this.connection.bucket, Key: key, Body: value }, function(err, data) {
        if (err) {
          return reject(new SilentErrorError(err));
        }

        resolve(key);
      });
    });
  },

  _client: function() {
    var AWS = require('aws-sdk');
    
    AWS.config.update({
      accessKeyId: this.connection.accessKey,
      secretAccessKey: this.connection.secret,
      region: this.connection.region
    });

    return new AWS.S3();
  }
});

Adapter.type = 'index-adapter';

module.exports = Adapter;