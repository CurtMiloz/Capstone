var unirest = require('unirest');
var locks = require('locks');
var fs = require('fs');
var drinks = require('../lib/types');
var http = require('http');
var url = require('url');
var request = unirest.request;

function _isInt(val) {
	return val.match(/^-{0,1}\d+$/) != null;
}

function TestRes() {
	this._test_num = 0;
	this.mutex = locks.createMutex();
};

TestRes.prototype.testRes = function(desc, req, exp, act, pass) {
	var that = this;
	this.mutex.timedLock(10000, function(err) {
		if (err) {
			console.log("ERROR obtaining lock.");
		} else {
			that._test_num += 1;
			fs.appendFileSync('./results.txt', `${that._test_num}, ${desc}, ${req}, ${exp}, ${act}, ${pass}\n`);
			that.mutex.unlock();
		}
	});
};

var tests = {
	generalTest: {
		getDrinks: function(resObj, host) {
			return new Promise(function(resolve, reject) {
				unirest.get(host + '/drinks')
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
				.end(function(res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test GET /drinks endpoint', '', 200, res.code, 'fail');
					} else {
						var pass = true;
						var types = Object.keys(drinks);
						if (types.length != Object.keys(res.body).length) {
							pass = false;
						}
						for (let type in res.body) {
							if (types.indexOf(type) < 0 || res.body[type] != drinks[type]) {
								pass = false;
								break;
							}
						}
						for (let type of types) {
							if (!(type in res.body) || res.body[type] != drinks[type]) {
								pass = false;
								break;
							}
						}

						if (pass) {
							resObj.testRes('Test GET /drinks endpoint', '', 'res.body == drinkTypes', 'res.body == drinkTypes', 'pass');
						} else {
							resObj.testRes('Test GET /drinks endpoint', '', 'res.body == drinkTypes', 'res.body != drinkTypes', 'fail');
						}
					}
					resolve();
				});
			});
		},

		getNumOfTanks: function(resObj, host) {
			return new Promise(function(resolve, reject) {
				unirest.get(host + '/numOfTanks')
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
				.end(function(res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test GET /numOfTanks endpoint', '', 200, res.code, 'fail');
					} else {
						if (res.raw_body.trim() == '3') {
							resObj.testRes('Test GET /numOfTanks endpoint', '', 'res.raw_body == 3', 'res.raw_body == 3', 'pass');
						} else {
							resObj.testRes('Test GET /numOfTanks endpoint', '', 'res.raw_body == 3', 'res.raw_body != 3', 'fail');
						}
					}
					resolve();
				});
			});
		}
	},

	adminTest: {
		_creds: {
			userName: 'admin',
			password: 'admin'
		},

		_error: 123,
		_cookieJar: unirest.jar(true),

		updateCreds: function(resObj, host) {
			var that = this;
			return new Promise(function(resolve, reject) {
				var data = {
					userName: 'admin_new',
					password: 'admin_new'
				};

				unirest.post(host + '/updateCreds')
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
				.auth(that._creds.userName, that._creds.password)
				.send(data)
				.end(function (res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test POST /updateCreds endpoint', 'NFR33', 200, res.code, 'fail');
						resolve();
					} else {
						unirest.post(host + '/updateCreds')
						.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
						.auth(data.userName, data.password)
						.send(that._creds)
						.end(function(res) {
							if (res.code < 200 || res.code > 299) {
								resObj.testRes('Test POST /updateCreds endpoint', 'NFR33', 200, res.code, 'fail');
							} else {
								resObj.testRes('Test POST /updateCreds endpoint', 'NFR33', 200, res.code, 'pass');
							}
							resolve();
						});
					}
				});
			});
		},

		login: function(resObj, host) {
			var that = this;
			return new Promise(function(resolve, reject) {
				unirest.post(host + '/login')
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
				.auth(that._creds.userName, that._creds.password)
				.jar(that._cookieJar)
				.end(function(res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test POST /login endpoint', 'NFR33', 200, res.code, 'fail');
					} else {
						resObj.testRes('Test POST /login endpoint', 'NFR33', 200, res.code, 'pass');
					}
					resolve();
				});
			});
		},

		isValidSess: function(resObj, host) {
			var that = this;
			return new Promise(function(resolve, reject) {
				unirest.get(host + '/isValidSess')
				.headers({'Accept': 'application/json'})
				.jar(that._cookieJar)
				.end(function(res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test GET /isValidSess endpoint', '', 200, res.code, 'fail');
					} else {
						resObj.testRes('Test GET /isValidSess endpoint', '', 200, res.code, 'pass');
					}
					resolve();
				});
			});
		},

		logout: function(resObj, host) {
			var that = this;
			return new Promise(function(resolve, reject) {
				unirest.post(host + '/logout')
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
				.jar(that._cookieJar)
				.end(function(res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test POST /logout endpoint', '', 200, res.code, 'fail');
					} else {
						resObj.testRes('Test POST /logout endpoint', '', 200, res.code, 'pass');
					}
					resolve();
				});
			});
		},

		setMap: function(resObj, host) {
			var that = this;
			return new Promise(function(resolve, reject) {
				var data = fs.readFileSync('./map_test.txt');
				unirest.post(host + '/map')
				.headers({'Accept': 'application/json', 'Content-Type': 'text/plain', 'Content-Length': data.length})
				.auth(that._creds.userName, that._creds.password)
				.send(data)
				.end(function(res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test POST /map endpoint', 'AD1/AD2', 200, res.code, 'fail');
					} else {
						resObj.testRes('Test POST /map endpoint', 'AD1/AD2', 200, res.code, 'pass');
					}
					resolve();
				});
			});
		},

		getMap: function(resObj, host) {
			var that = this;
			return new Promise(function(resolve, reject) {
				unirest.get(host + '/map')
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
				.auth(that._creds.userName, that._creds.password)
				.end(function(res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test GET /map endpoint', 'AD1/AD2', 200, res.code, 'fail');
					} else {
						fs.readFile('./map_test.txt', 'utf8', function(err, contents) {
							if (err) {
								console.log('ERROR reading file.');
								resObj.testRes('Test GET /map endpoint', 'AD1,AD2', 'File contents == Map received', 'N/A', 'fail');
							} else {
								if (res.raw_body.trim() == contents.trim()) {
									resObj.testRes('Test GET /map endpoint', 'AD1/AD2', 'File contents == Map received', 'File contents == Map received', 'pass');
								} else {
									resObj.testRes('Test GET /map endpoint', 'AD1/AD2', 'File contents == Map received', 'File contents != Map received', 'fail');
								}
							}
						});
					}
					resolve();
				});
			});
		},

		getErrorCode: function(resObj, host) {
			var that = this;
			return new Promise(function(resolve, reject) {
				unirest.get(host + '/errors')
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
				.auth(that._creds.userName, that._creds.password)
				.end(function(res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test GET /errors endpoint', '', 200, res.code, 'fail');
					} else {
						if (res.raw_body === that._error.toString()) {
							resObj.testRes('Test GET /errors endpoint', '', that._error.toString(), res.raw_body, 'pass');
						} else {
							resObj.testRes('Test GET /errors endpoint', '', that._error.toString(), res.raw_body, 'fail');
						}
					}
					resolve();
				});
			});
		},

		deleteDrink: function(resObj, host) {
			var that = this;
			return new Promise(function(resolve, reject) {
				unirest.delete(host + '/drinks?name=COKE')
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
				.auth(that._creds.userName, that._creds.password)
				.end(function(res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test DELETE /drinks endpoint', '', 200, res.code, 'fail');
						resolve();
					} else {
						unirest.get(host + '/drinks')
						.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
						.end(function(res) {
							if (res.code < 200 || res.code > 299) {
								resObj.testRes('Test DELETE /drinks endpoint', '', 200, res.code, 'fail');
							} else {
								if ('COKE' in res.body) {
									resObj.testRes('Test DELETE /drinks endpoint', '', 'Missing COKE', 'NOT missing COKE', 'fail');
								} else {
									resObj.testRes('Test DELETE /drinks endpoint', '', 'Missing COKE', 'Missing COKE', 'pass');
								}
							}
							resolve();
						});
					}
				});
			});
		},

		addDrink: function(resObj, host) {
			var that = this;
			return new Promise(function(resolve, reject) {
				var data = {
					COKE: 2
				};

				unirest.post(host + '/drinks')
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
				.auth(that._creds.userName, that._creds.password)
				.send(data)
				.end(function(res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test POST /drinks endpoint', '', 200, res.code, 'fail');
						resolve();
					} else {
						unirest.get(host + '/drinks')
						.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
						.end(function(res) {
							if (res.code < 200 || res.code > 299) {
								resObj.testRes('Test POST /drinks endpoint', '', 200, res.code, 'fail');
							} else {
								if ('COKE' in res.body) {
									resObj.testRes('Test POST /drinks endpoint', '', 'COKE in body', 'COKE in body', 'pass');
								} else {
									resObj.testRes('Test POST /drinks endpoint', '', 'COKE in body', 'COKE NOT in body', 'fail');
								}
							}
							resolve();
						});
					}
				});
			});
		},

		placeInLine: function(resObj, host, table_id) {
			var that = this;
			return new Promise(function(resolve, reject) {
				unirest.get(host + `/placeInLine?table_id=${table_id}`)
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
				.auth(that._creds.userName, that._creds.password)
				.end(function(res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test GET /placeInLine?table_id endpoint', '', 200, res.code, 'fail');
						resolve();
					} else {
						if (_isInt(res.raw_body.trim())) {
							resObj.testRes('Test GET /placeInLine?table_id endpoint', '', 'to be integer', res.raw_body, 'pass');
						} else {
							resObj.testRes('Test GET /placeInLine?table_id endpoint', '', 'to be integer', res.raw_body, 'fail');
						}
					}
					resolve();
				});
			});
		},

		availableTables: function(resObj, host) {
			var that = this;
			return new Promise(function(resolve, reject) {
				unirest.get(host + '/availableTables')
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
				.auth(that._creds.userName, that._creds.password)
				.end(function(res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test GET /availableTables endpoint', '', 200, res.code, 'fail');
						resolve();
					} else {
						if (res.raw_body === '0,1,2,3,4,5,6,7') {
							resObj.testRes('Test GET /availableTables endpoint', '', '0,1,2,3,4,5,6,7', res.raw_body, 'pass');
						} else {
							resObj.testRes('Test GET /availableTables endpoint', '', '0,1,2,3,4,5,6,7', res.raw_body, 'fail');
						}
					}
					resolve();
				});
			});
		}
	},

	clientTest: {
		_creds: {
			userName: 'admin',
			password: 'admin'
		},
		token: null,
		table_id: 1,

		getToken: function(resObj, host) {
			var that = this;
			return new Promise(function(resolve, reject) {
				unirest.post(host + `/table?table_id=${that.table_id}`)
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
				.auth(that._creds.userName, that._creds.password)
				.end(function(res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test POST /table endpoint', 'NFR33', 200, res.code, 'fail');
					} else {
						if (!('token' in res.body) || !('token_type' in res.body)) {
							resObj.testRes('Test POST /table endpoint', 'NFR33', '"token" and "token_type" in body', '"token" or "token_type" NOT in body', 'fail');
						} else {
							that.token = res.body.token;
							resObj.testRes('Test POST /table endpoint', 'NFR33', '"token" and "token_type" in body', '"token" and "token_type" in body', 'pass');
						}
					}
					resolve();
				});
			});
		},

		placeOrder: function(resObj, host) {
			var that = this;
			return new Promise(function(resolve, reject) {
				var data = {
					order: [
						{
							type: 'COKE'
						}
					]
				};

				unirest.post(host + '/placeOrder')
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${that.token}`})
				.send(data)
				.end(function(res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test POST /placeOrder endpoint', 'TO1/TO2', 200, res.code, 'fail');
					} else {
						resObj.testRes('Test POST /placeOrder endpoint', 'TO1/TO2', 200, res.code, 'pass');
					}
					resolve();
				});
			});
		},

		placeInLine: function(resObj, host) {
			var that = this;
			return new Promise(function(resolve, reject) {
				unirest.get(host + `/placeInLine`)
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${that.token}`})
				.end(function(res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test GET /placeInLine endpoint', 'AF14', 200, res.code, 'fail');
					} else {
						if (res.raw_body == 1) {
							resObj.testRes('Test GET /placeInLine endpoint', 'AF14', 'res.raw_body == 1', 'res.raw_body == 1', 'pass');
						} else {
							resObj.testRes('Test GET /placeInLine endpoint', 'AF14', 'res.raw_body == 1', 'res.raw_body != 1', 'fail');
						}
					}
					resolve();
				});
			});
		},

		cancelOrder: function(resObj, host) {
			var that = this;
			return new Promise(function(resolve, reject) {
				unirest.delete(host + `/cancelOrder`)
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${that.token}`})
				.end(function(res){
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test DELETE /cancelOrder endpoint', '', 200, res.code, 'fail');
					} else {
						resObj.testRes('Test DELETE /cancelOrder endpoint', '', 200, res.code, 'pass');
					}
					resolve();
				});
			});
		}
	},

	robotTest: {
		token: null,
		_error: 123,

		reqListenForToken: function(host, cb) {
			var that = this;

			http.createServer(function(req, res) {
				var req_url = url.parse(req.url, true);
				if (req.method.toUpperCase() === 'POST' && req_url.pathname.toLowerCase().replace(/\//, '') === 'token') {
					var body = '';
					req.on('data', function(data) {
						body += data;
					});

					req.on('end', function() {
						try {
							jsonDict = JSON.parse(body);
						} catch (e) {
							res.writeHead(500);
							res.end();
							return;
						}

						that.token = jsonDict.access_token;
						res.writeHead(200);
						res.end();
						cb();
					});
				} else {
					res.writeHead(404);
					res.end();
				}
			}).listen(8000, '0.0.0.0', function() {
				unirest.post(host + '/genToken')
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
				.end(function(res) {
					console.log(res.code);
				});
			});
		},

		checkToken: function(resObj, host) {
			var that = this;
			return new Promise(function(resolve, reject) {
				unirest.get(host + '/checkToken')
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${that.token}`})
				.end(function(res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test GET /checkToken endpoint', 'NFR33', 200, res.code, 'fail');
					} else {
						if (! ('valid' in res.body)) {
							resObj.testRes('Test GET /checkToken endpoint', 'NFR33', 'Must return validity of token', 'Does not include validity of token', 'fail');
						} else {
							resObj.testRes('Test GET /checkToken endpoint', 'NFR33', 'Must return validity of token', 'Includes validity of token', 'pass');
						}
					}
					resolve();
				});
			});
		},

		getMap: function(resObj, host) {
			var that = this;
			return new Promise(function(resolve, reject) {
				unirest.get(host + '/map')
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${that.token}`})
				.end(function(res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test GET /map endpoint', 'AF3', 200, res.code, 'fail');
					} else {
						fs.readFile('./map_test.txt', 'utf8', function(err, contents) {
							if (err) {
								console.log('ERROR reading file.');
								resObj.testRes('Test GET /map endpoint', 'AF3', 'File contents == Map received', 'N/A', 'fail');
							} else {
								if (res.raw_body.trim() == contents.trim()) {
									resObj.testRes('Test GET /map endpoint', 'AF3', 'File contents == Map received', 'File contents == Map received', 'pass');
								} else {
									resObj.testRes('Test GET /map endpoint', 'AF3', 'File contents == Map received', 'File contents != Map received', 'fail');
								}
							}
						});
					}
					resolve();
				});
			});
		},

		setErrorCode: function(resObj, host) {
			var that = this;
			return new Promise(function(resolve, reject) {
				unirest.post(host + '/errors')
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${that.token}`})
				.send(that._error.toString())
				.end(function(res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test POST /errors endpoint', '', 200, res.code, 'fail');
					} else {
						resObj.testRes('Test POST /errors endpoint', '', 200, res.code, 'pass');
					}
					resolve();
				});
			});
		},

		nextOrder: function(resObj, host) {
			var that = this;
			return new Promise(function(resolve, reject) {
				unirest.get(host + '/nextOrder')
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${that.token}`})
				.end(function(res) {
					if (res.code < 200 || res.code > 299) {
						resObj.testRes('Test GET /nextOrder endpoint', '', 200, res.code, 'fail');
					} else {
						var keys = ['table_id', 'order_id', 'order'];
						var passed = true;
						var body_keys = Object.keys(res.body);

						for (let key of keys) {
							if (body_keys.indexOf(key) < 0) {
								passed = false;
								break;
							}
						}

						if (passed) {
							resObj.testRes('Test GET /nextOrder endpoint', 'AF4', 'Order should have all required keys', 'Order has all required keys', 'pass');
						} else {
							resObj.testRes('Test GET /nextOrder endpoint', 'AF4', 'Order should have all required keys', 'Order does not have all required keys', 'fail');
						}
					}
					resolve();
				});
			});
		}
	}
};

const IP = 'http://localhost:8080';
var resObj = new TestRes();


tests.robotTest.reqListenForToken(IP, function() {
	tests.generalTest.getDrinks(resObj, IP).then(function() {
		return tests.generalTest.getNumOfTanks(resObj, IP);
	}).then(function() {
		return tests.adminTest.updateCreds(resObj, IP);
	}).then(function() {
		return tests.adminTest.login(resObj, IP);
	}).then(function() {
		return tests.adminTest.isValidSess(resObj, IP);
	}).then(function() {
		return tests.adminTest.logout(resObj, IP);
	}).then(function() {
		return tests.adminTest.setMap(resObj, IP);
	}).then(function() {
		return tests.adminTest.getMap(resObj, IP);
	}).then(function() {
		return tests.robotTest.setErrorCode(resObj, IP);
	}).then(function() {
		return tests.adminTest.getErrorCode(resObj, IP);
	}).then(function() {
		return tests.adminTest.deleteDrink(resObj, IP);
	}).then(function() {
		return tests.adminTest.addDrink(resObj, IP);
	}).then(function() {
		return tests.adminTest.availableTables(resObj, IP);
	}).then(function() {
		return tests.clientTest.getToken(resObj, IP);
	}).then(function() {
		return tests.clientTest.placeOrder(resObj, IP);
	}).then(function() {
		return tests.clientTest.placeInLine(resObj, IP);
	}).then(function() {
		return tests.clientTest.cancelOrder(resObj, IP);
	}).then(function() {
		return tests.clientTest.placeOrder(resObj, IP);
	}).then(function() {
		return tests.adminTest.placeInLine(resObj, IP, tests.clientTest.table_id);
	}).then(function() {
		return tests.robotTest.checkToken(resObj, IP)
	}).then(function() {
		return tests.robotTest.getMap(resObj, IP);
	}).then(function() {
		return tests.robotTest.nextOrder(resObj, IP);
	}).then(function() {
		console.log('DONE!');
	});
});

// TO RUN:
// on the server 'export BOT_HOST='localhost:8000''
// start node server
// On the server run the test script (this script)
// Should have a results.txt with results
