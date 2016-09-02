var _                 = require('underscore')
  , vm                = require('vm')
  , domain            = require('domain')
  ;

function Code(data) {
  this.data = data || {};
};

Code.prototype.run = function(req, res, next) {
  var d = domain.create();

  d.on('error', function(err) {
    return next(err);
  });

  d.run(() => {
    var context   = vm.createContext(_.defaults({ module : {}, require : require }, global))
      , blob      = this.data.blob
      , filename  = this.data.filename
      , script    = new vm.Script(blob, { filename : filename })
      ;

    // todo [akamel] can throw 'Script execution timed out.' explain to user / otherwise hard to understand
    script.runInContext(context, { timeout : 2000 });

    var fct = context.module.exports;
    if (_.isFunction(fct)) {
      fct.call(req.app, req, res, next);
    } else {
      var err = new Error('module.exports not set to a function');
      err.help_url = 'https://taskmill.io/help';

      throw err;
    }
  });
};

module.exports = Code;