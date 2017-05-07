'use strict'
let http = require('http')
let Promise = require('promise')
let { EventEmitter } = require('events')
class Meta extends EventEmitter {
  constructor(){
    super()
    this._service = new Map()
    this._config 
    this._configIndex = 0
    this._services 
    this._servicesIndex = 0
  }

  whoami () {
    return this._call('/v1/whoami')
  }

  config () {
    return this._config ? Promise.resolve(this._config) : this._watchConfig()
  }

  services () {
    return this._services ? Promise.resolve(this._services) : this._watchServices()
  }

  service (name) {
    if (this._service.has(name) && this._service.get(name).nodes && this._service.get(name).nodes.length > 0)
      return Promise.resolve(this._service.get(name).nodes)

    if (this._service.has(name))
      return Promise.reject(new Error("Service " + name + " has no healthy instances"))
   
    return this._watchService(name)
  }

  random (name) {
    return this.service(name)
      .then(services=> services[Math.random() * services.length | 0])
  }
  
  _watchConfig() {
    return this._call(`/v1/config?index=${this._configIndex}`,null,true)
      .then(res => {
        let index = this._configIndex
        let config = this._config
        this._configIndex = parseInt(res.headers['x-index'])
        this._config = res.body
        this._watchConfig()

        if(index < this._configIndex && JSON.stringify(config) !=  JSON.stringify(this._config) )
          this.emit('configChange',this._config) 

        return this._config
      }, err => {
        this._config = undefined
        throw err
      })
  }

  _watchServices() {
    return this._call(`/v1/services?index=${this._servicesIndex}`,null,true)
      .then(res => {
        let index = this._servicesIndex
        let services = this._services
        this._servicesIndex = parseInt(res.headers['x-index'])
        this._services = res.body
        this._watchServices()

        if(index < this._servicesIndex && JSON.stringify(services) !=  JSON.stringify(this._services))
          this.emit('servicesChange',this._services)  

        return this._services
      }, err => {
        this._services = undefined
        throw err
      })
  }

  _watchService(name) {
    let service = this._service.get(name)
    let index = service ? service.index : 0

    return this._call(`/v1/services/${name}?index=${index}`,null,true)
      .then(res => {
        let _index = parseInt(res.headers['x-index'])
        let nodes = service ? service.nodes : []
        this._service.set(name,{nodes: res.body, index: _index})
        this._watchService(name)
        if(index < _index && JSON.stringify(nodes) !=  JSON.stringify(this._service.get(name).nodes))
          this.emit('serviceChange',name)
        
        if (Array.isArray(res.body) && res.body.length == 0)
          throw new Error("Service " + name + " has no health instances")

        return this._service.get(name).nodes
      }, err => {
        this._service.delete(name)
        throw err
      })
  }

  _call (path,data,full) {
    let opts = { json: true, full : full }
    let _options = {
      path, 
      socketPath : process.env.META_SOCKET,
      method:'GET'
    }
    if (data) {
      _options.method = 'POST'
      opts.data = JSON.stringify(data)
    } 


    return this._request(_options,opts)
  }

  _request(_options,options) {
    return new Promise((resolve, reject) => {
      _options.headers = _options.headers ? _options.headers : {}
    
      if (options.json) _options.headers['Content-Type'] = 'application/json'
    
      let req = http.request(_options, onRes)
      req.on('error', reject)
      
      if (options.data) req.write(options.data)
      
      req.end()
      
      function onRes(_res) {
        if (options.encoding)
          _res.setEncoding(options.encoding)

        if (_res.statusCode < 400)
          augment({}, resolve)
        else
          augment(new Error('Server responded with a status of ' + _res.statusCode), reject)

        function augment(res, cb) {
          res.status = _res.statusCode
          res.headers = _res.headers
          res.body = ''
          _res
            .on('data', data => res.body += data)
            .on('end', ()=> { 
              if(options.json)
                try{
                  res.body = JSON.parse(res.body)
                }catch(e){}

                cb(options.full ? res : res.body) 
            })
            .resume()
        }
      }
    })
  }
}

module.exports = new Meta()


