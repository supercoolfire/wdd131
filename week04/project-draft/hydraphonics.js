/**
 * Hydra Site Editor v2.0.0
 * Architecture: Delta-Isolation Matrix with Strict JSON Context-Aware Auto-Completion
 * Enhancements: Validates array structural boundaries; provides only ',' or clean '{}' without pre-filled assumptions.
 * Features:
 * 1. Real time bidirectional JSON to HTML conversion
 * 2. Context-aware auto-completion
 * 3. Strict JSON schema validation
 */

require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });

require(['vs/editor/editor.main'], function () {
  const staticContainer = document.getElementById('static-monaco');
  const jsonContainer = document.getElementById('json-monaco');
  const htmlContainer = document.getElementById('html-monaco');

  let isUpdating = false;

  // --- EMMET REGISTRATION ---
  function initEmmetSafe() {
    if (typeof emmetMonaco !== 'undefined') {
      try {
        emmetMonaco.emmetHTML(monaco);
        console.log('[Hydra] Emmet registered on HTML workspaces.');
      } catch (e) {
        console.warn('[Hydra] Emmet registration warning:', e);
      }
    }
  }
  initEmmetSafe();

  // --- HYDRATE-V5 SCHEMA DEFINITION (FIXED RECURSION) ---
  const nodeSchema = {
    type: 'object',
    properties: {
      tag: { type: 'string' },
      querySelector: { type: 'string' },
      insertion: { enum: ['after', 'before', 'append', 'prepend', 'replace'] },
      id: { type: 'string' },
      class: { type: 'string' },
      textContent: { type: 'string' },
      innerHTML: { type: 'string' },
      items: { type: 'array', items: { $ref: '#/definitions/node' } }
    },
    additionalProperties: true
  };

  const hydrateSchema = {
    type: 'object',
    patternProperties: {
      ".*": { $ref: '#/definitions/node' }
    },
    definitions: {
      node: nodeSchema
    }
  };

  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    schemas: [{
      uri: "https://machine-empire.corp/hydra-v5.schema.json",
      fileMatch: ['*'],
      schema: hydrateSchema
    }]
  });

  // --- CONTEXT-AWARE INSTANT AUTOCOMPLETE PROVIDER ---
  monaco.languages.registerCompletionItemProvider('json', {
    triggerCharacters: ['{', '[', ',', ' ', '\n', '\t'],
    
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = { 
        startLineNumber: position.lineNumber, 
        endLineNumber: position.lineNumber, 
        startColumn: word.startColumn, 
        endColumn: word.endColumn 
      };

      // CONTEXT TOKENIZER: Analyze preceding text history up to cursor layout boundaries
      const textUntilCursor = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });

      const lastOpenBracket = textUntilCursor.lastIndexOf('[');
      const lastCloseBracket = textUntilCursor.lastIndexOf(']');
      const lastOpenBrace = textUntilCursor.lastIndexOf('{');
      const lastCloseBrace = textUntilCursor.lastIndexOf('}');

      let isInsideItemsArray = false;
      
      if (lastOpenBracket > lastCloseBracket) {
        const subSegment = textUntilCursor.substring(0, lastOpenBracket);
        if (/["']items["']\s*:\s*$/i.test(subSegment.trim()) || subSegment.toLowerCase().includes('"items"')) {
          isInsideItemsArray = true;
        }
      }

      // Explicitly checking if we're nested deep inside an object context inside that array
      let isInsideChildObject = false;
      if (isInsideItemsArray && (lastOpenBrace > lastCloseBrace) && (lastOpenBrace > lastOpenBracket)) {
        isInsideChildObject = true;
      }

      let suggestions = [];

      if (isInsideChildObject) {
        // CHILD OBJECT SCOPE: Suggest structural properties valid inside a sub-node
        suggestions = [
          { label: 'tag', kind: monaco.languages.CompletionItemKind.Property, insertText: '"tag": "${1:div}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range: range },
          { label: 'id', kind: monaco.languages.CompletionItemKind.Property, insertText: '"id": "${1:sub-id}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range: range },
          { label: 'class', kind: monaco.languages.CompletionItemKind.Property, insertText: '"class": "${1:sub-class}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range: range },
          { label: 'textContent', kind: monaco.languages.CompletionItemKind.Property, insertText: '"textContent": "${1:text}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range: range },
          { label: 'innerHTML', kind: monaco.languages.CompletionItemKind.Property, insertText: '"innerHTML": "${1:markup}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range: range },
          { label: 'items', kind: monaco.languages.CompletionItemKind.Property, insertText: '"items": [\n  $0\n]', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range: range }
        ];
      } else if (isInsideItemsArray && !isInsideChildObject) {
        // ARRAY STRUCTURAL BOUNDARY: Only recommend exact syntax elements (, or clean {})
        suggestions = [
          { 
            label: '{}', 
            kind: monaco.languages.CompletionItemKind.Value, 
            insertText: '{\n  $0\n}', 
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, 
            documentation: 'Insert clean empty array child object wrapper.',
            range: range 
          },
          { 
            label: ',', 
            kind: monaco.languages.CompletionItemKind.Value, 
            insertText: ',', 
            documentation: 'JSON sibling token array delimiter separator.',
            range: range 
          }
        ];
      } else {
        // ROOT CONFIGURATION SCOPE: Global structural properties
        suggestions = [
          { label: 'tag', kind: monaco.languages.CompletionItemKind.Property, insertText: '"tag": "${1:div}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range: range },
          { label: 'querySelector', kind: monaco.languages.CompletionItemKind.Property, insertText: '"querySelector": "${1:body}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range: range },
          { label: 'insertion', kind: monaco.languages.CompletionItemKind.Property, insertText: '"insertion": "${1|append,prepend,replace,before,after|}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range: range },
          { label: 'id', kind: monaco.languages.CompletionItemKind.Property, insertText: '"id": "${1:my-id}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range: range },
          { label: 'class', kind: monaco.languages.CompletionItemKind.Property, insertText: '"class": "${1:my-class}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range: range },
          { label: 'textContent', kind: monaco.languages.CompletionItemKind.Property, insertText: '"textContent": "${1:text}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range: range },
          { label: 'items', kind: monaco.languages.CompletionItemKind.Property, insertText: '"items": [\n  $0\n]', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range: range }
        ];
      }
      
      return { suggestions: suggestions };
    }
  });

  // --- WORKSPACE MONACO INSTANCES ---
  const staticEditor = monaco.editor.create(staticContainer, {
    value: [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <script src="hydrate-v5.js" data-file="data/your-dehydrated.json" defer></script>',
      '</head>',
      '<body>',
      '',
      '  <header>',
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
    automaticLayout: true,
    minimap: { enabled: false }
  });

  const jsonEditor = monaco.editor.create(jsonContainer, {
    value: '',
    language: 'json',
    theme: 'vs-dark',
    tabSize: 2,
    automaticLayout: true,
    minimap: { enabled: false },
    quickSuggestions: { other: true, comments: false, strings: true },
    suggestOnTriggerCharacters: true,
    wordBasedSuggestions: "allDocuments"
  });

  const htmlEditor = monaco.editor.create(htmlContainer, {
    value: '',
    language: 'html',
    theme: 'vs-dark',
    tabSize: 2,
    automaticLayout: true,
    minimap: { enabled: false }
  });

  // --- UTILITY ENGINE FUNCTIONS ---
  function renderNode(nodeData) {
    if (!nodeData.tag && nodeData.textContent) {
      return document.createTextNode(nodeData.textContent);
    }
    const el = document.createElement(nodeData.tag || 'div');
    if (nodeData.id) el.id = nodeData.id;
    if (nodeData.class) el.className = nodeData.class;
    if (nodeData.textContent) el.textContent = nodeData.textContent;
    if (nodeData.innerHTML) el.innerHTML = nodeData.innerHTML;
    
    if (nodeData.items && Array.isArray(nodeData.items)) {
      nodeData.items.forEach(child => el.appendChild(renderNode(child)));
    }
    
    Object.entries(nodeData).forEach(([key, val]) => {
      if (!['tag', 'querySelector', 'querSelector', 'insertion', 'id', 'class', 'textContent', 'innerHTML', 'items'].includes(key)) {
        if (typeof val === 'string' || typeof val === 'number') {
          el.setAttribute(key, val);
        } else if (Array.isArray(val)) {
          // Sync capability with hydrate-v5's structural array handling
          el.setAttribute(key, val.join(', '));
        }
      }
    });
    return el;
  }

  function elementToRawObject(el) {
    if (el.nodeType === Node.TEXT_NODE) {
      return el.textContent.trim() ? { textContent: el.textContent.trim() } : null;
    }
    if (el.nodeType !== Node.ELEMENT_NODE) return null;

    const obj = { tag: el.tagName.toLowerCase() };
    if (el.id) obj.id = el.id;
    if (el.className) obj.class = el.className;
    
    if (el.children.length === 0 && el.textContent.trim()) {
      obj.textContent = el.textContent.trim();
    } else if (el.childNodes.length > 0) {
      const items = [];
      el.childNodes.forEach(child => {
        const childObj = elementToRawObject(child);
        if (childObj) items.push(childObj);
      });
      if (items.length > 0) obj.items = items;
    }
    return obj;
  }

  function formatHTMLDoc(rootNode, forceTagName = null) {
    const indent = "  ";
    function process(node, level = 0) {
      const space = indent.repeat(level);
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        return text ? space + text + "\n" : "";
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return "";
      
      const tag = (level === 0 && forceTagName) ? forceTagName : node.tagName.toLowerCase();
      let attrs = "";
      Array.from(node.attributes).forEach(a => {
        if (level === 0 && forceTagName && a.name === 'id') return;
        attrs += ` ${a.name}="${a.value}"`;
      });

      if (node.childNodes.length === 0) {
        return `${space}<${tag}${attrs}></${tag}>\n`;
      }
      if (node.children.length === 0 && node.textContent.trim()) {
        return `${space}<${tag}${attrs}>${node.textContent.trim()}</${tag}>\n`;
      }

      let childrenStr = "";
      Array.from(node.childNodes).forEach(c => childrenStr += process(c, level + 1));

      // --- STRUCTURAL TAG ONE-LINE POLICY CUSTOMIZATION ---
      const isParagraph = tag === 'p';
      const isShort = node.outerHTML.length <= 85;
      const structuralTags = ['html', 'head', 'body', 'header', 'main', 'footer', 'nav', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'ul', 'ol', 'dl', 'details'];
      const isStructural = structuralTags.includes(tag);

      if (isParagraph || (isShort && childrenStr && !isStructural)) {
        const flatHTML = node.innerHTML.trim().replace(/\s+/g, ' ');
        return `${space}<${tag}${attrs}>${flatHTML}</${tag}>\n`;
      }
      // ---------------------------------------------------

      return `${space}<${tag}${attrs}>\n${childrenStr}${space}</${tag}>\n`;
    }
    return process(rootNode).trim();
  }

  // --- CORE SYSTEM INTERACTION LOOPS ---

  function syncJsonToHtml() {
    if (isUpdating) return;
    isUpdating = true;

    const staticHtml = staticEditor.getValue().trim();
    const jsonText = jsonEditor.getValue().trim();

    if (!staticHtml) {
      htmlEditor.setValue('');
      isUpdating = false;
      return;
    }

    try {
      const parser = new DOMParser();
      // FIX: Read entire static tree naturally 
      const doc = parser.parseFromString(staticHtml, 'text/html');
      const workingRoot = doc.documentElement; 

      if (workingRoot && jsonText) {
        const configPatches = JSON.parse(jsonText);

        Object.entries(configPatches).forEach(([key, patch]) => {
          let target = null;
          let selector = patch.querySelector || patch.querSelector;

          // FIX: Explicit element structural targeting maps safely across head and body boundary limits
          if (selector === 'html') {
            target = workingRoot;
          } else if (selector === 'body') {
            target = doc.body;
          } else if (selector === 'head') {
            target = doc.head;
          } else {
            selector = selector || `#${key}`;
            target = workingRoot.querySelector(selector);
          }

          if (target && (patch.insertion || patch.tag)) {
            const insertionMode = patch.insertion || 'replace';
            const freshElement = renderNode(patch);

            if (insertionMode === 'replace') {
              target.innerHTML = '';
              target.appendChild(freshElement);
            } else if (insertionMode === 'append') {
              target.appendChild(freshElement);
            } else if (insertionMode === 'prepend') {
              target.insertBefore(freshElement, target.firstChild);
            } else if (insertionMode === 'before') {
              target.before(freshElement);
            } else if (insertionMode === 'after') {
              target.after(freshElement);
            }
          } else {
            const fallbackTarget = workingRoot.querySelector(`#${key}`);
            if (fallbackTarget) {
              if (patch.textContent !== undefined) fallbackTarget.textContent = patch.textContent;
              if (patch.innerHTML !== undefined) fallbackTarget.innerHTML = patch.innerHTML;
              if (patch.class !== undefined) fallbackTarget.className = patch.class;
            }
          }
        });
      }

      if (workingRoot) {
        // FIX: Serializes full structural framework configuration safely
        htmlEditor.setValue('<!DOCTYPE html>\n' + formatHTMLDoc(workingRoot));
      }
      applyReadOnlyHighlights();
    } catch (e) {
      console.error(e);
    }
    isUpdating = false;
  }

  function syncHtmlToJson() {
    // Intercept cascade event loops. If we are currently setting HTML 
    // content via syncJsonToHtml, do not run this and break the user's layout.
    if (isUpdating) return;
    isUpdating = true;

    const liveHtml = htmlEditor.getValue().trim();
    const staticHtml = staticEditor.getValue().trim();

    if (!liveHtml) {
      jsonEditor.setValue('{}');
      isUpdating = false;
      return;
    }

    try {
      const parser = new DOMParser();
      
      // FIX: Compare broad global roots instead of local isolated virtual divs
      const liveDoc = parser.parseFromString(liveHtml, 'text/html');
      const staticDoc = parser.parseFromString(staticHtml, 'text/html');
      
      const liveRoot = liveDoc.documentElement;
      const staticRoot = staticDoc.documentElement;

      const deltaJson = {};

      function buildDeltas(liveEl) {
        if (!liveEl || liveEl.nodeType !== Node.ELEMENT_NODE) return;
        if (liveEl.tagName.toLowerCase() === 'html') {
          Array.from(liveEl.children).forEach(child => buildDeltas(child));
          return;
        }

        const selector = liveEl.id ? `#${liveEl.id}` : liveEl.tagName.toLowerCase();
        
        let baseMatch = null;
        if (liveEl === liveRoot) {
          baseMatch = staticRoot;
        } else {
          baseMatch = staticRoot.querySelector(selector);
        }

        if (baseMatch) {
          if (liveEl.textContent.trim() !== baseMatch.textContent.trim() || liveEl.children.length !== baseMatch.children.length) {
            const key = liveEl.id || liveEl.tagName.toLowerCase();
            
            if (liveEl.children.length === 0) {
              deltaJson[key] = {
                tag: liveEl.tagName.toLowerCase(),
                id: liveEl.id || undefined,
                textContent: liveEl.textContent.trim()
              };
            }
          }
        } else {
          const parentEl = liveEl.parentElement;
          // FIX: Maps structural ancestors accurately depending on head vs body environments
          const parentSelector = parentEl === liveRoot ? 'html' : 
                                 (parentEl && parentEl.tagName.toLowerCase() === 'head' ? 'head' :
                                 (parentEl && parentEl.tagName.toLowerCase() === 'body' ? 'body' :
                                 (parentEl && parentEl.id ? `#${parentEl.id}` : (parentEl ? parentEl.tagName.toLowerCase() : 'body'))));
          const randomSuffix = Math.random().toString(36).substr(2, 5);
          const key = liveEl.id || `${liveEl.tagName.toLowerCase()}-${randomSuffix}`;
          
          deltaJson[key] = {
            querySelector: parentSelector,
            insertion: "append",
            ...elementToRawObject(liveEl)
          };
          return;
        }

        Array.from(liveEl.children).forEach(child => buildDeltas(child));
      }

      buildDeltas(liveRoot);
      jsonEditor.setValue(JSON.stringify(deltaJson, null, 2));
    } catch (e) {
      // Absorb editing phase variations safely
    }
    isUpdating = false;
  }

  // --- LINE EMBELLISHMENT & RESTRICTION FRAMEWORK ---
  let highlightTrackers = [];

  function applyReadOnlyHighlights() {
    const model = htmlEditor.getModel();
    if (!model) return;

    const freshHighlights = [];
    const lines = model.getLineCount();

    for (let i = 1; i <= lines; i++) {
      const currentContent = model.getLineContent(i);
      
      if (currentContent.includes('<html') || currentContent.includes('</html') ||
          currentContent.includes('<head') || currentContent.includes('</head') ||
          currentContent.includes('<body') || currentContent.includes('</body') || 
          currentContent.includes('class="site-header"') || currentContent.includes('id="main-content-area"')) {
        freshHighlights.push({
          range: new monaco.Range(i, 1, i, currentContent.length + 1),
          options: {
            isWholeLine: true,
            className: 'static-template-locked-bg',
            hoverMessage: { value: 'Static Framework Baseline: Bound immutably to static-monaco template code layout.' }
          }
        });
      }
    }
    highlightTrackers = htmlEditor.deltaDecorations(highlightTrackers, freshHighlights);
  }

  htmlEditor.onKeyDown((event) => {
    const cursorLine = htmlEditor.getPosition().lineNumber;
    const model = htmlEditor.getModel();
    const content = model.getLineContent(cursorLine);

    if (content.includes('<html') || content.includes('</html') || 
        content.includes('<head') || content.includes('</head') || 
        content.includes('<body') || content.includes('</body') || content.includes('class="site-header"')) {
      if (event.keyCode !== monaco.KeyCode.UpArrow && event.keyCode !== monaco.KeyCode.DownArrow && 
          event.keyCode !== monaco.KeyCode.LeftArrow && event.keyCode !== monaco.KeyCode.RightArrow) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });

  // --- BOUND MODEL CONTROLLER WATCHERS ---
  staticEditor.onDidChangeModelContent(() => syncJsonToHtml());
  jsonEditor.onDidChangeModelContent(() => syncJsonToHtml());
  htmlEditor.onDidChangeModelContent(() => syncHtmlToJson());

  // Set default initial state values matching template layout benchmarks
  const initialJson = {
    "demo-1":{
      "querySelector": "head",
      "insertion": "replace",
      "tag": "title",
      "textContent": "Welcome!"
    },
    "demo-2": {
      "querySelector": "header",
      "insertion": "replace",
      "tag": "nav",
      "items": [
        {
          "tag": "ul", "items": [
            { "tag": "li", "items": [
              { "tag": "a", "href": "#", "textContent": "Home"}
            ]},
            { "tag": "li", "items": [
              { "tag": "a", "href": "About", "textContent": "About"}
            ]}
          ]
        }
      ]
    }
  };

  jsonEditor.setValue(JSON.stringify(initialJson, null, 2));
  syncJsonToHtml();
});