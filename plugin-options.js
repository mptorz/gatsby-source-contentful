"use strict";

exports.__esModule = true;
exports.createPluginConfig = exports.maskText = exports.formatPluginOptionsForCLI = exports.validateOptions = exports.defaultOptions = void 0;

const Joi = require(`@hapi/joi`);

const chalk = require(`chalk`);

const _ = require(`lodash`);

const defaultOptions = {
  host: `cdn.contentful.com`,
  environment: `master`,
  downloadLocal: false,
  localeFilter: () => true,
  forceFullSync: false
};
exports.defaultOptions = defaultOptions;

const createPluginConfig = pluginOptions => {
  const conf = Object.assign({}, defaultOptions, {}, pluginOptions);
  return {
    get: key => conf[key],
    getOriginalPluginOptions: () => pluginOptions
  };
};

exports.createPluginConfig = createPluginConfig;
const optionsSchema = Joi.object().keys({
  accessToken: Joi.string().required().empty(),
  spaceId: Joi.string().required().empty(),
  host: Joi.string().empty(),
  environment: Joi.string().empty(),
  downloadLocal: Joi.boolean(),
  localeFilter: Joi.func(),
  forceFullSync: Joi.boolean(),
  proxy: Joi.object().keys({
    host: Joi.string().required(),
    port: Joi.number().required(),
    auth: Joi.object().keys({
      username: Joi.string(),
      password: Joi.string()
    })
  }),
  // default plugins passed by gatsby
  plugins: Joi.array()
});
const maskedFields = [`accessToken`, `spaceId`];

const validateOptions = ({
  reporter
}, options) => {
  const result = optionsSchema.validate(options, {
    abortEarly: false
  });

  if (result.error) {
    const errors = {};
    result.error.details.forEach(detail => {
      errors[detail.path[0]] = detail.message;
    });
    reporter.panic(`Problems with gatsby-source-contentful plugin options:
${exports.formatPluginOptionsForCLI(options, errors)}`);
  }
};

exports.validateOptions = validateOptions;

const formatPluginOptionsForCLI = (pluginOptions, errors = {}) => {
  const optionKeys = new Set(Object.keys(pluginOptions).concat(Object.keys(defaultOptions)).concat(Object.keys(errors)));

  const getDisplayValue = key => {
    const formatValue = value => {
      if (_.isFunction(value)) {
        return `[Function]`;
      } else if (maskedFields.includes(key) && typeof value === `string`) {
        return JSON.stringify(maskText(value));
      }

      return JSON.stringify(value);
    };

    if (typeof pluginOptions[key] !== `undefined`) {
      return chalk.green(formatValue(pluginOptions[key]));
    } else if (typeof defaultOptions[key] !== `undefined`) {
      return chalk.dim(formatValue(defaultOptions[key]));
    }

    return chalk.dim(`undefined`);
  };

  const lines = [];
  optionKeys.forEach(key => {
    if (key === `plugins`) {
      // skip plugins field automatically added by gatsby
      return;
    }

    lines.push(`${key}${typeof pluginOptions[key] === `undefined` && typeof defaultOptions[key] !== `undefined` ? chalk.dim(` (default value)`) : ``}: ${getDisplayValue(key)}${typeof errors[key] !== `undefined` ? ` - ${chalk.red(errors[key])}` : ``}`);
  });
  return lines.join(`\n`);
};
/**
 * Mask majority of input to not leak any secrets
 * @param {string} input
 * @returns {string} masked text
 */


exports.formatPluginOptionsForCLI = formatPluginOptionsForCLI;

const maskText = input => {
  // show just 25% of string up to 4 characters
  const hiddenCharactersLength = input.length - Math.min(4, Math.floor(input.length * 0.25));
  return `${`*`.repeat(hiddenCharactersLength)}${input.substring(hiddenCharactersLength)}`;
};

exports.maskText = maskText;