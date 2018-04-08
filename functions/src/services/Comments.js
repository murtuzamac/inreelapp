const CONSTANTS = require('../Config');
const HELPER = require('../Helper');

exports.handler = (req, res, database) => {
    var startKey = req.query.startKey;
    var refPath = req.query.refPath;
    var dbRefPath = database.ref(refPath);
    var getComment;
    var query = startKey ? dbRefPath.orderByKey().limitToLast(CONSTANTS.COMMENTSPAGESIZE).endAt(startKey) : dbRefPath.orderByKey().limitToLast(CONSTANTS.COMMENTSPAGESIZE);
    query.once("value", function (comments) {
        if (comments.exists()) {
            var commentKeysArr = Object.keys(comments.val()),
                commentArr = [];
            commentKeysArr.reverse();
            getComment = (commentId, index) => {
                HELPER.getSingleComment(commentId, database,(commentJSON) => {
                    var len = (commentKeysArr.length < CONSTANTS.COMMENTSPAGESIZE) ? 1 : 2; //to handle situation when thre are less records than the page size in the batch
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
};