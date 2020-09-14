const { mapFields, getMainContent } = require('./mapper');
const createFile = require('../createFile');

/**
 *
 * @param {Object} item - contentful entry
 * @param {Object} contentSettings - Object containing settings from the contentful-hugo config file
 * @param {Boolean} contentSettings.headless
 * @param {String} contentSetting.directory
 * @param {String} contentSettings.type
 * @param {String} contentSettings.mainContent
 */
const processEntry = (
    item,
    contentSettings = {
        headless: false,
        directory: null,
        type: null,
        mainContent: null,
    }
) => {
    const { directory, headless, type, mainContent } = contentSettings;
    const frontMatter = mapFields(item, directory, headless, type, mainContent);
    const content = getMainContent(item, contentSettings.mainContent);
    createFile(contentSettings, item.sys.id, frontMatter, content);
};

module.exports = processEntry;