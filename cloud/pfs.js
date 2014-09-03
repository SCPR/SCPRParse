Parse.Cloud.job("sendPFSEmail", function(request, status) {
    var Mailgun = require('mailgun');
    Mailgun.initialize('sandboxed0e928a89f043bf9593550b03de91e8.mailgun.org', 'key-c5fb719216d46d9be9d8bf80bfb468ad');

    var query = new Parse.Query("PFSUser")
    query.find({
        success: function(results) {
            for (var i = 0; i< results.length; i++) {
                var object = results[i];
                email = object.get('email');
                membershipToken = object.get('sustainingMembershipToken')
                Mailgun.sendEmail({
                  to: email,
                  from: "Mailgun@CloudCode.com",
                  subject: "Welcome to KPCC's Pledge Free Stream!",
                  text: "You can now access our pledge-free live stream at: http://scprdev.org/listen_live?parse_key=" + membershipToken + " with a maximum of 3 separate listening sessions"
                }, {
                  success: function(response) {
                    console.log(response);
                  },
                  error: function(response) {
                    console.error(response);
                  }
                }).then(function() {
                        // Set the job's success status
                        status.success("Email send-off job completed successfully.");
                        }, function(error) {
                        // Set the job's error status
                        status.error("Uh oh, something went wrong.");
                        });

            }
        },
        error: function(error) {
            console.log("Error" + error.code + " " + error.message);
        }
    });
});
