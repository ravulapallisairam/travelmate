// backend/utils/logger.js
// Minimal logger used by controllers. Never log secrets (API keys, passwords, tokens).

const format = (level, args) => [`[${new Date().toISOString()}] [${level}]`, ...args];

const logger = {
  info: (...args) => console.log(...format("INFO", args)),
  warn: (...args) => console.warn(...format("WARN", args)),
  error: (...args) => console.error(...format("ERROR", args)),
  debug: (...args) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(...format("DEBUG", args));
    }
  },
};

export default logger;
export { logger };