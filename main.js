'use strict';
const { Plugin } = require('obsidian');

function loadScript(url, globalName){
  return new Promise((resolve, reject) => {
    if(window[globalName]){
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load '+url));
    document.head.appendChild(script);
  });
}

module.exports = class ReactInPlugin extends Plugin {
  async onload() {
    await this.ensureLibs();
    this.dataview = this.app.plugins.plugins['dataview']?.api;
    this.registerMarkdownCodeBlockProcessor('react', async (source, el) => {
      try {
        await this.ensureLibs();
        const code = window.Babel.transform(source, { presets: ['react'] }).code;
        const Component = new Function('React','ReactDOM','app','dv', code)(
          window.React,
          window.ReactDOM,
          this.app,
          this.dataview
        );
        window.ReactDOM.createRoot(el).render(window.React.createElement(Component));
      } catch(err) {
        el.createEl('pre', {text: 'React block error:\n' + err});
      }
    });

    this.addCommand({
      id: '034',
      name: 'Insert example React block',
      editorCallback: (editor) => {
        const snippet = [
          '```react',
          'function Example({dv}) {',
          '  return <div>Number of pages: {dv.pages().length}</div>;',
          '}',
          'Example;',
          '```',
          ''
        ].join('\n');
        editor.replaceSelection(snippet);
      }
    });
  }

  async ensureLibs(){
    const libs = [
      ['https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js','React'],
      ['https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js','ReactDOM'],
      ['https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js','Babel'],
      ['https://cdn.jsdelivr.net/npm/react-router-dom@6/umd/react-router-dom.production.min.js','ReactRouterDOM'],
      ['https://cdn.jsdelivr.net/npm/framer-motion@10/dist/framer-motion.umd.js','FramerMotion']
    ];
    for(const [url, global] of libs){
      await loadScript(url, global);
    }
    
  }
};
