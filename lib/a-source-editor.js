AFRAME.registerPrimitive("a-source-editor", {
  defaultComponents: {
    'source-editor': {}
  },
  mappings: {
    target: 'source-editor.target',
    text: 'source-editor.text',
		'pixel-width': 'source-editor.pixel-width',
		'pixel-height': 'source-editor.pixel-height'
  }
});

var saveEvent = new Event('build');

AFRAME.registerComponent("source-editor", {
  schema: {
    value: { type: 'string' },
		title: { type: 'string' },
		target: { type: 'string' },
		'pixel-width': { type: 'int', default: 2048},
		'pixel-height': { type: 'int', default: 1024}
  },
  init: function () {
    const codeEditor = new THREE.CodeEditor({
      vr: true,
      events: this.el
    });
    this.codeEditor = codeEditor;
    window.aceEditor = codeEditor.aceEditor;
    
    codeEditor.aceEditor.commands.addCommands(THREE.CodeEditor.commands.javascript);

    ace.config.set("basePath", "https://unpkg.com/aframe-source-editor@0.1.1/vendor/ace/");
    ace.config.set("modePath", "https://unpkg.com/aframe-source-editor@0.1.1/vendor/ace/");
    codeEditor.setSize(this.data.width, this.data.height);
    codeEditor.aceEditor.setTheme("ace/theme/chrome");

    // FIXME setKeyboardHandler() is broken, it won't load the right amd module
    codeEditor.aceEditor.setKeyboardHandler("emacs", function () {
      codeEditor.aceEditor.keyBinding.addKeyboardHandler(
        ace.require("ace/keyboard/emacs").handler);
      var occurStartCommand = ace.require("ace/commands/occur_commands").occurStartCommand;
      codeEditor.aceEditor.commands.addCommand(occurStartCommand);
    });

    codeEditor.aceEditor.setOptions({
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: false,
      enableSnippets: true,
    });

    THREE.CodeEditor.autocomplete.installDynamicJSCompleterInto(codeEditor.aceEditor);
    codeEditor.aceEditor.setOption("mode", "ace/mode/html");
    

    // FIXME: this makes the ace editor text disappear from the canvas... why?!?
    //codeEditor.aceEditor.setFontSize("20px");

    codeEditor.scale.x = 0.0025;
    codeEditor.scale.y = 0.0025;
    codeEditor.scale.z = 0.0025;

    this.el.setObject3D('codeeditor', codeEditor);
  },
  setText: function (text) {
    this.codeEditor.aceEditor.setValue(text, 1);
  },
  getText: function () {
    return this.codeEditor.aceEditor.getValue();
  },
	getAceEditor: function () {
		return this.codeEditor.aceEditor;
	},
	init: function () {
    const saveButton = document.createElement("a-button");
    saveButton.setAttribute("value", "Save");
    saveButton.addEventListener("click", this.saveClicked.bind(this));
    saveButton.setAttribute("position", "-2.5 -1.1 0");
    saveButton.setAttribute("button-color", "#ff69b4");
    saveButton.setAttribute("scale", "0.7 0.7 0.7");
    this.el.appendChild(saveButton);		
	},
	saveClicked: function () {
		console.log("saveClicked");
		if (this.target) this.saveToTarget();
  	this.el.dispatchEvent(saveEvent);
  },
  update: function () {
		if (this.data.title) {
      const title = document.createElement("a-text");
      title.setAttribute("value", "Component: " + this.target.getAttribute("name"));
      title.setAttribute("color", "white");
      title.setAttribute("position", "-2.5 1.35 0");
      title.setAttribute("scale", "0.5 0.5 0.5")
      this.el.appendChild(title);				
		}
				
    if (this.data.value) {
      this.setText(this.data.value);
    } else if (this.data.target) {
      this.target = document.getElementById(this.data.target);
      this.updateFromTarget();
      this.codeEditor.aceEditor.setOption("mode", "ace/mode/javascript");
    }
  },
  updateFromTarget: function () {
    this.setText(this.target.innerText);
  },
  saveToTarget: function () {
    const text = this.getText();
    this.target.innerText = text;
  }
});