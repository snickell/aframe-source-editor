import { CodeEditor } from './code-editor.js'

AFRAME.registerComponent("source-editor", {
  schema: {
    value: { type: 'string' },
		title: { type: 'string' },
		target: { type: 'string' },
		mode: { type: 'string', default: 'javascript' },
		'pixel-width': { type: 'int', default: 2048},
		'pixel-height': { type: 'int', default: 1024},
		'save-button': { type: 'boolean', default: false}
  },
  init: function () {
    const codeEditor = new CodeEditor({
      vr: true,
      events: this.el
    });
		
    this.codeEditor = codeEditor;
    
    codeEditor.aceEditor.commands.addCommands(CodeEditor.commands.javascript);

    ace.config.set("basePath", "https://unpkg.com/aframe-source-editor@0.1.1/vendor/ace/");
    ace.config.set("modePath", "https://unpkg.com/aframe-source-editor@0.1.1/vendor/ace/");
    codeEditor.setSize(this.data['pixel-width'], this.data['pixel-height']);
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

    CodeEditor.autocomplete.installDynamicJSCompleterInto(codeEditor.aceEditor);
    codeEditor.aceEditor.setOption("mode", "ace/mode/javascript");
    

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
	saveClicked: function () {
		if (this.target) this.saveToTarget();
		var saveEvent = new CustomEvent('save', { 
			detail: { 
				text: this.getText(), 
				target: this.target 
			}
		});
  	this.el.dispatchEvent(saveEvent);
  },
  update: function () {
		if (this.data.mode) {
			this.getAceEditor().setOption("mode", "ace/mode/" + this.data.mode);
		}		

		if (this.data.target) {
      this.target = document.getElementById(this.data.target);
      this.updateFromTarget();
    } else if (this.data.value) {
      this.setText(this.data.value);
    }
				
		if (this.data.title) {
      const title = document.createElement("a-text");
      title.setAttribute("value", "Component: " + this.target.getAttribute("name"));
      title.setAttribute("color", "white");
      title.setAttribute("position", "-2.5 1.35 0");
      title.setAttribute("scale", "0.5 0.5 0.5")
      this.el.appendChild(title);				
		}
		
		if (this.data['save-button']) {
			console.log("Creating a save button");
	    const saveButton = document.createElement("a-button");
	    saveButton.setAttribute("value", "Save");
	    saveButton.addEventListener("click", this.saveClicked.bind(this));
	    saveButton.setAttribute("position", "-2.5 -1.1 0");
	    saveButton.setAttribute("button-color", "#ff69b4");
	    saveButton.setAttribute("scale", "0.7 0.7 0.7");
	    this.el.appendChild(saveButton);			
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


AFRAME.registerPrimitive("a-source-editor", {
  defaultComponents: {
    'source-editor': {}
  },
  mappings: {
    target: 'source-editor.target',
		title: 'source-editor.title',
    value: 'source-editor.value',
		mode: 'source-editor.mode',
		'save-button': 'source-editor.save-button',
		'pixel-width': 'source-editor.pixel-width',
		'pixel-height': 'source-editor.pixel-height'
  }
});
