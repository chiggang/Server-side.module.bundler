import fs from 'fs';

// 빌드에 포함될 node_modules 항목을 정의함
let nodeModules = {};
fs.readdirSync('node_modules')
  .filter(x => {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(mod => {
    nodeModules[mod] = 'commonjs ' + mod;
  });

// entry: 빌드할 소스들을 대표하는 기본 파일명(node.js로 실행할 js파일명을 의미함)
// mode: development(개발용), production(제품용)
// output: 빌드하여 생성될 파일명
module.exports = {
  mode: 'production',
  entry: `${__dirname}/server/server.js`,
  output: {
    path: __dirname,
    filename: 'server.js',
  },
  target: 'node',
  node: {
    fs: 'empty',
    __dirname: false
  },
  externals: nodeModules,
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        query: {
          cacheDirectory: true,
          presets: ['@babel/preset-env', 'es2015', 'es2017', 'stage-3', 'react'],
          plugins: [
            'transform-class-properties',
            'transform-async-to-generator',
            'transform-object-assign',
            'transform-regenerator',
            [
              'transform-runtime',
              {
                'helpers': false,
                'polyfill': false,
                'regenerator': true,
                'moduleName': 'babel-runtime'
              }
            ]
          ]
        }
      },
    ],
  },
};
