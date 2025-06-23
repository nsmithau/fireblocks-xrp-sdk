import { Logger, LogLevel } from "../../src/utils/logger";

describe("Logger", () => {
  let logger: Logger;
  const context = "TestContext";

  beforeEach(() => {
    logger = new Logger(context);
    jest.clearAllMocks();
  });

  describe("LogLevel configuration", () => {
    it("sets and gets log level", () => {
      Logger.setLogLevel(LogLevel.DEBUG);
      expect(Logger.getLogLevel()).toBe(LogLevel.DEBUG);
    });

    it("sets log prefix", () => {
      Logger.setLogPrefix("[NEW PREFIX]");
      expect((logger as any).constructor["logPrefix"]).toBe("[NEW PREFIX]");
    });
  });

  describe("Logging methods", () => {
    beforeEach(() => {
      jest.spyOn(console, "log").mockImplementation(() => {});
      jest.spyOn(console, "warn").mockImplementation(() => {});
      jest.spyOn(console, "error").mockImplementation(() => {});
    });

    it("logs debug message at DEBUG level", () => {
      Logger.setLogLevel(LogLevel.DEBUG);
      logger.debug("Debug message");
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[DEBUG] [TestContext] Debug message")
      );
    });

    it("does not log debug at INFO level", () => {
      Logger.setLogLevel(LogLevel.INFO);
      logger.debug("Should not log");
      expect(console.log).not.toHaveBeenCalled();
    });

    it("logs info message at INFO level", () => {
      Logger.setLogLevel(LogLevel.INFO);
      logger.info("Info message");
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[INFO] [TestContext] Info message")
      );
    });

    it("logs warning at WARN level", () => {
      Logger.setLogLevel(LogLevel.WARN);
      logger.warn("Warning!");
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("[WARN] [TestContext] Warning!")
      );
    });

    it("logs error at ERROR level", () => {
      Logger.setLogLevel(LogLevel.ERROR);
      logger.error("Oops");
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR] [TestContext] Oops")
      );
    });

    it("does not log anything when level is NONE", () => {
      Logger.setLogLevel(LogLevel.NONE);
      logger.info("info");
      logger.warn("warn");
      logger.error("error");
      logger.debug("debug");
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe("createChild", () => {
    it("creates child logger with subcontext", () => {
      const child = logger.createChild("Sub");
      Logger.setLogLevel(LogLevel.INFO);
      jest.spyOn(console, "log").mockImplementation(() => {});
      child.info("child log");
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[INFO] [TestContext:Sub] child log")
      );
    });
  });
});
