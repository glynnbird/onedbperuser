var thecache = {
};

var put = function(key, value,callback) {
  thecache[key] = value;
  callback(null, true);
};

var get = function(key,callback) {
  if(!thecache[key]) {
    callback(true, null);
  } else {
    callback(null, thecache[key]);
  }
};

var remove = function(key, callback) {
  delete thecache[key];
  callback(null, true);
}

module.exports = {
  put: put,
  get: get,
  remove: remove
}