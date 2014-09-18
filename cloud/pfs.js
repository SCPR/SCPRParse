Parse.Cloud.job("sendPFSEmail", function(request, status) {
    var query = new Parse.Query("PFSUser")
    query.notEqualTo("emailSent", true);
    query.find({
        success: function(results) {
            if (results.length > 0) {
                for (var i = 0; i< results.length; i++) {
                    var object = results[i];
                    sendMail(object).then(function() {
                        // Set the job's success status
                        status.success("Email send-off job completed successfully.");
                        object.set("emailSent", true);
                        object.save();
                        }, function(error) {
                        // Set the job's error status
                        status.error("Uh oh, something went wrong.");
                    });
                }
            } else {
                status.success("No users to email.");
              }
        },
        error: function(error) {
            console.log("Error" + error.code + " " + error.message);
        }
    });
});

function sendMail(userObject) {
    var Mailgun = require('mailgun');
    Mailgun.initialize('sandboxed0e928a89f043bf9593550b03de91e8.mailgun.org', 'key-c5fb719216d46d9be9d8bf80bfb468ad');

    var sendMailGun = Mailgun.sendEmail({
        to: userObject.get('email'),
        from: "scprdev@scpr.org",
        subject: "Welcome to KPCC's Pledge Free Stream!",
        text: "You can now access our pledge-free live stream at: http://localhost:3000/listen_live/pledge-free?pledgeToken=" + userObject.get('pledgeToken') + " with a maximum of 5 separate listening sessions"
        }, {
         success: function(response) {
            console.log(response);
         },
         error: function(response) {
            console.error(response);
         }
    });
    return sendMailGun;
}
