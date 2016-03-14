const flow = require('flow/lib/flow');
const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;
chai.should();
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);


describe('flow.serial', function () {
    it('should run functions in right order', function () {
        var func1 = sinon.spy(function (callback) {
            setTimeout(function () {
                callback(null, '');
            }, 300);
        });
        var func2 = sinon.spy(function (data, callback) {
            setTimeout(function () {
                callback(null, '');
            }, 200);
        });
        var func3 = sinon.spy(function (data, callback) {
            setTimeout(function () {
                callback(null, '');
            }, 100);
        });
        flow.serial([func1, func2, func3],
            function (error, data) {
                expect(error).not.to.be.ok;
                func1.should.be.calledBefore(func2);
                func2.should.be.calledBefore(func3);
            });
    });

    it('should call next function with the result of current', function () {
        var func1 = sinon.spy(function (callback) {
            setTimeout(function () {
                callback(null, 2);
            }, 300);
        });
        var func2 = sinon.spy(function (data, callback) {
            setTimeout(function () {
                callback(null, data + 5);
            }, 200);
        });
        var func3 = sinon.spy(function (data, callback) {
            setTimeout(function () {
                callback(null, data * 2);
            }, 100);
        });
        flow.serial([func1, func2, func3],
            function (error, data) {
                expect(error).not.to.be.ok;
                func2.withArgs(2).should.be.called;
                func3.withArgs(7).should.be.called;
                data.should.equal(14);
            });
    });

    it('should return error if one function ends with error', function () {
        flow.serial([function (callback) {
                callback(true, '');
            }, function (data, callback) {
                callback(null, '');
            }],
            function (error, data) {
                error.should.be.ok;
            });
    });

    it('should not run second function if first failed', function () {
        var func1 = function (callback) {
            setTimeout(function () {
                callback(true, 10);
            }, 200);
        };
        var func2 = sinon.spy(function (data, callback) {
            setTimeout(function () {
                callback(null, 12);
            }, 100);
        });
        flow.serial([func1, func2],
            function (error, data) {
                error.should.be.ok;
                data.should.equal(10);
                func2.should.not.have.been.called;
            });
    });

    it('should handle empty array', function () {
        flow.serial([], function (error, data) {
            expect(error).not.to.be.ok;
            expect(data).not.to.be.ok;
        });
    });
});

describe('flow.parallel', function () {
    it('should run all functions', function () {
        var func1 = sinon.spy(function (callback) {
            setTimeout(function () {
                callback(null, 1);
            }, 400);
        });
        var func2 = sinon.spy(function (callback) {
            setTimeout(function () {
                callback(null, 2);
            }, 200);
        });
        flow.parallel([func1, func2], function (error, data) {
            data.should.be.a('array');
            data.length.should.equal(2);
            func1.should.be.calledOnce;
            func2.should.be.calledOnce;
        });
    });

    it('should write results in right order', function () {
        flow.parallel([function (callback) {
            setTimeout(function () {
                callback(null, 1);
            }, 500);
        }, function (callback) {
            setTimeout(function () {
                callback(null, 2);
            }, 200);
        }], function (error, data) {
            data.should.be.a('array');
            data[0].should.equal(1);
            data[1].should.equal(2);
        });
    });

    it('should return error if one function fails', function () {
        flow.parallel([function (callback) {
                setTimeout(function () {
                    callback(true, '');
                }, 500);
            }, function (callback) {
                setTimeout(function () {
                    callback(null, '');
                }, 200);
            }],
            function (error, data) {
                error.should.be.ok;
            });
    });

    it('should finish other functions if one fails', function () {
        flow.parallel([function (callback) {
                setTimeout(function () {
                    callback(true, '');
                }, 100);
            }, function (callback) {
                setTimeout(function () {
                    callback(null, 1);
                }, 300);
            }],
            function (error, data) {
                error.should.be.ok;
                data[1].should.equal(2);
            });
    });

    it('should handle empty array', function () {
        flow.parallel([], function (error, data) {
            expect(error).not.to.be.ok;
            data.length.should.equal(0);
        });
    });
});

describe('flow.map', function () {
    it('should run function with all values', function () {
        var func = sinon.spy(function (value, callback) {
            callback(null, value * 2);
        });
        flow.map([10, 20, 30], func, function (error, data) {
            expect(error).not.to.be.ok;
            data.length.should.equal(3);
            func.withArgs(10).should.be.calledOnce;
            func.withArgs(20).should.be.calledOnce;
            func.withArgs(30).should.be.calledOnce;
            func.should.be.calledThrice;
        });
    });

    it('should write results in right order', function () {
        flow.map([10, 20, 30], function (value, callback) {
            callback(null, value * 2);
        }, function (error, data) {
            expect(error).not.to.be.ok;
            data[0].should.equal(20);
            data[1].should.equal(40);
            data[2].should.equal(60);
        });
    });

    it('should return error if one function fails', function () {
        flow.map([0, 10], function (value, callback) {
                if (value == 0) {
                    callback(true, 0);
                } else {
                    callback(null, value);
                }
            },
            function (error, data) {
                error.should.be.ok;
            });
    });

    it('should finish other functions if one fails', function () {
        flow.map([0, 10, 20], function (value, callback) {
                if (value == 0) {
                    setTimeout(function () {
                        callback(true, 0);
                    }, 200);
                } else {
                    setTimeout(function () {
                        callback(null, value);
                    }, 100);
                }
            },
            function (error, data) {
                error.should.be.ok;
                data[1].should.equal(10);
                data[2].should.equal(20);
            });
    });

    it('should handle empty array', function () {
        flow.map([], function (value, callback) {
            callback(null, '');
        }, function (error, data) {
            expect(error).not.to.be.ok;
            data.length.should.equal(0);
        });
    });
});
