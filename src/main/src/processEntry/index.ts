import { Entry } from 'contentful';
import { mapFields, getMainContent } from './mapper';
import createFile from './src/createFile';

const processEntry = (
    item: Entry<unknown>,
    contentSettings: import('@main/index').ContentSettings
): void => {
    const {
        directory,
        isHeadless,
        type,
        mainContent,
        resolveEntries,
    } = contentSettings;
    const frontMatter = mapFields(
        item,
        directory,
        isHeadless,
        type,
        mainContent,
        resolveEntries
    );
    const content = contentSettings.mainContent
        ? getMainContent(item, contentSettings.mainContent)
        : '';
    createFile(contentSettings, item.sys.id, frontMatter, content);
};

export default processEntry;