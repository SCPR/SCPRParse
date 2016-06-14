// Require Underscore.js
var _ = require('underscore');

Parse.Cloud.job("sendPFSTransactionalEmail", function(request, status) {
  var startingTime = new Date().getTime();
  var query = new Parse.Query("PfsUser")
  query.notEqualTo("emailSent", true);
  query.equalTo("recordSource", "fye16plus");
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

Parse.Cloud.job("sendPFSBatchEmail", function(request, status) {
  var startingTime = new Date().getTime();
  var query = new Parse.Query("PfsUser")
  query.notEqualTo("emailSent", true);
  query.equalTo("recordSource", "20150312-Drive-Batch");
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



function sendMail(userObject, callback) {
    var Mailgun = require('mailgun');
    Mailgun.initialize('email.scprdev.org', 'key-c5fb719216d46d9be9d8bf80bfb468ad');

    // Transactional Drive Pledges
    var emailSubject = "Welcome to KPCC Plus!"
    var emailBody = "Dear " + userObject.get('name') + ", <br/><p>Congratulations! You can now stream KPCC on your computer or mobile device during our member drives - without any fundraising interruptions.</p><p>The fundraising-free stream KPCC Plus is easy to access. Click or paste this link to listen on your desktop or mobile web browser: http://www.scpr.org/listen_live/pledge-free?pledgeToken=" + userObject.get('pledgeToken') + "</p><p>You can also access KPCC Plus directly through our iPhone App. Launch the app, and tap on KPCC Live in the orange navbar at the top of the screen. Choose the KPCC Plus stream from the menu, and type this code: " + userObject.get('pledgeToken') + "</p><p>Thanks again for your generous support! Your contribution will go right back into the balanced coverage and inspiring stories you love.</p><p></br><br/>Sincerely, <br/>Rob Risko</p><p>P.S. Having trouble accessing KPCC Plus? Call us at 626-583-5121 or visit our FAQ page: http://www.kpcc.org/plus</p>"

    Mailgun.sendEmail({
        to: userObject.get('email'),
        from: "Rob Risko <membership@kpcc.org>",
        subject: emailSubject,
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
