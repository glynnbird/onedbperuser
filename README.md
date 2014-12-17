# 1-DB API

When writing mobile applications, the design pattern "one-database-per-user" is often used to allow

* each user's database to be separated from each other
* each user has their own username/password/database
* each user's database is relatively small; small enough to fit on a mobile device

The design pattern can be used when data is to be replicated between a mobile device and a Cloudant account, either using

* PouchDB for in-browser storage
* Cloudant Sync for native iOS or Android applications

This repository provides some tooling to provide an API that allows an application data to:

* provide a user sign up form
* call the API to send a pin code to the user's phone via SMS or email
* if the correct pin code is entered, a new database/username/password is created

## Pre-requisites

This application works out-of-the box on IBM's BlueMix platofrom. Simply:

* signup for a BlueMix account
* create a new Node.js app
* add a Cloudant Service
* configure a Twilio Service, and/or a SendGrid email service
* upload the code

You will need to sign up for a Twilio account at https://www.twilio.com/ and/or a SendGrid account at https://sendgrid.com/.

## The API

The sign up path is two-stage process. In the first stage, a "/register" request is made, supplying the user's phone number and the application name. The second stage feeds back the pin number and creates the Cloudant account and security settings.

### POST /register

POST /register

Parameters:
* mobile - the mobile number of the user in international format e.g. +447123456789
* email - the email addres of the user e.g. glynn.bird@uk.ibm.com
* appname - the name of the application e.g. myapp

One of mobile and email must be supplied.

Calling this API will generate a registration request and return to you:

```
{
    "registration_id": "id5458436d-01b5-43bc-b8b9-8bdb8a5ba0f9",
    "mobile": "+447123456789",
    "appname": "myapp",
    "ok": "true"
}
```

In addition
* a text message will be sent to the mobile number with the message, if a mobile number was supplied
* or an email message will be sent to the email address

```
  Your PIN CODE is 176447. Please enter the PIN into the application to register.
```

### POST /signup

POST /register

Parmeters:
* registration_id - the id received from the call to POST /register
* pin - the user supplied pin from the text message

If the details are correct, the API will create a Cloudant database (or it may exist already if this is a second sign-up attempt) and a unique username/password that has access to that database. All of this data will be returned in reply to the API call:

```
{
    "ok": "true",
    "password": "aGjExyMoVsF3Y3bjp8Ovw1XN",
    "key": "tentOceribirrouldneredst",
    "db": "bob_83908a4c40e5b43a9d998338a5beca5a1704bbf8",
    "host": "54a13c74-3351-4bb4-a93c-79a723b29443-bluemix.cloudant.com"
}
```

This will allow a URL to be formed:

```
  https://<<key>>:<<password>>@<<host>>/<<db>>
```

to gain access to the newly created database.




