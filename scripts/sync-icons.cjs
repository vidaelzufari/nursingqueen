// Select licensed Lucide icon nodes at build time; keep the full catalogue out of Metro.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(path.dirname(require.resolve('lucide-react-native')), '../..');
const names = {
  play:'play', search:'search', chevron:'chevron-left', close:'x', calendar:'calendar-days',
  analytics:'chart-no-axes-column-increasing', home:'house', history:'history', settings:'settings-2',
  heart:'heart-handshake', pump:'droplets', bottle:'milk', plus:'plus', arrow:'arrow-right', back:'arrow-left',
  baby:'baby', clock:'clock-3', check:'check', sparkles:'sparkles', moon:'moon-star', photo:'camera', stop:'square',
};
const result = {};
for (const [key, name] of Object.entries(names)) {
  let source = fs.readFileSync(path.join(root, 'dist/cjs/icons', name + '.js'), 'utf8');
  if (!source.includes('const __iconData')) {
    const alias = source.match(/require\('\.\/([a-z0-9-]+\.js)'\)/);
    if (alias) source = fs.readFileSync(path.join(root, 'dist/cjs/icons', alias[1]), 'utf8');
  }
  const data = source.match(/const __iconData = ([\s\S]*?);\nconst __iconNode/);
  if (!data) throw new Error('Unsupported Lucide data format: ' + name);
  result[key] = vm.runInNewContext('(' + data[1] + ')').node;
}
fs.mkdirSync(path.join(__dirname, '../src/assets'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../src/assets/lucide-icons.json'), JSON.stringify(result, null, 2) + '\n');
fs.mkdirSync(path.join(__dirname, '../assets/licenses'), { recursive: true });
fs.copyFileSync(path.join(root, 'LICENSE'), path.join(__dirname, '../assets/licenses/lucide.txt'));
console.log('Selected ' + Object.keys(result).length + ' Lucide icons from ' + JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version);
