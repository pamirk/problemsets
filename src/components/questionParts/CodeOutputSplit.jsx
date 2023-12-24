import {useContext, useState} from 'react'
import SplitPane from "react-split-pane";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-textmate";
import "ace-builds/src-min-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/snippets/python";
import {FaPlay} from "react-icons/fa";
import {CodeEditor} from './CodeEditor.jsx';
import {PyodideContext} from '../pyodide/PyodideProvider';
import {v4 as uuidv4} from 'uuid';
import {useExplanationDebounced} from '../general/database/ExplanationDebouncer';

/**
 * WARNING: This setup works quite well. However, it turns out it is run on the main thread.
 * This means that when running python, the UI freezes. There is a known solution: use a webworker:
 * https://www.npmjs.com/package/web-worker
 * See page 11 of this document for details:
 * https://readthedocs.org/projects/pyodide/downloads/pdf/latest/
 *
 *
 *
 * Learn more about Pyodide:
 * https://stackoverflow.com/questions/56583696/how-to-redirect-render-pyodide-output-in-browser
 * https://githubmemory.com/repo/pyodide/pyodide/issues/1584
 *
 *
 * TODO:
 * - catch errors and update AceEditor
 * - clear global variables between runs
 * - run piodide on a worker thread so the UI doesn't freeze
 * - use the "js" package
 * - allow for interaction with input (woah that just worked)
 * - catch matplotlib output
 * - allow multiple files
 *
 * Question:
 * Can we save the python initialization in localstorage?
 */

export const CodeOutputSplit = (props, ref) => {
    const {
        pyodideLoadingState
    } = useContext(PyodideContext)
    let starterCode = props.questionInfo['starter']
    let [code, isExplanationLoading, loadingError, onCodeChange] = useExplanationDebounced(props.firebaseDocPath, true, starterCode, props.sessionId)
    let [output, setOutput] = useState('')
    let [isRunning, setIsRunning] = useState(false)

    if (isExplanationLoading) {
        return <></>
    }
    if (loadingError) {
        return <>Error loading your answer. Please refresh.</>
    }
    let isPyodideLoading = pyodideLoadingState != 'ready'


    const runCode = () => {
        initializePyodide()
        setIsRunning(true)
        // capture stdout
        window.pyodide.runPython(`
import sys
import io
sys.stdout = io.StringIO()
        `);
        // run the code
        window.pyodide.runPython('__name__ = "__main__"')
        window.pyodide.runPythonAsync(code)
            .then((r) => {
                // collect stdout
                var stdout = window.pyodide.runPython("sys.stdout.getvalue()")
                setOutput(stdout)
                setIsRunning(false)
            })
            .catch((err) => {
                setOutput(String(err))
                setIsRunning(false)
            })

    }

    if (props.focusMode) {
        return <>
            <SplitPane
                minSize={400}
                maxSize={-400}
                defaultSize={'50%'}
                split="vertical"
            >
                <div className='d-flex flex-column h-100'>
                    <CodeEditor
                        key={props.qId}
                        editable={props.editable}
                        value={code}
                        onChange={onCodeChange}
                        qId={props.qId}
                        userMetaData={props.userMetaData}
                        focusMode={props.focusMode}
                    />
                    <button
                        onClick={() => runCode()}
                        style={{width: '100px'}}
                        className="btn btn-primary"
                        disabled={isRunning || isPyodideLoading}
                    >
                        <FaPlay/> Run
                    </button>
                </div>
                <div className="d-flex flex-column h-100">
                    <div className="consoleBox" style={{overflowY: 'scroll', flexGrow: 2}}>
                        <pre className="m-0" style={{fontFamily: 'monaco'}}>{output}</pre>
                    </div>
                </div>


            </SplitPane>

        </>
    }
    return <>
        <SplitPane
            minSize={200}
            maxSize={-200}
            defaultSize={450}
            split="horizontal"
            className='standardAnswerPane'
        >

            <CodeEditor
                key={props.qId}
                editable={props.editable}
                value={code}
                onChange={onCodeChange}
                qId={props.qId}
                userMetaData={props.userMetaData}
            />
            <div className="d-flex flex-column" style={{overflowY: 'hidden', height: '100%'}}>
                <button
                    onClick={() => runCode()}
                    style={{width: '100px'}}
                    className="btn btn-primary"
                    disabled={isRunning || isPyodideLoading}
                >
                    <FaPlay/> Run
                </button>

                <div className="consoleBox" style={{overflowY: 'scroll', flexGrow: 2}}>
                    <pre className="m-0" style={{fontFamily: 'monaco'}}>{output}</pre>
                </div>
            </div>
        </SplitPane>
    </>

}

function initializePyodide() {
    let scope = uuidv4();
    return window.pyodide.runPython(`
# if there is a current scope present
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
`)

}


/** */