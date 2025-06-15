import { Plugin, Editor } from 'obsidian';

async function loadScript(url: string, globalName: string): Promise<void> {
  if ((window as any)[globalName]) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load ' + url));
    document.head.appendChild(script);
  });
}

export default class ReactInPlugin extends Plugin {
  private dataview: any;

  async onload() {
    await this.ensureLibs();
    this.dataview = (this.app as any).plugins.plugins['dataview']?.api;

    this.registerMarkdownCodeBlockProcessor('react', async (source, el) => {
      try {
        await this.ensureLibs();
        const code = (window as any).Babel.transform(source, { presets: ['react'] }).code;
        const Component = new Function('React', 'ReactDOM', 'app', 'dv', code)(
          (window as any).React,
          (window as any).ReactDOM,
          this.app,
          this.dataview
        );
        (window as any).ReactDOM.createRoot(el).render(
          (window as any).React.createElement(Component)
        );
      } catch (err) {
        el.createEl('pre', { text: 'React block error:\n' + err });
      }
    });

    this.addCommand({
      id: '034',
      name: 'Insert example React block',
      editorCallback: (editor: Editor) => {
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

  async ensureLibs() {
    const libs: [string, string][] = [
      ['https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js', 'React'],
      ['https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js', 'ReactDOM'],
      ['https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js', 'Babel'],
      ['https://cdn.jsdelivr.net/npm/react-router-dom@6/umd/react-router-dom.production.min.js', 'ReactRouterDOM'],
      ['https://cdn.jsdelivr.net/npm/framer-motion@10/dist/framer-motion.umd.js', 'FramerMotion']
    ];
    for (const [url, global] of libs) {
      await loadScript(url, global);
    }
  }
}
