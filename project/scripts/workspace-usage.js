document.addEventListener('DOMContentLoaded', function() {
  require(['vs/editor/editor.main'], function () {
    const usageContainer = document.getElementById('usage-monaco');
    if (usageContainer) {
      monaco.editor.create(usageContainer, {
        value: [
          '<!DOCTYPE html>',
          '<html lang="en">',
          '<head>',
          '  <script src="hydrate-v5.js" data-file="data/your-dehydrated.json" defer></script>',
          '</head>',
          '<body>',
          '',
          '  <header class="site-header">',
          '    <nav>loading navigation...</nav>',
          '  </header>',
          '',
          '  <main>',
          '    <p>Loading contents...</p>',
          '  </main>',
          '  ',
          '</body>',
          '</html>'
        ].join('\n'),
        language: 'html',
        theme: 'vs-dark',
        tabSize: 2,
        readOnly: true,
        automaticLayout: true,
        minimap: { enabled: false },
        copyPaste: true
      });
    }
  });
});