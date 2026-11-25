import {
  test,
  expect,
  closeElectronApp,
  type Locator
} from '../../../playwright';
import path from 'path';
import { buildCollectionTreeLocators, buildCommonLocators, expandFolder } from '../../../pages';
import {
  waitForReadyPage,
  initBruCollection,
  writeBruRequest,
  writeBruFolder
} from '../../../utils';

const COLLECTION_NAME = 'AlignmentCol';

const leftEdge = async (loc: Locator) => {
  const box = await loc.boundingBox();
  if (!box) throw new Error('element has no bounding box (not visible)');
  return box.x;
};

const buildCollectionOnDisk = (dir: string) => {
  initBruCollection(dir, COLLECTION_NAME);
  const folderDir = writeBruFolder(dir, 'parent-folder', 1);
  writeBruRequest(folderDir, 'with-example', { seq: 1, examples: ['ex-one'] });
  writeBruRequest(folderDir, 'without-example', { seq: 2 });
  writeBruFolder(folderDir, 'sub-folder', 3);
};

test.describe('Sidebar item alignment', () => {
  test('rows at the same level line up whether or not they have a chevron', async ({ launchElectronApp, createTmpDir }) => {
    const collectionDir = path.join(await createTmpDir('item-alignment'), COLLECTION_NAME);
    buildCollectionOnDisk(collectionDir);

    const app = await launchElectronApp({
      initUserDataPath: path.join(__dirname, 'init-user-data'),
      templateVars: { collectionPath: collectionDir.split(path.sep).join('/') }
    });
    const page = await waitForReadyPage(app);
    const { sidebar } = buildCommonLocators(page);
    const { request } = buildCollectionTreeLocators(page);
    const withExampleName = sidebar.itemByName('with-example');
    const withoutExampleName = sidebar.itemByName('without-example');
    const subFolderName = sidebar.itemByName('sub-folder');
    const withExampleMethod = request.methodBadge('with-example', COLLECTION_NAME);
    const withoutExampleMethod = request.methodBadge('without-example', COLLECTION_NAME);

    try {
      await test.step('Open the collection and the folder', async () => {
        await sidebar.collectionChevron(COLLECTION_NAME).click();
        await expandFolder(page, 'parent-folder');
        await expect(withoutExampleName).toBeVisible();
        await expect(subFolderName).toBeVisible();
      });

      await test.step('A request without examples lines up with a sibling request that has examples', async () => {
        expect(await leftEdge(withoutExampleName)).toBe(await leftEdge(withExampleName));
      });

      await test.step('Requests line up with a sibling folder', async () => {
        const folderNameEdge = await leftEdge(subFolderName);
        expect(await leftEdge(withExampleMethod)).toBe(folderNameEdge);
        expect(await leftEdge(withoutExampleMethod)).toBe(folderNameEdge);
      });
    } finally {
      await closeElectronApp(app);
    }
  });
});
