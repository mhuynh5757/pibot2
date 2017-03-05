var Datastore = require('@google-cloud/datastore')({
  prefix: 'express-sessions',
  projectId: process.env.GCLOUD_PROJECT,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

module.exports = {
  getDb: function() {
    return Datastore;
  }
}