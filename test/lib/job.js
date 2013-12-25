var request = require('request');
var fs = require('fs');
var path = require('path');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://localhost:27017/viffService?auto_reconnect', {safe: true});
var JobsModule = require('../../lib/jobs');

require('../../lib/app');

describe('Jobs RESTFUL', function () {
  var existingFile;
  var uploadsPath = path.join(__dirname, "../../uploads");
  this.timeout(20000);
  // recode existing files in uploads/configFile.json 
  before(function (done) {
    fs.readdir(uploadsPath, function (err, fileList) {
      existingFile = fileList;
      done();
    });
  });

  // remove created test uploaded files and revert db changes
  after(function (done) {
    //remove uploaded files
    fs.readdir(uploadsPath, function (err, fileList) {
      fileList.forEach(function (file) {
        if (existingFile.indexOf(file) == -1) {
          fs.unlink(uploadsPath + '/' + file, function (err) {
            if (err) {
              console.error(err);
            }
          });
        }
      });
      //remove db changes
      db.collection('job').remove(
        {$or: [
          {name: "test job"},
          {name: "db save job test"}
        ]},
        function (err) {
          if (err) {
            console.error(err);
          }
          done();
        });
    });
  });

  it('should return 200 when post to /jobs ', function (done) {
    var r = request.post('http://localhost:3000/jobs', callback);
    var form = r.form();
    form.append('jobName', 'test job');
    form.append('configFile', fs.createReadStream(__dirname + '/configFile.json'));

    function callback() {
      done();
    }
  });

  it('should put attached file in %PROJECT_PATH/uploads from post /job', function (done) {
    var r = request.post('http://localhost:3000/jobs', callback);
    var form = r.form();
    form.append('jobName', 'test job');
    form.append('configFile', fs.createReadStream(__dirname + '/configFile.json'));

    // function callback(err,response,body) {
    function callback() {
      done();
    }
  });

  it('should insert the path of uploaded json file into db', function (done) {
    var r = request.post('http://localhost:3000/jobs', callback);
    var form = r.form();
    form.append('jobName', 'db save job test');
    form.append('configFile', fs.createReadStream(__dirname + '/configFile.json'));

    function callback(error, response) {
      if (!error && response.statusCode == 200) {
        db.collection('jobs').findOne({name: "db save job test"}, function (err, job) {
          if (err) {console.error(err);}
          job.name.should.eql('db save job test');
          job.config.should.match(/\.json$/);
          done();
        });
      }
    }
  });
});


describe('Jobs MODEL', function () {
  var Job = JobsModule.Job;
  describe('Job', function () {
    it('should initialize from a Object', function() {
      var jobObj = {
        name: 'test'  
      };
      var job = new Job(jobObj);
      job.get('name').should.equal(jobObj.name);
    });
  });

  describe('Jobs', function() {
    var memCruder = {
      _store: [] 
    };

    var Jobs = JobsModule.Jobs(memCruder);

    beforeEach(function () {
      memCruder._store = [];
    });

    it('should create a new job', function(done) {
      memCruder.create = function(obj, fn) {
        var self = this;
        setTimeout(function() {
          obj._id = '001';
          self._store.push(obj);
          fn(null, obj);
        });
      };
      Jobs.create({name: 'test'}, function(err, job) {
        job.should.be.instanceOf(Job);
        job.get('_id').should.equal('001');
        done();      
      });
    });

    it('should list all jobs', function(done) {
      memCruder._store = [{
        _id: '001',
        name: 'test1'
      }, {
        _id: '002',
        name: 'test2'
      }];
      memCruder.find = function(fn) {
        setTimeout(function() {
          fn(null, this._store);
        }.bind(this));
      };
      Jobs.all(function(err, jobs) {
        jobs.forEach(function(job, idx) {
          job.should.be.instanceOf(Job);
          job.get('_id').should.equal(memCruder._store[idx]._id);
        });
        done();
      });
    });

    it('should find only one job for id', function(done) {
      memCruder._store = [{
        _id: '001',
        name: 'test1'
      }, {
        _id: '002',
        name: 'test2'
      }];

      memCruder.findById = function(id, fn) {
        setTimeout(function() {
          var store = memCruder._store,
              idx = 0,
              job;

          while(!!(job = store[idx++])) {
            if (job._id === id) {
              fn(null, job);
            }
          }
        });
      };

      Jobs.id('002', function(err, job) {
        job.get('_id').should.equal('002')
        job.get('name').should.equal('test2');
        done();
      });
    });
  });
});
