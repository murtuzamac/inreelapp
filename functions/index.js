// const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const reviewFeedPageSize = 5;
const commentPageSize = 9;

exports.reviews = functions.https.onRequest((req, res) => {
  var userId = req.query.userId;
  var startKey = req.query.startKey;
  var refPath = req.query.refPath;
  var feed = admin.database().ref(refPath);
  var populateReviews;
  var query = startKey ? feed.orderByKey().limitToLast(reviewFeedPageSize).endAt(startKey) : feed.orderByKey().limitToLast(reviewFeedPageSize);
  // var query = admin.database().ref("/users/" + userId + "/feed").orderByKey().limitToLast(reviewFeedPageSize);
  query.once("value", function (feeds) {
    if (feeds.exists()) {
      var reviewIdArr = Object.keys(feeds.val()),
        reviewArr = [];
      reviewIdArr.reverse();
      populateReviews = (reviewId, index) => {
        getSingleReviewDetails(reviewId, userId, function (reviewRenderData) {
          var len = (reviewIdArr.length < reviewFeedPageSize) ? 1 : 2; //to handle situation when thre are less records than the page size in the batch
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
});

exports.comments = functions.https.onRequest((req, res) => {
  var startKey = req.query.startKey;
  var refPath = req.query.refPath;
  var dbRefPath = admin.database().ref(refPath);
  var getComment;
  var query = startKey ? dbRefPath.orderByKey().limitToLast(commentPageSize).endAt(startKey) : dbRefPath.orderByKey().limitToLast(commentPageSize);
  // var query = admin.database().ref("/users/" + userId + "/feed").orderByKey().limitToLast(reviewFeedPageSize);
  query.once("value", function (comments) {
    if (comments.exists()) {
      var commentKeysArr = Object.keys(comments.val()),
        commentArr = [];
      commentKeysArr.reverse();
      getComment = (commentId, index) => {
        getSingleComment(commentId, (commentJSON) => {
          var len = (commentKeysArr.length < commentPageSize) ? 1 : 2; //to handle situation when thre are less records than the page size in the batch
          var _index = index + 1;
          commentArr.push(commentJSON)
          //condition to continue the recursion or not
          if (index < commentKeysArr.length - len) {
            getComment(commentKeysArr[_index], _index);
          }
          else {
            var result = {
              result: commentArr,
              status: 'success',
              startKey: commentKeysArr[index + 1] ? commentKeysArr[index + 1] : null
            }
            res.send(result);
          }
        })
      }
      getComment(commentKeysArr[0], 0);
    }
    else {
      var result = {
        result: [],
        status: 'success',
        startKey: null,
      }
      res.send(result);
    }
  });
});

getSingleReviewDetails = (reviewId, userId, callback) => {

  admin.database().ref("reviews/" + reviewId).once("value", function (reviewSnapshot) {
    var review = reviewSnapshot.val();

    //model of one review 
    var reviewRenderData = {
      reviewId: reviewId,
      movieId: review.movieid,
      movieTitle: '',
      movieYear: '',
      movieThumb: '',
      moviePoster: '',
      userId: review.uid,
      userName: '',
      userAvatar: '',
      userFullname: '',
      reviewDate: review.reviewdate,
      reviewVideo: review.reviewvideo,
      reviewVideoThumb: review.reviewvideothumb,
      reviewText: review.reviewtext,
      reviewLikes: review.reviewlikes,
      reviewCommentsCount: review.reviewcommentscount,
      reviewLiked: false
    }

    //get movie details
    var movieId = review.movieid;
    admin.database().ref("movies/" + movieId).once('value', function (movieSnapshot) {
      var movie = movieSnapshot.val();
      reviewRenderData.movieTitle = movie.moviename;
      reviewRenderData.movieYear = movie.movieyear;
      reviewRenderData.movieThumb = movie.moviethumb;
      reviewRenderData.moviePoster = movie.movieposter;

      //get User details (All review info has been recieved at this stage. )
      admin.database().ref("users/" + review.uid).once('value', function (userSnapshot) {
        var user = userSnapshot.val();
        reviewRenderData.userName = user.username;
        reviewRenderData.userAvatar = user.useravatar;
        reviewRenderData.userFullname = user.userfullname;

        //check if review is like by the current user, 
        for (key in review.reviewlikers) {
          if (key === userId) {
            reviewRenderData.reviewLiked = true;
            break;
          }
        }

        return callback(reviewRenderData)
      })
    })

  })
}

getSingleComment = (commentId, callback) => {
  var commentRef = admin.database().ref("comments/" + commentId);
  commentRef.once("value", function (commentSnapshot) {
    var _comment = commentSnapshot.val();

    //json design for a single comment 
    var commentJSON = {
      commentId: commentId,
      userId: _comment.commentuserid,
      userName: '',
      userAvatar: '',
      commentTime: _comment.commenttime,
      commentText: _comment.commenttext
    }

    admin.database().ref("users/" + _comment.commentuserid).once('value', function (userSnapshot) {
      var user = userSnapshot.val();
      commentJSON.userName = user.username;
      commentJSON.userAvatar = user.useravatar;

      callback(commentJSON)
    })
  })
}