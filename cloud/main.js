// Require Underscore.js
var _ = require('underscore');


// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
    response.success("Hello world!");
});

// Endpoint to retrieve SocialData for a single (or multiple) article, with no constraints for count or time threshold.
Parse.Cloud.define("social_data_no_constraints", function(request, response) {

    var articleIdArray = [];

    if (request.params.articleIds) {
        articleIdArray = request.params.articleIds;
    } else {
        response.error("Error: request needs to include an article ID");
    }

    var query = new Parse.Query("SocialData");
    query.containedIn("articleId", articleIdArray);
    query.find({
        success: function(results) {
            var resultsHash = {};
            for(var i = 0; i < results.length; i++) {
                if (resultsHash[results[i].get("articleId")] == undefined) {
                    resultsHash[results[i].get("articleId")] = {};
                }
                resultsHash[results[i].get("articleId")] = { "twitter_count" : results[i].get("twitterCount"), "facebook_count" : results[i].get("facebookCount") };
            }
            response.success(resultsHash);
        },
        error: function() {
            response.error("Error: social data lookup failed");
        }
    });
});

// Job used to test the social_data_no_constaints method.
Parse.Cloud.job("social_data_no_constraints_test", function(request, status) {
    var testArray = [];

    var query = new Parse.Query("SocialData");
    query.limit(1);
    query.find({
        success: function(results) {
            for(var i = 0; i < results.length; i++) {
                testArray.push(results[i].get("articleId"));
            }
            Parse.Cloud.run('social_data_no_constraints', { articleIds: testArray }, {
                success: function(response) {
                    status.success("Results: " + response);
                },
                error: function(error) {
                    status.error(error);
                }
            });
        },
        error: function() {
            response.error("Error: social data lookup failed");
        }
    });
});


// Endpoint to retrieve SocialData from a set of given articles.
Parse.Cloud.define("social_data", function(request, response) {

    // Threshold to display the social data count.
    var UPPER_SHARE_THRESHOLD = 70;
    var MIDDLE_SHARE_THRESHOLD = 60;
    var LOWER_SHARE_THRESHOLD = 35;

    // Time frame thresholds.
    var MIDDLE_TIME_THRESHOLD = 43200000; // 12 hours in ms.
    var LOWER_TIME_THRESHOLD = 21600000; // 6 hours in ms.

    var articleIdArray = [];

    if (request.params.articleIds) {
        articleIdArray = request.params.articleIds;
    } else {
        response.error("Error: request needs to include a list of article IDs");
    }

    var query = new Parse.Query("SocialData");
    query.containedIn("articleId", articleIdArray);
    query.find({
        success: function(results) {
            var resultsHash = {};
            for(var i = 0; i < results.length; i++) {
                if (resultsHash[results[i].get("articleId")] == undefined) {
                    resultsHash[results[i].get("articleId")] = {};
                }

                var shareCount = results[i].get("twitterCount") + results[i].get("facebookCount");
                var bothCountsAboveZero = results[i].get("twitterCount") > 0 && results[i].get("facebookCount") > 0;
                var publishedAt = results[i].get("publishedAt");
                var timeNow = new Date();

                if ( bothCountsAboveZero && ( shareCount >= UPPER_SHARE_THRESHOLD ||
                      (timeNow - publishedAt <= LOWER_TIME_THRESHOLD && shareCount >= LOWER_SHARE_THRESHOLD) ||
                      (timeNow - publishedAt <= MIDDLE_TIME_THRESHOLD && shareCount >= MIDDLE_SHARE_THRESHOLD))) {
                    resultsHash[results[i].get("articleId")] = { "twitter_count" : results[i].get("twitterCount"), "facebook_count" : results[i].get("facebookCount") };
                }
            }
            response.success(resultsHash);
        },
        error: function() {
            response.error("Error: social data lookup failed");
        }
    });
});

// Job used to test the above method. Just uses all articleIds in the SocialData table to above method's output.
Parse.Cloud.job("social_data_test", function(request, status) {
    var testArray = [];

    var query = new Parse.Query("SocialData");
    query.limit(250);
    query.find({
        success: function(results) {
            for(var i = 0; i < results.length; i++) {
                testArray.push(results[i].get("articleId"));
            }

            Parse.Cloud.run('social_data', { articleIds: testArray }, {
                success: function(response) {
                    status.success("Results: " + response);
                },
                error: function(error) {
                    status.error(error);
                }
            });
        },
        error: function() {
            response.error("Error: social data lookup failed");
        }
    });
});


