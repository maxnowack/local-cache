"use strict";
/* eslint-disable max-classes-per-file */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReserveCacheError = exports.ValidationError = void 0;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
class ReserveCacheError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ReserveCacheError';
        Object.setPrototypeOf(this, ReserveCacheError.prototype);
    }
}
exports.ReserveCacheError = ReserveCacheError;
