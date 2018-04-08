exports.getSingleUserDetails = (userId, database, callback) => {
    var userRef = database.ref("users/" + userId);
    userRef.once("value", (userSnapshot) => {
        var userData = userSnapshot.val();

        //json design for a single comment 
        var userJson = {
            userId: userData.userid,
            userName: userData.username,
            userFullname: userData.userfullname,
            userAvatar: userData.useravatar,
        }

        callback(userJson)
    })
}

exports.getSingleReviewDetails = (reviewId, userId, database, callback) => {
    database.ref("reviews/" + reviewId).once("value", function (reviewSnapshot) {
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
        database.ref("movies/" + movieId).once('value', function (movieSnapshot) {
            var movie = movieSnapshot.val();
            reviewRenderData.movieTitle = movie.moviename;
            reviewRenderData.movieYear = movie.movieyear;
            reviewRenderData.movieThumb = movie.moviethumb;
            reviewRenderData.moviePoster = movie.movieposter;

            //get User details (All review info has been recieved at this stage. )
            database.ref("users/" + review.uid).once('value', function (userSnapshot) {
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

exports.getSingleComment = (commentId, database, callback) => {
    var commentRef = database.ref("comments/" + commentId);
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
  
      database.ref("users/" + _comment.commentuserid).once('value', function (userSnapshot) {
        var user = userSnapshot.val();
        commentJSON.userName = user.username;
        commentJSON.userAvatar = user.useravatar;
  
        callback(commentJSON)
      })
    })
  }