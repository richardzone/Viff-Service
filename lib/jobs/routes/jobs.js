module.exports = function(Jobs) {

  var routes = {};

  // GET /jobs
  routes.index = function(req, res) {
    Jobs.all(function(error, jobs) {
      if (error) {
        return res.send(400);
      }
      res.send(200, jobs);
    });
  };

  // GET /jobs/new
  routes.new = function(req, res) {
    res.render('new-job', { title: 'Create A new Viff Job' });
  };

  // GET /jobs/:job
  routes.show = function(req, res) {
    Jobs.id(req.param('id'), function(error, job) {
      if (error) {
        return res.send(400);
      }
      res.send(200, job);
    });
  };

  // POST /jobs
  routes.create = function(req, res) {
    var filePath = req.files.configFile.path;
    var job = {
      name:req.param('name'),
      createdTime: new Date(),
      config:filePath,
      description: req.param('description')
    };
    Jobs.create(job ,function (error, job) {
      if (error) {
        return res.send(400);
      }
      return res.format({
        html: function() {
          res.redirect('/');
        },
        json: function() {
          res.send(200, job);
        }
      });
    });
  };

  // PUT /jobs/:job
  routes.update = function(req, res) {
    res.send(404);
  };

  // DELETE /jobs/:job
  routes.destory = function(req, res) {
    res.send(404);
  };

  routes.createFormValidation = function(req, res, next) {
    // create form validations are here
    req.assert('name', '1 to 30 charachors required').notEmpty().len(1, 30);
    var fileError;
    var uploadFile = req.files;
    if (JSON.stringify(uploadFile) =="{}") {
      fileError = { param: 'configFile', msg: 'null file', value: '' };
    }else if(!uploadFile.configFile.originalFilename.match(/\.json$/)){
      fileError = { param: 'configFile', msg: 'only accept .js file', value: 'uploadFile.configFile.originalFilename' };
    }
    if (fileError || req.validationErrors() && req.validationErrors().length) {
      return res.format({
        html: function() {
          res.render('new-job', {title: 'Create A new Viff Job', errors: (req.validationErrors()).push(fileError) });
        },
        json: function() {
          res.send(400, req.validationErrors());
        }
      });
    }
    return next();
  };

  return routes;
};

