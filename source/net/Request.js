import Environment from "../../src-tool/Environment";
import Utils from "../Utils";
  
  
  var _RGX1 = "^https?://(?:[a-z][a-z0-9\-]+\.)*";
  //var _RGX1 = "^https?://([a-z\d\-]+\.)*";
  var _RGX2 = "(?:/|$|:)";

  var Request = function(_path,_file,_data,_method,cookieFlag,extraHeaders) {
    this.setPath(_path);
    this.setFile(_file);
    this.setData(_data);
    this.setMethod(_method);
    this.setCookieFlag(cookieFlag);
    this.setExtraHeaders(extraHeaders);
  };
  
  Request._GET = "GET";
  Request._POST = "POST";


  Request.prototype = {
    toString: function(){
      return ["[",this._path,this._file,this._data,this._method,"]"].join("|");
    },
    
    setPath: function(_path) {
      while (_path && _path.substring(_path.length-1) == "/") {
        _path = _path.substring(0,_path.length-1);
      }
      this._path = _path;
    },
    
    setFile: function(_file) {
      while (_file && _file.substring(0,1) == "/") {
        _file = _file.substring(1);
      }
      this._file = _file;
    },
    
    setMethod: function(_method) {
      this._method = _method || Request._POST;
    },
    
    setCookieFlag: function(cookieFlag) {
      this.cookieFlag = cookieFlag || false;
    },
    
    setExtraHeaders: function(extraHeaders) {
      this.extraHeaders = extraHeaders || null;
    },
    
    setData: function(_data) {
      this._data = _data;
    },
    
    extendData: function(moreData) {
      if (!this._data) {
        this.setData(moreData);
      } else if (!this.containsData(moreData)) {
        this._data += moreData;
      }
    },
    
    containsData: function(someData) {
      return this._data && this._data.indexOf(someData) > -1;
    },
    
    ////
    
    getPath: function() {
      return this._path;
    },
    
    getFile: function() {
      return this._file;
    },
    
    getUrl: function() {
      if (this._file) {
        return this._path+"/"+this._file;
      } else {
        return this._path;
      }
    },
    
    getCookieFlag: function() {
      return this.cookieFlag;
    },
    
    getExtraHeaders: function(extraHeaders) {
      return this.extraHeaders;
    },
    
    getData: function() {
      return this._data;
    },
    
    getUrlWithParams: function(sep) {
      if (this._data) {
        return this.getUrl()+"?"+this._data;
      } else {
        return this.getUrl();
      }
    },
    
    getMethod: function() {
      return this._method;
    },
    
    clone: function() {
      return new Request(this._path,this._file,this._data,this._method,this.cookieFlag,this.extraHeaders);
    },
    
    isRelativeRequest: function() {
      return !(this._path.indexOf("http://") == 0 || this._path.indexOf("https://") == 0 || this._path.indexOf("file:///") == 0);
    },
    
    /**
     * 
     * @param theDomain
     * @param prot in the form "scheme:"
     */
    isSameDomain: function(theDomain,prot) {
      
      if (!Environment.isBrowser()) {
        return false;
      }
      
      if (this.isRelativeRequest()) {
        //relative address
        return Environment.isWebWorker() ? location.hostname == theDomain :  Utils.getDomain() == theDomain;
        //on webworkers the document.domain is not accessible, the best aproximation is the location.hostname value
        
      } else if (prot) {
        if (!this.isSameProtocol(prot)) {
          //may be same domain but on a different protocol, we consider it not same domain
          return false;
        }
        
        if (prot == "file:") {
          //file requests have empty domain
          return theDomain == "";
        }
        
      }
      
      //convert the domain so that it can be used as part of a regexp
      theDomain = theDomain.replace(".","\.");
      //then make the regexp
      var rgx = new RegExp(_RGX1+theDomain+_RGX2,"i");
      
      //and test it
      return rgx.test(this._path);
      
    },
    
   
    isSameProtocol: function(prot) {
      
      if (!Environment.isBrowser()) {
        return false;
      }
      
      if (prot.indexOf(":") != prot.length-1) {
        //wrong form
        return false;
      }
      
      return this.isRelativeRequest() ? location.protocol == prot : this._path.indexOf(prot) == 0;
    },
    
    isCrossSite: function() {
      if (!Environment.isBrowser()) {
        return true;
      }
      
      var refDomain = Environment.isWebWorker() ? location.hostname :  Utils.getDomain(); 
      
      return !this.isSameDomain(refDomain,location.protocol);
    },
    
    isCrossProtocol: function() {
      if (!Environment.isBrowser()) {
        return true;
      }
      return !this.isSameProtocol(location.protocol);
    }
    
  };
  
  Request.aboutBlank = new Request("about:blank");
  
  
  export default Request;
  