// Used to fetch social data from Facebook and Twitter APIs.
function fetchSocialData(parseObject, callback) {
    Parse.Cloud.useMasterKey();

    // Turn on for console logging.
    var __DEBUG = true;

    if (__DEBUG) {
        console.log("fetchSocialData, for article: " + parseObject.get("articleId"));
        var startingTime = new Date().getTime();
    }

    // Used to track success/failure of each fetch function.
    var twitterSuccess = false;
    var facebookSuccess = false;

    // Pass the parseObject to and run each social fetch function.
    var arrayOfSocialFunctions = [fetchTwitterCountsForUrl, fetchFacebookCountsForUrl];
    _.each(arrayOfSocialFunctions, function(func){
        func(parseObject);
    });

    // Handles the result of both fetch functions. Only run after both async calls have completed.
    var handleResult = _.after(arrayOfSocialFunctions.length, function(){
        if (twitterSuccess && facebookSuccess) {
            if (__DEBUG) {
                var elapsedTime = new Date().getTime() - startingTime;
                callback.success("Twitter and Facebook Successfully Queried! in " + elapsedTime + " ms");
            } else {
                callback.success(true);
            }
        } else if (twitterSuccess && !facebookSuccess) {
            callback.error("Twitter Success but Facebook Failed for - " + parseObject.get("articleUrl"));
        } else if (!twitterSuccess && facebookSuccess) {
            callback.error("Facebook Success but Twitter Failed for - " + parseObject.get("articleUrl"));
        } else {
            callback.error("Error: Twitter and Facebook Failed for - " + parseObject.get("articleUrl"));
        }
    });

    // Hit Twitter API, get total share counts for given articleUrl, and update corresponding data on Parse.
    function fetchTwitterCountsForUrl(parseObject) {
        var articleUrl = parseObject.get("articleUrl");
        Parse.Cloud.httpRequest({
            url: 'http://urls.api.twitter.com/1/urls/count.json',
            params: {
                url : articleUrl
            },
            success: function(httpResponse) {
                if (__DEBUG) {
                    console.log("Twitter - " + httpResponse['data']['count'] + " - " + articleUrl);
                }

                if (parseObject && httpResponse['data']['count'] != undefined) {
                    parseObject.set("twitterCount", httpResponse['data']['count']);
                    parseObject.save(null, {
                        success: function() {
                            twitterSuccess = true;
                            handleResult();
                        },
                        error: function() {
                            twitterSuccess = false;
                            handleResult();
                        }
                    });
                } else {
                    twitterSuccess = false;
                    handleResult();
                }
            },
            error: function(httpResponse) {
                status.message('Request failed with response code ' + httpResponse.status);
                twitterSuccess = false;
                handleResult();
            }
        });
    }

    // Hit Facebook API, get total share counts for given articleUrl, and update corresponding data on Parse.
    function fetchFacebookCountsForUrl(parseObject) {
        var articleUrl = parseObject.get("articleUrl");
        Parse.Cloud.httpRequest({
            url: 'http://api.facebook.com/method/links.getStats',
            params: {
                urls : articleUrl,
                format : 'json'
            },
            success: function(httpResponse) {
                if (__DEBUG) {
                    console.log("Facebook - " + httpResponse['data'][0]['total_count'] + " - " + articleUrl);
                }

                if (parseObject && httpResponse['data'][0]['total_count'] != undefined) {
                    parseObject.set("facebookCount", httpResponse['data'][0]['total_count']);
                    parseObject.save(null, {
                        success: function() {
                            facebookSuccess = true;
                            handleResult();
                        },
                        error: function() {
                            facebookSuccess = false;
                            handleResult();
                        }
                    });
                } else {
                    facebookSuccess = false;
                    handleResult();
                }
            },
            error: function(httpResponse) {
                status.message('Request failed with response code ' + httpResponse.status);
                facebookSuccess = false;
                handleResult();
            }
        });
    }
}



