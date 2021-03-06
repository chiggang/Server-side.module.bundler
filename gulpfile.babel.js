/**
 *
 * Server-side module bundler
 * with gulp.js, webpack
 *
 * by chiggang.201907
 *
 */

/*
 * 빌드 방법
 *
 * 1. 이 프로젝트(Server-side module bundler)를 복사한 후, 빌드할 프로젝트가 있는 폴더로 붙여넣음(해당 프로젝트의 전용 번들러로 사용하기 위함)
 * 2. 터미널에서 이 파일(gulpfile.babel.js)이 존재하는 폴더로 이동함
 * 3. 빌드할 node.js 파일 및 폴더를 원본 경로에서 복사한 후, /server 폴더에 붙여넣음(단, node_modules 폴더는 제외함)
 * 4. 빌드할 node.js 파일에 관련된 dependencies node module 목록을 여기 package.json에 추가함
 * 5. yarn 커맨드를 입력하여 dependencies node module을 추가함
 * 6. gulp 커맨드를 입력하여 빌드함(gulp css:css 커맨드와 같이 gulp.task 이름을 사용하여 개별적으로 빌드도 가능함)
 * 7. /server_dest/server.js 파일이 생성되었는지 확인함
 * 8. 빌드하기 전의 원본 소스가 있던 전체 폴더를 복사하여 새로운 경로(이하 제품 폴더)에 붙여넣음(이 폴더가 실제 제품용으로 사용됨)
 * 9. 제품 폴더에서 *.js 파일을 모두 삭제함(단, node_modules 폴더는 제외함)
 * 10. /server_dest/server.js 파일을 복사하여 제품 폴더에 붙여넣음
 * 11. 제품 폴더에서 node server 커맨드를 입력하여 정상적인 실행인지 확인함
 */

import gulp from 'gulp';
import { PATH } from './path.config';
import del from 'del';
import fs from 'fs';
import fileCache from 'gulp-file-cache';
import sass from 'gulp-sass';
import cleanCSS from 'gulp-clean-css';
import webpack from 'webpack';
import webpackStream from 'webpack-stream';
import webpackConfig from './webpack.config';

// 원본 소스에 변경된 내용이 없을 경우, 빌드 파일을 생성하지 않음
const cache = new fileCache();

// 빌드한 파일이 존재하는 폴더를 삭제함
const clean = () => {
  console.log('Step: delete destination folder');

  return new Promise(resolve => {
    del.sync(PATH.DIR.HTML_DEST);
    del.sync(PATH.DIR.SERVER_DEST);

    resolve();
  });
};

// sass 파일을 빌드함
gulp.task('css:sass', () => {
  console.log('Step: build sass');

  return new Promise(resolve => {
    gulp
      .src(PATH.SRC.SCSS)
      .pipe(cache.filter())
      .pipe(sass())
      .pipe(cache.cache())
      .pipe(gulp.dest(PATH.DEST.CSS));

    resolve();
  });
});

// css 파일을 빌드함
gulp.task('css:css', () => {
  console.log('Step: build css');

  return new Promise(resolve => {
    gulp
      .src(PATH.SRC.CSS)
      .pipe(cache.filter())
      .pipe(
        cleanCSS({
          compatibility: 'ie8'
        })
      )
      .pipe(cache.cache())
      .pipe(gulp.dest(PATH.DEST.CSS));

    resolve();
  });
});

