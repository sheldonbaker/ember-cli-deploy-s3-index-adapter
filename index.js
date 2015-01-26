var S3IndexAdapter = require('./lib/s3-index-adapter');

function EmberCLIDeployS3IndexAdapter() {
  this.name = 'ember-cli-deploy-s3-index-adapter';
  this.adapter = S3IndexAdapter;
}

module.exports = EmberCLIDeployS3IndexAdapter;