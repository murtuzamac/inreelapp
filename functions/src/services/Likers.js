const CONSTANTS = require('../Config');
const HELPER = require('../Helper');

exports.handler = (req, res, database) => {
    var startKey = req.query.startKey;
    var userId = req.query.userId;
    var reviewId = req.query.reviewId;
    var dbRef = database.ref("reviews/" + reviewId + "/reviewlikers");
    var query = startKey !== "null" ? dbRef.orderByKey().limitToLast(CONSTANTS.USERSPAGESIZE).endAt(startKey) : dbRef.orderByKey().limitToLast(CONSTANTS.USERSPAGESIZE);

    query.once("value", function (users) {
        if (users.exists()) {
            var userIdArr = Object.keys(users.val()),
                usersArr = [];
            userIdArr.reverse();
            getUser = (_userId, index) => {
                HELPER.getSingleUserDetails(_userId, database, (userJson) => {
                    var userDbRef = database.ref("users/" + userId + "/followings");
                    (new Promise((resolve, reject) => {
                        if (_userId !== userId) {
                            userDbRef.orderByKey().equalTo(userId).once("value", (snapshot) => {
                                if (snapshot.exists()) {
                                    resolve(true);
                                }
                                else {
                                    resolve(false);
                                }
                            })
                        }
                        else {
                            resolve(true)
                        }
                    })).then((alreadyFollowing) => {
                        userJson.alreadyFollowing = alreadyFollowing;
                        var len = (userIdArr.length < CONSTANTS.USERSPAGESIZE) ? 1 : 2; //to handle situation when thre are less records than the page size in the batch
                        var _index = index + 1;
                        usersArr.push(userJson)
                        //condition to continue the recursion or not
                        if (index < userIdArr.length - len) {
                            return getUser(userIdArr[_index], _index);
                        }
                        else {
                            var result = {
                                result: usersArr,
                                status: 'success',
                                startKey: userIdArr[index + 1] ? userIdArr[index + 1] : null
                            }
                            return res.send(result);
                        }
                    }).catch((error) => {
                        console.log(error)
                    });
                })
            }
            getUser(userIdArr[0], 0);
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
};