import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('winston', () => {
  const format = {
    combine: jest.fn(),
    timestamp: jest.fn(),
    colorize: jest.fn(),
    printf: jest.fn(),
  };

  const transports = {
    Console: jest.fn(),
    File: jest.fn(),
  };

  const createLogger = jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  });

  return {
    format,
    transports,
    createLogger,
    addColors: jest.fn(),
  };
});

import { loggerService } from '../../src/utils/logger';
import * as winston from 'winston';

describe('Logger Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(loggerService).toBeDefined();
  });

  it('should log info messages', () => {
    const infoSpy = jest.spyOn(loggerService, 'info');
    loggerService.info('Test info message');
    expect(infoSpy).toHaveBeenCalledWith('Test info message');
  });

  it('should log warn messages', () => {
    const warnSpy = jest.spyOn(loggerService, 'warn');
    loggerService.warn('Test warn message');
    expect(warnSpy).toHaveBeenCalledWith('Test warn message');
  });

  it('should log error messages', () => {
    const errorSpy = jest.spyOn(loggerService, 'error');
    loggerService.error('Test error message');
    expect(errorSpy).toHaveBeenCalledWith('Test error message');
  });

  it('should log debug messages', () => {
    const debugSpy = jest.spyOn(loggerService, 'debug');
    loggerService.debug('Test debug message');
    expect(debugSpy).toHaveBeenCalledWith('Test debug message');
  });
});
