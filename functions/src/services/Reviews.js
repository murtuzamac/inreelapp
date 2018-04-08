const CONSTANTS = require('../Config');
const HELPER = require('../Helper');

exports.handler = (req, res, database) => {
      var userId = req.query.userId;
      var startKey = req.query.startKey;
      var refPath = req.query.refPath;
      var feed = database.ref(refPath);
      var populateReviews;
      var query = startKey ? feed.orderByKey().limitToLast(CONSTANTS.REVIESPAGESIZE).endAt(startKey) : feed.orderByKey().limitToLast(CONSTANTS.REVIESPAGESIZE);
      // var query = admin.database().ref("/users/" + userId + "/feed").orderByKey().limitToLast(CONSTANTS.REVIESPAGESIZE);
      query.once("value", function (feeds) {
        if (feeds.exists()) {
          var reviewIdArr = Object.keys(feeds.val()),
            reviewArr = [];
          reviewIdArr.reverse();
          populateReviews = (reviewId, index) => {
            HELPER.getSingleReviewDetails(reviewId, userId, database, function (reviewRenderData) {
              var len = (reviewIdArr.length < CONSTANTS.REVIESPAGESIZE) ? 1 : 2; //to handle situation when thre are less records than the page size in the batch
              var _index = index + 1;
              reviewArr.push(reviewRenderData)
              //condition to continue the recursion or not
              if (index < reviewIdArr.length - len) {
                populateReviews(reviewIdArr[_index], _index);
              }
              else { //done loading all reviews in the batch
                var result = {
                  result: reviewArr,
                  status: 'success',
                  startKey: reviewIdArr[index + 1] ? reviewIdArr[index + 1] : null
                }
                res.send(result);
              }
            })
          }
          populateReviews(reviewIdArr[0], 0);
        }
        else {
          var result = {
            result: [],
            status: 'success',
            startKey: null
          }
          res.send(result);
        }
      });
};