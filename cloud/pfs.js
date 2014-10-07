// Require Underscore.js
var _ = require('underscore');

Parse.Cloud.job("sendPfsTestEmail", function(request, status) {
  queryParse("fallDriveTest");
});

Parse.Cloud.job("sendPfsBatchEmail", function(request, status) {
  queryParse("fallDriveBatch");
});

Parse.Cloud.job("sendPFSTransactionalEmail", function(request, status) {
  queryParse("fallDrivePledge");
});

function queryParse(source) {
  var startingTime = new Date().getTime();
  var query = new Parse.Query("PfsUser")
  query.notEqualTo("emailSent", true);
  query.equalTo("recordSource", source);
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
}

function sendMail(userObject, callback) {
    var Mailgun = require('mailgun');
    Mailgun.initialize('sandboxed0e928a89f043bf9593550b03de91e8.mailgun.org', 'key-c5fb719216d46d9be9d8bf80bfb468ad');
    
    // Set email body based on recordSource
    if (userObject.get('recordSource') == "fallDriveTest") {
      // Test Pledges
      var emailBody = "Dear " + userObject.get('name') + ", <br/><p>Congratulations! You are part of KPCC's fantastic membership or digital teams, and you (yes, you!) have been selected to test our Pledge Free Stream, which launches tomorrow.</p><p>First, please click on the following link: http://www.scpr.org/listen_live/pledge-free?pledgeToken=" + userObject.get('pledgeToken') + "</p><p>Second, if you see anything amiss, reply to this email and let me know.</p><p>Thirdly, if everything looks great, click reply and say \"This looks awesome!\"</p><p></br><br/>Sincerely, <br/>Joel Withrow</p>"
    } 
    else if (userObject.get('recordSource') == "fallDriveBatch") {
      // Pre-drive Batch 
      var emailBody = "Dear " + userObject.get('name') + ", <br/><p>We're excited to introduce our newest member benefit, the Pledge-Free Stream! As a way of thanking you for your incredible generosity, you can now stream KPCC on your computer during our member drives - without any fundraising interruptions. </p><p><b>The Pledge-Free Stream starts tomorrow, October 8th</b>, the same day the Fall Drive begins.</p> <p>Bookmark this link to listen on your desktop or mobile web browser: http://www.scpr.org/listen_live/pledge-free?pledgeToken=" + userObject.get('pledgeToken') + "</p><p>How does it work? Active during our pledge drives, the Pledge-Free Stream carries all of the programming you hear on-air, but removes the fundraising breaks and replaces them with the same news and great content you hear on KPCC year-round. </p><p>Check out the FAQ page to learn more. It's the same KPCC you know and love, just without the pledge drive! As a current member, you're receiving access to the pledge-free stream for this drive automatically, so you don't need to do anything else to start streaming a pledge-free KPCC. </p><p>Thanks again for your support!</br><br/>Sincerely, <br/>Rob Risko</p><p>P.S. Having trouble accessing the pledge-free stream? Call us at 626-583-5121 or visit our FAQ page: http://www.scpr.org/pledge-free</p>"
    }
    else {
      // Transactional Drive Pledges
      var emailBody = "Dear " + userObject.get('name') + ", <br/><p>Congratulations! You can now stream KPCC on your computer or mobile device during our member drives - without any fundraising interruptions.</p><p>Bookmark this link to listen to the pledge-free stream on your desktop or mobile web browser: http://www.scpr.org/listen_live/pledge-free?pledgeToken=" + userObject.get('pledgeToken') + "</p><p>Thanks again for your generous support! Your contribution will go right back into the balanced coverage and inspiring stories you love.</p><p></br><br/>Sincerely, <br/>Rob Risko</p><p>P.S. Having trouble accessing the pledge-free stream? Call us at 626-583-5121 or visit our FAQ page: http://www.scpr.org/pledge-free</p>"
    }
    
    Mailgun.sendEmail({
        to: userObject.get('email'),
        from: "membership@kpcc.org",
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
