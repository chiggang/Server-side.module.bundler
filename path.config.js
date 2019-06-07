// SRC: 빌드할 html, css, js 파일이 존재하는 폴더
// DEST: 빌드한 파일이 존재하는 폴더
// SRC: 빌드할 html, css, js 파일이 존재하는 폴더
// DEST: 빌드한 파일이 존재하는 폴더
const DIR = {
  HTML: 'html',
  HTML_DEST: 'html_dest',
  SERVER: 'server',
  SERVER_DEST: 'server_dest',
};

// PATH.SRC: 빌드할 파일
// PATH.DEST: 빌드한 파일
module.exports = {
  PATH: {
    DIR: DIR,
    SRC: {
      HTML: `${DIR.HTML}/**/*.html`,
      CSS: `${DIR.HTML}/css/*.css`,
      SCSS: `${DIR.HTML}/scss/**/*.scss`,
      JS: `${DIR.HTML}/js/**/*.js`,
      SERVER: `${DIR.SERVER}/**/*.js`,
    },
    DEST: {
      HTML: `${DIR.HTML_DEST}/`,
      CSS: `${DIR.HTML_DEST}/css`,
      JS: `${DIR.HTML_DEST}/js`,
      SERVER: `${DIR.SERVER_DEST}`,
    },
  },
};
