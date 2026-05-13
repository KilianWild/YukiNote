const isDev = process.env.NODE_ENV === "development";

/**
 * **Custom logger methods:**
 *
 * loggers will be turned off outside from developer mode and have their own color coding.
 *
 */
const logger = {
  /**
   * **DB logger**
   *
   * loggers will be turned off outside from developer mode and have their own color coding.
   *
   * ---
   * @param     {string}  message - message you want to be show
   * @param     {any}     data    - data you want to attach
   * @returns   {void}
   * ---
   * @example
   * ```js
   *  logger.db("The following data has been retrieved >", data);
   * ```
   */
  //-------------------------------------------------------------------------------------------------------------------
  db: (message, data) => {
    //if (!isDev) return;
    console.info(
      "%c[Database]:",
      "color: DarkTurquoise; font-weight: bold;",
      `${message}`,
      data ? data : " ",
    );
  },

  /**
   * **DB logger**
   *
   * loggers will be turned off outside from developer mode and have their own color coding.
   *
   * ---
   * @param     {string}  message - message you want to be show
   * @param     {any}     data    - data you want to attach
   * @returns   {void}
   * ---
   * @example
   * ```js
   *  logger.ai("The following data has been retrieved >", data);
   * ```
   */
  //-------------------------------------------------------------------------------------------------------------------
  ai: ({ status, message, data } = {}) => {
    //if (!isDev) return;

    console.info(
      "%c[AI]:",
      `color: DeepPink; font-weight: bold;`,
      status ? `${status} - ${message}` : message,
      data ?? " ",
    );
  },
  /**
   * **Error logger**
   *
   * loggers will be turned off outside from developer mode and have their own color coding.
   *
   * ---
   * @param     {number}  errorCode     - error code
   * @param     {string}  errorMessage  - error message
   * @returns   {void}
   * ---
   * @example
   * ```js
   *  logger.error(error.status, error.info));
   * ```
   */
  //-------------------------------------------------------------------------------------------------------------------
  error: (errorCode, errorMessage) => {
    //if (!isDev) return;
    console.error(
      `%c[Internal Error] ${errorCode}: `,
      "color: Tomato   ; font-weight: bold;",
      errorMessage,
    );
  },
};

export default logger;
