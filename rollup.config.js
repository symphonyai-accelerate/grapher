import string from 'rollup-plugin-string';

export default {
  entry: 'modules/grapher.js',
  dest: 'build/grapher.js',
  format: 'umd',
  indent: '  ',
  moduleName: 'Grapher',
  plugins: [
    string({
      include: ['**/*.frag', '**/*.vert']
    })
  ]
};
