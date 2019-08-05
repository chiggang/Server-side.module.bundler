// HTML: 빌드할 html 파일이 존재하는 폴더
// HTML_DEST: 빌드한 파일이 존재하는 폴더
// SERVER: 빌드할 server.js 파일이 존재하는 폴더
// SERVER_DEST: 빌드한 server.js 파일이 존재하는 폴더
const DIR = {
  HTML: 'html',
  HTML_DEST: 'html_dest',
  SERVER: 'server',
  SERVER_DEST: 'server_dest'
};

// PATH.SRC: 빌드할 파일
// PATH.DEST: 빌드한 파일이 존재하는 폴더
module.exports = {
  PATH: {
    DIR: DIR,
    SRC: {
      HTML: `${DIR.HTML}/**/*.html`,
      CSS: `${DIR.HTML}/css/**/*.css`,
      SCSS: `${DIR.HTML}/scss/**/*.scss`,
      JS: `${DIR.HTML}/js/**/*.js`,
      SERVER: `${DIR.SERVER}/**/*.js`
    },
    DEST: {
      HTML: `${DIR.HTML_DEST}/`,
      CSS: `${DIR.HTML_DEST}/css`,
      JS: `${DIR.HTML_DEST}/js`,
      SERVER: `${DIR.SERVER_DEST}`
    }
  }
};
