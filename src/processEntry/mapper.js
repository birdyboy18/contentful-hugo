const mkdirp = require('mkdirp');
const richTextToPlain = require('@contentful/rich-text-plain-text-renderer')
    .documentToPlainTextString;
const getEntryFields = require('../getEntryFields');
const getAssetFields = require('../getAssetFields');
const richTextToMarkdown = require('../richTextToMarkdown');
const richTextNodes = require('../richTextNodes');

const mapArrayField = fieldContent => {
    if (!fieldContent.length) {
        return fieldContent;
    }
    const array = [];
    for (let i = 0; i < fieldContent.length; i++) {
        const arrayNode = fieldContent[i];
        switch (typeof arrayNode) {
            case 'object': {
                let arrayObject = {};
                switch (arrayNode.sys.type) {
                    case 'Asset':
                        arrayObject = getAssetFields(arrayNode);
                        array.push(arrayObject);
                        break;
                    case 'Entry':
                        arrayObject = getEntryFields(arrayNode);
                        array.push(arrayObject);
                        break;
                    default:
                        array.push(arrayNode);
                        break;
                }
                break;
            }
            default:
                array.push(arrayNode);
                break;
        }
    }
    return array;
};

const mapReferenceField = fieldContent => {
    switch (fieldContent.sys.type) {
        case 'Asset':
            return getAssetFields(fieldContent);
        case 'Entry':
            return getEntryFields(fieldContent);
        default:
            return fieldContent;
    }
};

/**
 *
 * @param {Object} fieldContent
 */
const mapRichTextField = fieldContent => {
    const richText = [];
    const fieldPlainText = richTextToPlain(fieldContent);
    const nodes = fieldContent.content;
    for (let i = 0; i < nodes.length; i++) {
        richText.push(richTextNodes(nodes[i]));
    }
    return {
        richText,
        plainText: fieldPlainText,
    };
};

const mapFields = (
    entry,
    dirName = null,
    isHeadless = false,
    type = null,
    mainContentField = null
) => {
    const frontMatter = {};
    if (isHeadless) {
        frontMatter.headless = true;
        mkdirp.sync(`.${dirName + entry.sys.id}`);
    }
    if (type) {
        frontMatter.type = type;
    }
    frontMatter.updated = entry.sys.updatedAt;
    frontMatter.createdAt = entry.sys.createdAt;
    frontMatter.date = entry.sys.createdAt;
    for (const field of Object.keys(entry.fields)) {
        const fieldContent = entry.fields[field];
        if (field === mainContentField) {
            // skips to prevent duplicating mainContent in frontmatter
            continue;
        } else if (field === 'date') {
            // convert dates with time to ISO String so Hugo can properly Parse
            const d = fieldContent;
            if (d.length > 10) {
                frontMatter.date = new Date(d).toISOString();
            } else {
                frontMatter.date = d;
            }
            continue;
        }
        switch (typeof fieldContent) {
            case 'object':
                if ('sys' in fieldContent) {
                    frontMatter[field] = mapReferenceField(fieldContent);
                }
                // rich text (see rich text function)
                else if ('nodeType' in fieldContent) {
                    frontMatter[field] = mapRichTextField(
                        fieldContent
                    ).richText;
                    frontMatter[`${field}_plaintext`] = mapRichTextField(
                        fieldContent
                    ).plainText;
                }
                // arrays
                else {
                    frontMatter[field] = mapArrayField(fieldContent);
                }
                break;
            default:
                frontMatter[field] = fieldContent;
                break;
        }
    }
    return frontMatter;
};

/**
 *
 * @param {Object} entry
 * @param {String} fieldName
 */
const getMainContent = (entry, fieldName = null) => {
    const mainContentField = entry.fields[fieldName];
    if (
        mainContentField &&
        mainContentField.nodeType &&
        mainContentField.nodeType === 'document'
    ) {
        return richTextToMarkdown(
            mainContentField,
            entry.sys.contentType.sys.id
        );
    }
    if (mainContentField) {
        return mainContentField;
    }
    return null;
};

module.exports = {
    mapFields,
    mapArrayField,
    mapReferenceField,
    mapRichTextField,
    getMainContent,
};