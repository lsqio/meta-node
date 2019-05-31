
Mutable Meta client for node
===


Service Discovery and Config manager
===

This package is a wrapper to the background service `Mutable Meta`. Mutable Meta is responsible for service discovery and service configuration.

## API
```js
const Meta = require('@mutable/meta')
```

  All methods are asynchronous, and take a node-style error-first callback as last argument.
  If no callback is supplied, a promise is returned instead.


Service Discovery
---

### Meta.services() -> Array<String>

  Returns all the currently known service names.

Example:
```js

  Meta.services()
    .then((_services) => {
      // returns an object {}
    })

```

### Meta.service(service: String) -> Service

  Returns a particular service.

Example:
```js

  Meta.service("email")
    .then((service) => {
      request.post(`http://${service}/api/v1/demo/email`,
        {json:req.body},
        (error, response, body) => {
          if(error){
            console.error('can not reach email service')
            return res.send(500,{error:error,result:'can not reach email service'})
          } 
          res.send({result:"email sent"})
        })
    })

```

or 

```js

  Meta.service("email", (config) => {

    // returns a object 
    // {"hostname":"127.0.0.1", "port":3001, toString(): "127.0.0.1:3001" }
    // in a string it prints concat host and port

    request.post(`http://${service}/api/v1/demo/email`,
    {json:req.body},
    (error, response, body) => {
      if(error){
        console.error('can not reach email service')
        return res.send(500,{error:error,result:'can not reach email service'})
      } 

      res.send({result:"email sent"})
    })
  })

```

Config
---


### Meta.config() -> JSON

  Fetches the JSON configuration for the current service.

Example:
```js

  Meta.config()
    .then((_config) => {
      // returns an object {}
    })

```

Resources
---
- [Service Discovery and Config](https://github.com/mutable)
- [Mutable.io Docs](https://github.com/mutable/docs)

