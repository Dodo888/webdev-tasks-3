const flow = require('../lib/flow');
const assert = require('assert');
const mocha = require('mocha');
const chai = require('chai')
    , expect = chai.expect
    , should = chai.should();


describe('flow.serial', function () {
    it('should run functions in right order', function () {
        flow.serial([function (callback) {
                callback(null, 2);
            }, function (data, callback) {
                callback(null, data+5)
            }, function (data, callback) {
                callback(null, data*2)
            }],
            function (error, data) {
                expect(error).not.to.be.ok;
                data.should.equal(14);
            });
    });

    it('should return error if one function ends with error', function () {
        flow.serial([function (callback) {
            callback(true, '');
        }, function (data, callback) {
            callback(null, '')
        }],
        function (error, data) {
            error.should.be.ok;
        });
    });

    it('should not run second function if first failed', function () {
        flow.serial([function (callback) {
                callback(true, 10);
            }, function (data, callback) {
                callback(null, 12)
            }],
            function (error, data) {
                error.should.be.ok;
                data.should.equal(10);
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
        flow.parallel([function (callback) {
            callback(null, 1);
        }, function (callback) {
            setTimeout(function () {callback(null, 2);}, 500)
        }], function (error, data) {
            data.should.be.a('array');
            data.length.should.equal(2);
            data[1].should.equal(2);
        });
    });

    it('should write results in right order', function () {
        flow.parallel([function (callback) {
            setTimeout(function () {callback(null, 1);}, 500)
        }, function (callback) {
            callback(null, 2);
        }], function (error, data) {
            data.should.be.a('array');
            data[0].should.equal(1);
            data[1].should.equal(2);
        });
    });

    it('should return error if one function fails', function () {
        flow.parallel([function (callback) {
                callback(true, '');
            }, function (callback) {
                callback(null, '')
            }],
            function (error, data) {
                error.should.be.ok;
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
        flow.map([10, 20, 30], function (value, callback) {
            callback(null, value*2);
        }, function (error, data) {
            expect(error).not.to.be.ok;
            data.length.should.equal(3);
        });
    });

    it('should write results in right order', function () {
        flow.map([10, 20, 30], function (value, callback) {
            callback(null, value*2);
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

    it('should handle empty array', function () {
        flow.map([], function (value, callback) {
            callback(null, '');
        }, function (error, data) {
            expect(error).not.to.be.ok;
            data.length.should.equal(0);
        });
    });
});