// Hit SCPR API and retrieve 20 most recent articles. Check if they already exist in our SocialData table on Parse, and
// update data as necessary.
Parse.Cloud.job("fetchArticles", function(request, status) {
    Parse.Cloud.useMasterKey();

    // Turn on for console logging.
    var __DEBUG = true;
    if (__DEBUG) {
        var startingTime = new Date().getTime();
    }

    var SocialData = Parse.Object.extend("SocialData");

    fetchArticlesFromSCPR();

    function fetchArticlesFromSCPR() {
        Parse.Cloud.httpRequest({
            url: 'http://www.scpr.org/api/v2/articles',
            params: {
                type : 'news',
                limit : '20'
            },
            success: function(httpResponse) {

                if (httpResponse['data']) {
                    var articles = httpResponse['data'];

                    // For each article, query Parse to see if we already have a SocialData object with a matching articleId.
                    // If not, create and save a new SocialData row.
                    _.each(articles, function(article) {
                        if (article['id']) {
                            var query = new Parse.Query("SocialData");
                            query.equalTo("articleId", article['id']);
                            query.find({
                                success: function(results) {
                                    var socialData;

                                    if (results.length < 1) {
                                        socialData = new SocialData();
                                        socialData.set("articleId", article['id']);

                                        if(__DEBUG) {
                                            console.log('Creating Article ' + article['id'] + "  ---  " + socialData);
                                        }
                                    } else {
                                        socialData = results[0];

                                        if(__DEBUG) {
                                            console.log('Found Article ' + article['id'] + "  ---  " +  results[0]);
                                        }
                                    }

                                    if (article['permalink']) {
                                        socialData.set("articleUrl", article['permalink']);
                                    }
                                    if (article['published_at']) {
                                        socialData.set("publishedAt", new Date(article['published_at']));
                                    }

                                    socialData.save(null, {
                                        success: function() {
                                            handleResult();
                                        },
                                        error: function() {
                                            handleResult();
                                        }
                                    });
                                },
                                error: function() {
                                    if (__DEBUG) {
                                        console.log('Did not find article with id ' + article['id']);
                                    }
                                    handleResult();
                                }
                            }); // query.find()
                        }
                    }); // _.each(articles)

                    // Run this code after handleResult() has been called 'articles.length' times.
                    var handleResult = _.after(articles.length, function(){
                        if (__DEBUG) {
                            var elapsedTime = new Date().getTime() - startingTime;
                            status.success("Just fetched " + articles.length + " articles from SCPR in " +  elapsedTime + " ms");
                        } else {
                            status.success("Just fetched " + articles.length + " articles from SCPR!");
                        }
                    });

                } else {
                    status.error('No data received with response code ' + httpResponse.status);
                }
            },
            error: function(httpResponse) {
                status.error('Request failed with response code ' + httpResponse.status);
            }
        }); // Parse.Cloud.httpRequest
    }
});



// Job to grab articles on the SocialData table less than 4 days old and update their SocialData counts.
Parse.Cloud.job("updateSocialDataJob", function(request, status) {
    Parse.Cloud.useMasterKey();

    // Turn on for console logging.
    var __DEBUG = true;
    if (__DEBUG) {
        var startingTime = new Date().getTime();
    }

    var query = new Parse.Query("SocialData");

    // Set the query to only retrieve articles published less than 4 days ago.
    var daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - 4);
    query.greaterThan("publishedAt", daysAgo);
    query.limit(1000);
    query.find({
        success: function(results) {
            if (__DEBUG) {
                console.log("About to update data for " + results.length + " SocialData rows.");
            }

            _.each(results, function(result){

                // Fetch and update social data for each result (parseObject) from the parse query.
                fetchSocialData(result, {
                    success: function(status) {
                        if (__DEBUG) {
                            console.log(status);
                        }
                        handleResult();
                    },
                    error: function(error) {
                        if(__DEBUG) {
                            console.log(error);
                        }
                        handleResult();
                    }
                });
            });

            var handleResult = _.after(results.length, function() {
                if (__DEBUG) {
                    var elapsedTime = new Date().getTime() - startingTime;
                    status.success("Just updated SocialData for " + results.length + " articles in " + elapsedTime + "ms");
                } else {
                    status.success("Just updated SocialData for " + results.length + "  articles!");
                }
            });
        },
        error: function(error) {
            status.error("Error: Failed initial SocialData Query!");
        }
    });
});
