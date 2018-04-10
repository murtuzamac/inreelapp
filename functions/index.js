// const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const reviewsHandler = require('./src/services/Reviews');
const followDetailsHandler = require('./src/services/FollowDetails');
const commentsHandler = require('./src/services/Comments');
const likersHandler = require('./src/services/Likers');

exports.reviews = functions.https.onRequest((req, res) => {
  reviewsHandler.handler(req, res, admin.database());
});

exports.follow = functions.https.onRequest((req, res) => {
  followDetailsHandler.handler(req, res, admin.database());
});

exports.comments = functions.https.onRequest((req, res) => {
  commentsHandler.handler(req, res, admin.database());
});

exports.likers = functions.https.onRequest((req, res) => {
  likersHandler.handler(req, res, admin.database());
});