// Require Underscore.js
var _ = require('underscore');

Parse.Cloud.job("sendPfsBatchEmail", function(request, status) {
    var startingTime = new Date().getTime();
    var query = new Parse.Query("PfsUser")
    query.notEqualTo("emailSent", true);
    query.equalTo("recordSource", "fallDriveBatch");
    query.find({
        success: function(results) {
            if (results.length > 0) {
                _.each(results, function(result){
                    sendMail(result, {
                        success: function(stat) {
                            console.log(stat);
                            handleResult();
                        },
                        error: function(error) {
                            console.log(error);
                            handleResult();
                        }
                  });
                });
                var handleResult = _.after(results.length, function() {
                  var elapsedTime = new Date().getTime() - startingTime;
                  status.success("Just sent " + results.length + " emails in " + elapsedTime + "ms");
                });

            } else {
                status.success("No users to email.");
              }
        },
        error: function(error) {
            console.log("Error" + error.code + " " + error.message);
        }
    });
});

Parse.Cloud.job("sendPFSTransactionalEmail", function(request, status) {
    var startingTime = new Date().getTime();
    var query = new Parse.Query("PfsUser")
    query.notEqualTo("emailSent", true);
    query.equalTo("recordSource", "fallDrivePledge");
    query.find({
        success: function(results) {
            if (results.length > 0) {
                _.each(results, function(result){
                    sendMail(result, {
                        success: function(stat) {
                            console.log(stat);
                            handleResult();
                        },
                        error: function(error) {
                            console.log(error);
                            handleResult();
                        }
                  });
                });
                var handleResult = _.after(results.length, function() {
                  var elapsedTime = new Date().getTime() - startingTime;
                  status.success("Just sent " + results.length + "emails in " + elapsedTime + "ms");
                });

            } else {
                status.success("No users to email.");
              }
        },
        error: function(error) {
            console.log("Error" + error.code + " " + error.message);
        }
    });
});

function sendMail(userObject, callback) {
    var Mailgun = require('mailgun');
    Mailgun.initialize('sandboxed0e928a89f043bf9593550b03de91e8.mailgun.org', 'key-c5fb719216d46d9be9d8bf80bfb468ad');
    var emailBody = "Dear " + userObject.get('name') + ", <br/><p>We’re excited to introduce our newest member benefit, the Pledge-Free Stream! As a way of thanking you for your incredible generosity, you can now stream KPCC on your computer during our member drives - without any fundraising interruptions. How does it work? Active during our pledge drives, the Pledge-Free Stream carries all of the programming you hear on-air, but removes the fundraising breaks and replaces them with additional news segments and other0 great content you hear on KPCC year-round. Check out the FAQ page to learn more. It’s the same KPCC you know and love, just without the pledge drive! As a current member, you’re receiving access to the pledge-free stream for this drive automatically, so you don’t need to do anything else to start streaming a pledge-free KPCC. The Pledge-Free Stream is live starting tomorrow, October 8th – the same day the Fall Drive begins. Use this link to listen to the stream on your desktop or mobile web browser: www.scprdev.org/listen_live/pledge-free?pledgeToken=" + userObject.get('pledgeToken') + "</p><p>Thanks again for your support!</br><br/>Sincerely, <br/>Rob Risko</p>";
    Mailgun.sendEmail({
        to: userObject.get('email'),
        from: "scprdev@scpr.org",
        subject: "Welcome to KPCC's Pledge Free Stream!",
        html: emailBody
      }, {
      success: function(response) {
          console.log(response);
          console.log("Email sent to " + userObject.get("email"));
          userObject.set("emailSent", true);
          userObject.save();
          callback.success(true);
      },
      error: function(response) {
          console.error(response);
          callback.error("Failed to send an email");
      }
    });
}
