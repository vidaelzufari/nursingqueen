import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import en from '@/i18n/locales/en.json';
import fr from '@/i18n/locales/fr.json';
import ar from '@/i18n/locales/ar.json';
function get(dictionary: object, key: string): unknown { return key.split('.').reduce<unknown>((value, segment) => value && typeof value === 'object' ? (value as Record<string, unknown>)[segment] : undefined, dictionary); }
function files(root: string): string[] { return fs.readdirSync(root, {withFileTypes:true}).flatMap(item => item.isDirectory() ? files(path.join(root,item.name)) : /\.tsx?$/.test(item.name) ? [path.join(root,item.name)] : []); }
it.each([['en',en],['fr',fr],['ar',ar]] as const)('resolves every literal screen translation key in %s', (_, dictionary) => {
  const missing: string[] = [];
  for(const file of [...files('app'), ...files('src')]) {
    const tree = ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
    function visit(node: ts.Node) {
      if(ts.isCallExpression(node) && ['t','i18n.t'].includes(node.expression.getText(tree)) && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
        const key=node.arguments[0].text;
        if(!get(dictionary,key) && !get(dictionary,key+'_one') && !get(dictionary,key+'_other')) missing.push(`${file}: ${key}`);
      }
      ts.forEachChild(node,visit);
    }
    visit(tree);
  }
  expect(missing).toEqual([]);
});
