#### Setup
To get this up and running on, you will need to add a file and folder `config/global.json` in the project root.

Your global.json file will look something like this: 
```
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