const logger = {
  info: (message, meta = {}) => {
    // eslint-disable-next-line no-console
    console.log(message, meta);
  },
  warn: (message, meta = {}) => {
    // eslint-disable-next-line no-console
    console.warn(message, meta);
  },
  error: (message, meta = {}) => {
    // eslint-disable-next-line no-console
    console.error(message, meta);
  }
};

export default logger;
