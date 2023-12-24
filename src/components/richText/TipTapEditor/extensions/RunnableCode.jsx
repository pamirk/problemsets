import React, {useState, useEffect, useRef, useContext} from 'react';


import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-cloud9_night';
import 'ace-builds/src-noconflict/mode-plain_text';
import 'ace-builds/src-noconflict/theme-textmate';
import 'ace-builds/src-min-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/snippets/python';
import {FaICursor, FaPlay, FaStop, FaTerminal} from 'react-icons/fa';


// tiptap
import { NodeViewWrapper } from '@tiptap/react'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { PyodideContext } from '../../../pyodide/PyodideProvider';

const MAX_OUTPUT_LINES = 200

export const RunnableCode = Node.create({
    name: 'runnable-code',
    group: 'block',
    selectable: true,
    code:true,
    atom: true,
    draggable:true,
    addAttributes() {
        return {
          code: {
            default: '# your code here!\n',
          }
        }
      },
    
      parseHTML() {
        return [
          {
            tag: 'runnable-code',
          },
        ]
      },
    
      renderHTML({ HTMLAttributes }) {
        return ['runnable-code', mergeAttributes(HTMLAttributes)]
      },
    
      addNodeView() {
        return ReactNodeViewRenderer(RenderRunableCode)
      },
  })

export const RenderRunableCode = (props) => {
  // props for keeping track of the output. in the future we will want to push this to
  // the atomic state...
  const outputRef = useRef()
  const messagesEndRef = useRef();
  const [isRunning, setIsRunning] = useState(false);
  // we should not need this. workaround beacuse "editable" is not reactive
  const [isEditable, setIsEditable] = useState(props.editor.isEditable)

  const [output, setOutput] = useState('')
  const [showOutput, setShowOutput] = useState(false)

  useEffect(() => {
    if (outputRef.current) {
      let editor = outputRef.current.editor
      console.log(output.length)
      editor.resize(true);
      editor.scrollToLine(output.length, true, true, () => {})
    }
  }, [output]);

  // this is fired by writing an empty string each time editable changes :(
  props.editor.on('transaction', () => {
      setIsEditable(props.editor.isEditable)
  })

  useEffect(() => {
    // this is a polling solution to get the standard output displayed.
    // it would be better to react to changes to std out, but that sounds hard!
    const messageInterval = setInterval(() => {
      refreshOutput();
    }, 100);
    const refreshOutput = function() {
      if (isRunning) {
        try {
          const stdout = window.pyodide.runPython('sys.stdout.getvalue()');
          formatOutput(stdout);
        } catch (error) {
          // do nothing
        }
      }
    };
    return () => clearInterval(messageInterval);
  }, [isRunning]);

  const onClick = (e) => {
    // e.stopPropagation();
  };

  const getCode = () => {
    return props.node.attrs.code
  };


  const formatOutput = (newValue) => {
    let lines = newValue.split('\n')
    // the off by one is for the final return
    let nLines = lines.length - 1
    if(nLines > MAX_OUTPUT_LINES) {
        // off by one here for the same reason
        let toKeep = lines.slice(-(MAX_OUTPUT_LINES+1))
        newValue = `last ${MAX_OUTPUT_LINES} lines...\n` + toKeep.join('\n')
    }
    setOutput(newValue)
  }


  const onValueChange = (newCode) => {
    props.updateAttributes({
        code: newCode
    })
  };



  async function _runCode() {
    // TODO: this is an issue -- setOutput and setIsRunning are asyncronous functions
    // we can useRef for an immediate update. It wont force a re-render, but thats fine.
    setOutput('');
    const code = getCode();
    initializePyodide();
    // window.pyodide.setInterruptBuffer(window.interruptBuffer);
    setIsRunning(true);
    await window.pyodide.runPythonAsync(getInitCode(null));
    window.pyodide
        .runPythonAsync(code)
        .then((r) => {
          const stdout = window.pyodide.runPython('sys.stdout.getvalue()');
          if (stdout) {
            setShowOutput(true);
          }
          formatOutput(stdout);
          setIsRunning(false);
        })
        .catch((err) => {
          setOutput(output + '\n' + String(err));
          setIsRunning(false);
          setShowOutput(true);
        });
  }
  return (
    <NodeViewWrapper data-drag-handle>
    <div
      style={{
        border: 'lightgrey',
        borderStyle: 'solid',
        borderWidth: '1px',
      }}
      onClick={(e) => onClick(e)}
      spellCheck="false"
      draggable="true"
    >
      <AceEditor
        mode="python"
        value={getCode()}
        onChange={(e) => onValueChange(e)}
        width="100%"
        minHeight="200px"
        fontSize="14px"
        enableBasicAutocompletion={true}
        enableLiveAutocompletion={true}
        enableSnippets={true}
        highlightActiveLine={false}
        showGutter={true}
        wrapEnabled={true}
        maxLines={Infinity}
        spellCheck="false"
        readOnly = {!isEditable}
      />
      {showOutput && (
        // <div
        //   spellCheck="false"
        //   style={{
        //     backgroundColor: 'black',
        //     color: 'white',
        //     maxHeight: '115px',
        //     marginBottom: '0px',
        //     padding: '5px',
        //   }}
        // >
        <AceEditor
        ref={outputRef}
        theme={"cloud9_night"}
        mode="plain_text"
        value={output}
        onChange={(e) => {}}
        width="100%"
        minHeight="200px"
        fontSize="14px"
        highlightActiveLine={false}
        showGutter={false}
        wrapEnabled={true}
        maxLines={5}
        spellCheck="false"
        readOnly = {true}
      />
      )}
      <RunButtonRow
        isRunning={isRunning}
        runCode={() => _runCode()}
        showOutput={showOutput}
        setShowOutput={setShowOutput}
      />
    </div>
    </NodeViewWrapper>
  );
};