// function webpackFunc ( evt ) {
//   // 파일 경로와 파일 이름을 변수로 지정하였습니다.
//   let path = evt.path ;
//   // 경로중 파일이름만을 문자열로 잘라내어 변수에 담았습니다.
//   let jsName = path.substr( path.lastIndexOf( '\\' ) + 1 , path.length ) ;
//   // 임포트 했던 weback을 세팅합니다.
//   webpack({
//     entry : {
//       entryName : `${ __dirname }/html/js/${ jsName }` // 파일 경로를 설정합니다.
//     } ,
//     output : {
//       filename : jsName // 만들어질 파일명을 설정합니다.
//     } ,
//     module : { // 모둘 세팅
//       // 이곳에서 사용되는 모듈 과 플러그인들은 이전 포스팅에서모두 설치한 모듈들입니다.
//       // 이모듈들은 ES 6 ~ 7 그리고 그 이상의 기술들을 사용하였을때 바벨이 오류를 뱉어내어 컴파일에
//       // 실패하지 않기 위해 필요한 모듈들 모음입니다.
//       loaders : [
//         {
//           test : /\.js$/ ,
//           loader : 'babel-loader' , // 바벨로더를 사용합니다.
//           exclude : '/node_modules/' ,
//           query : {
//             cacheDirectory : true ,
//             "presets" : ['es2015', 'es2017', 'stage-3', 'react'], // 사용할 프리셋들
//             // 프리셋 관련 정보는 https://babeljs.io/docs/en 에서 확인하실 수 있습니다.
//             "plugins" : [
//               'transform-decorators-legacy',
//               'transform-class-properties' ,
//               'transform-async-to-generator' ,
//               'transform-object-assign' ,
//               'transform-regenerator' ,
//               ["transform-runtime", {
//                 "helpers": false, // defaults to true
//                 "polyfill": false, // defaults to true
//                 "regenerator": true, // defaults to true
//                 "moduleName": "babel-runtime" // defaults to "babel-runtime"
//               }]
//             ],
//           }
//         }
//       ]
//     }
//   }).pipe( gulp.dest( PATH.DEST.JS ) ) ; // 컴파일이 끝난 파일을 지정된 폴더에 생성합니다.
//   // PATH.DEST.JS 경로는 html_build/js 로 지정되어있습니다.
// }

// let js = () => {
//   console.log('js');

//   return new Promise(resolve => {
//     fs.readdir(`${PATH.DIR.HTML}/js/`, (error, files) => {
//       console.log('error:', error);
//       console.log('files:', files);

//       files.forEach(file => {
//         console.log('> file:', file);

//         let evt = {
//           path: `${__dirname}/${PATH.DIR.SRC}/js/${file}`
//         };

//         // webpackFunc(evt);

//         // gulp.src(PATH.SRC.JS)
//         // .pipe(webpackStream(webpack2Config), webpack)
//         // .pipe(gulp.dest(PATH.DEST.JS));

//       });
//     });

//     // gulp.src(`${__dirname}/html/js/index.js`)
//     //   .pipe(webpackStream(webpackConfig), webpack)
//     //   .pipe(gulp.dest(`${PATH.DEST.JS}`));

//     // gulp.src(`${__dirname}/html/js/src/server.js`)
//     //   .pipe(webpackStream(webpackConfig), webpack)
//     //   .pipe(gulp.dest(`${PATH.DEST.JS}`));

//     resolve();
//   });
// };

// server 파일을 빌드함
gulp.task('js:js', () => {
  console.log('Step: build js');

  return new Promise(resolve => {
    fs.readdir(`${PATH.DIR.HTML}/js/`, (error, files) => {
      console.log('error:', error);
      console.log('files:', files);

      files.forEach(file => {
        console.log('> file:', file);

        let evt = {
          path: `${__dirname}/${PATH.DIR.SRC}/js/${file}`
        };

        gulp
          .src(`${__dirname}/${PATH.DIR.HTML}/js/${file}`)
          .pipe(webpackStream())
          .pipe(gulp.dest(PATH.DEST.JS));
      });
    });

    // gulp.src(PATH.SRC.JS)
    // .pipe(webpackStream(webpack2Config), webpack)
    // .pipe(gulp.dest(PATH.DEST.JS));

    resolve();
  });
});

// server 파일을 빌드함
gulp.task('js:server', () => {
  console.log('Step: build server.js');

  return new Promise(resolve => {
    gulp
      .src(PATH.SRC.SERVER)
      .pipe(cache.filter())
      .pipe(
        webpackStream(webpackConfig),
        webpack
      )
      .pipe(cache.cache())
      .pipe(gulp.dest(PATH.DEST.SERVER));

    resolve();
  });

  // return new Promise(resolve => {
  //   gulp
  //     .src(PATH.SRC.SERVER)
  //     .pipe(
  //       webpackStream(webpackConfig),
  //       webpack
  //     )
  //     .pipe(gulp.dest(PATH.DEST.SERVER));

  //   resolve();
  // });
});

// 작업 순서를 정의함
const css = gulp.series('css:sass', 'css:css');
const js = gulp.series('js:js');
const server = gulp.series('js:server');

// 빌드를 시작함
// gulp.task('default', gulp.series(clean, css, js, server));
gulp.task('default', gulp.series(clean, css, server));
