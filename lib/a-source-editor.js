AFRAME.registerPrimitive("a-source-editor", {
  defaultComponents: {
    'source-editor': {}
  },
  mappings: {
    target: 'source-editor.target',
    text: 'source-editor.text'
  }
});

AFRAME.registerComponent("source-editor", {
  schema: {
    text: { type: 'string' }
  },
  init: function () {
    const scene = this.el.sceneEl;
    const codeEditor = new THREE.CodeEditor({
      domElement: scene.renderer.domElement,
      camera: scene.camera,
      vr: true,
      events: OPTIMIZE_SOURCE_EDITOR_FOR_MOUSE_INSTEAD_OF_VR ? null : this.el
    });
    this.codeEditor = codeEditor;
    window.aceEditor = codeEditor.aceEditor;
    
    codeEditor.aceEditor.commands.addCommands(THREE.CodeEditor.commands.javascript);

    ace.config.set("basePath", "https://unpkg.com/three-codeeditor@0.1.1/vendor/ace/");
    ace.config.set("modePath", "https://unpkg.com/three-codeeditor@0.1.1/vendor/ace/");
    codeEditor.setSize(2048, 1024);
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
  update: function () {
    if (this.data.text) {
      this.setText(this.data.text);
    } else if (this.data.target) {
      console.log("TARGET IS ", this.data.target);
      this.target = document.getElementById(this.data.target);
      this.updateFromTarget();

      const saveButton = document.createElement("a-button");
      saveButton.setAttribute("value", "Save");
      saveButton.addEventListener("click", this.saveToTarget.bind(this));
      saveButton.setAttribute("position", "-2.5 -1.1 0");
      saveButton.setAttribute("button-color", "#ff69b4");
      saveButton.setAttribute("scale", "0.7 0.7 0.7");

      const title = document.createElement("a-text");
      title.setAttribute("value", "Component: " + this.target.getAttribute("name"));
      title.setAttribute("color", "white");
      title.setAttribute("position", "-2.5 1.35 0");
      title.setAttribute("scale", "0.5 0.5 0.5")
      this.el.appendChild(title);

      this.el.appendChild(saveButton);
      this.codeEditor.aceEditor.setOption("mode", "ace/mode/javascript");
    }
  },
  updateFromTarget: function () {
    this.setText(this.target.innerText);
  },
  saveToTarget: function () {
    const text = this.getText();
    this.target.innerText = text;
    const a_module = this.target.closest("a-module"); // FIXME: this is a hacky way to do this
    console.log("Saving to target yo", text);        
    a_module.components.module.loadComponent(this.target, true);
    console.log("Evalled target");
  }
});