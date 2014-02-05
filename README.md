### Setup
To get this up and running, you will need to add a file and folder `config/global.json` in the project root.

Your global.json file will look something like this: 
```json
{
    "applications": {
        "SCPR": {
            "applicationId": "YOUR_APPLICATION_ID", 
            "masterKey": "YOUR_MASTER_KEY"
        }, 
        "_default": {
            "link": "SCPR"
        }
    }, 
    "global": {
        "parseVersion": "1.2.16"
    }
}
```


### Functions
#### social_data
Endpoint used to recieve share counts for a given set of articles.


Yields a hash in the form:
```json
    {"show_segment-35866" :  
        {"share_count" : 75},
     "news_story-41960" : 
        {"share_count" : 42}, ....}
```

iOS implementation would look something like this:
```objc
[PFCloud callFunctionInBackground:@"social_data"
                   withParameters:@{@"articleIds": [@"show_segment-35866", @"news_story-41960"]}
                            block:^(NSDictionary *results, NSError *error) {
        // Do something awesome
}];
```

Android implementation would look something like this:
```java
ParseCloud.callFunctionInBackground("social_data", ["show_segment-35866", "news_story-41960"], new FunctionCallback<Object>() {
   void done(HashMap<String, HashMap<String, Integer>> results, ParseException e) {
        // Do something awesome
   }
});
```
