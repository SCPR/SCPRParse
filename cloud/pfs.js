Parse.Cloud.job("sendPFSEmail", function(request, status) {
    var Mailgun = require('mailgun');
    Mailgun.initialize('sandboxed0e928a89f043bf9593550b03de91e8.mailgun.org', 'key-c5fb719216d46d9be9d8bf80bfb468ad');

    Mailgun.sendEmail({
      to: "jhoffing@scpr.org",
      from: "Mailgun@CloudCode.com",
      subject: "Hello from Cloud Code!",
      text: "Using Parse and Mailgun is great!"
    }, {
      success: function(httpResponse) {
        console.log(httpResponse);
        response.success("Email sent!");
      },
      error: function(httpResponse) {
        console.error(httpResponse);
        response.error("Uh oh, something went wrong");
      }
    }).then(function() {
        // Set the job's success status
        status.success("Email send-off job completed successfully.");
        }, function(error) {
        // Set the job's error status
        status.error("Uh oh, something went wrong.");
    });
});