const RunButtonRow = (props) => {
  const {
      pyodideLoadingState
  } = useContext(PyodideContext)
  let disabled = pyodideLoadingState != 'ready'

  let runStopText = (
    <span>
      <FaPlay /> {'Run'}
    </span>
  );
  if (props.isRunning) {
    runStopText = (
      <span>
        <FaStop /> {'Stop'}
      </span>
    );
  }

  let showHideOutput = (
    <span>
      <FaTerminal /> Show
    </span>
  );
  if (props.showOutput) {
    showHideOutput = (
      <span>
        <FaTerminal /> Hide
      </span>
    );
  }

  const onRunStopClick = () => {
    if (props.isRunning) {
      initializePyodide();
      // window.pyodide.runPython(`raise Exception('Stop')`);
    } else {
      props.runCode();
    }
  };

  return (
    <>
      <button
        onClick={() => onRunStopClick()}
        className="btn btn-light btn-sm "
        style={{width: '80px'}}
        disabled={disabled}
      >
        {runStopText}
      </button>

      <button
        onClick={() => props.setShowOutput(!props.showOutput)}
        style={{width: '80px'}}
        className="btn btn-light btn-sm "
        disabled={disabled}
      >
        {showHideOutput}
      </button>
    </>
  );
};


function initializePyodide() {
  // this is used to remove any variables / functions still in scope
  // between executions
  // let scope = uuidv4();
  // return window.pyodide.runPython(getPyodideScopeCode(scope))
  // allow for persistent state
}

function getPyodideScopeCode(scope) {
  return `# if there is a current scope present
# transfer all of its variables in the current
# globals scope somewhere else
curr_scope = pyodide_scopes['current_scope']
new_scope = "${scope}"
if curr_scope and curr_scope != new_scope:
  copy = pyodide_scopes['copy']
  pyodide_scopes['scopes'][curr_scope] = copy.copy(globals())
  # reset to init values first
  for var in list(globals().keys()):
      should_be_variables = list(pyodide_scopes['init_vars'].keys())
      should_be_variables += ['curr_scope', 'new_scope', 'copy', 'var']
      if var not in should_be_variables:
          del globals()[var]
  # add variables of the new scope if they exist
  globals().update(pyodide_scopes['scopes'].setdefault(new_scope, {}))
  del copy
pyodide_scopes['current_scope'] = new_scope
del new_scope
del curr_scope
`;
}

function getInitCode(fileName) {
  return `from js import document
import sys
import io
# capture standard output
sys.stdout = io.StringIO()
__name__ = "__main__"
`;
}
