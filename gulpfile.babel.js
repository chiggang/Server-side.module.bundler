/**
 * 
 * Server-side module bundler
 * with gulp.js, webpack
 * 
 * by chiggang.2019
 * 
 */

/*
 * 빌드 방법
 *
 * 1. 터미널에서 이 파일이 존재하는 폴더로 이동함
 * 2. 빌드할 node.js 파일 및 폴더를 복사한 후, /server 폴더에 옮겨놓음(단, node_modules 폴더는 제외함)
 * 3. 빌드할 node.js에 관련된 dependencies 목록을 package.json에 추가함
 * 4. yarn 커맨드를 입력하여 dependencies node module들을 추가함
 * 5. gulp 커맨드를 입력하여 빌드함(gulp css:css 커맨드와 같이 gulp.task 이름을 사용하여 개별적으로 빌드도 가능함)
 * 6. /app/server.js 파일이 생성되었는지 확인함
 * 7. 빌드하기 전의 소스 원본이 있던 폴더와 동일한 폴더를 복사하여 생성함(이 폴더가 실제 제품용으로 사용됨)
 * 8. 복사한 폴더에서 *.js 파일을 모두 삭제함(단, node_modules 폴더는 제외함)
 * 9. 복사한 폴더에 /app/server.js 파일을 옮겨놓음
 * 10. node server 커맨드를 입력하여 정상적인 실행인지 확인함
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

const cache = new fileCache();

// sass 파일을 빌드함
gulp.task('css:sass', () => {
  console.log('sass');

  return new Promise(resolve => {
    gulp.src(PATH.SRC.SCSS)
      .pipe(cache.filter())
      .pipe(sass())
      .pipe(cache.cache())
      .pipe(gulp.dest(PATH.DEST.CSS));

    resolve();
  });
});

// css 파일을 빌드함
gulp.task('css:css', () => {
  console.log('css');

  return new Promise(resolve => {
    gulp.src(PATH.SRC.CSS)
      .pipe(cache.filter())
      .pipe(cleanCSS({
        compatibility: 'ie8'
      }))
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
  console.log('js');

  return new Promise(resolve => {
    fs.readdir(`${PATH.DIR.HTML}/js/`, (error, files) => {
      console.log('error:', error);
      console.log('files:', files);

      files.forEach(file => {
        console.log('> file:', file);
    
        let evt = {
          path: `${__dirname}/${PATH.DIR.SRC}/js/${file}`
        };
    
        // webpackFunc(evt);

        gulp.src(`${__dirname}/${PATH.DIR.HTML}/js/${file}`)
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
  console.log('server');

  return new Promise(resolve => {
    gulp.src(PATH.SRC.SERVER)
      .pipe(webpackStream(webpackConfig), webpack)
      .pipe(gulp.dest(PATH.DEST.SERVER));

    resolve();
  });
});

// 작업 순서를 정의함
const css = gulp.series('css:sass', 'css:css');
const server = gulp.series('js:server');
const js2 = gulp.series('js:js');

// 빌드한 파일이 존재하는 폴더를 삭제함
let clean = () => {
  console.log('Delete');

  return new Promise(resolve => {
    del.sync(PATH.DIR.HTML_DEST);
    del.sync(PATH.DIR.SERVER_DEST);

    resolve();
  });
};

// 빌드를 시작함
//gulp.task('default', gulp.series(clean, css, server));
gulp.task('default', gulp.series(clean, css, server));



// js 개별 빌드를 처리해야 함!!!!
