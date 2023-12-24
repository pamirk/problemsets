import {useContext, useState} from 'react'
import SplitPane from "react-split-pane";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-textmate";
import "ace-builds/src-min-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/snippets/python";

import {PyodideContext} from '../pyodide/PyodideProvider';
import {v4 as uuidv4} from 'uuid';
import {CodeEditor} from './CodeEditor.jsx';
import {Console} from './Console.jsx'
import {FaPlay, FaVial} from "react-icons/fa"
import {useExplanationDebounced} from '../general/database/ExplanationDebouncer';

export const CodeAgent = (props) => {
    const {
        pyodideLoadingState
    } = useContext(PyodideContext)
    let gameCode = props.questionInfo.game
    let starterCode = props.questionInfo.starter
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

    const runCode = (mainFnCall) => {
        setIsRunning(true)
        initializePyodide(code)
        // capture stdout
        window.pyodide.runPython(`
import sys
import io
sys.stdout = io.StringIO()
        `);
        // run the code
        setOutput('')
        window.pyodide.runPythonAsync(code)
            .then((r) => {
                window.pyodide.runPython(gameCode)
                window.pyodide.runPythonAsync(mainFnCall)
                    .then((result) => {
                        // collect stdout
                        var stdout = window.pyodide.runPython("sys.stdout.getvalue()")
                        setOutput(stdout)
                        setIsRunning(false)
                        if (mainFnCall === '__test_agent()') {
                            // console.log('submitting..', float(result))
                            props.submitAnswer(result.toFixed(5))
                        }
                    })
                    .catch((err) => {
                        setOutput(String(err))
                        setIsRunning(false)

                    })
            })
            .catch((err) => {
                setOutput(String(err))
                setIsRunning(false)
            })


    }

    // what does the run button say?
    var buttonText = isPyodideLoading ? 'Loading python...' : 'Run'
    buttonText = isRunning ? 'Running...' : buttonText

    if (props.focusMode) {
        return <SplitPane
            minSize={400}
            maxSize={-400}
            defaultSize={'50%'}
            split="vertical"
        >
            <div className='d-flex flex-column h-100'>
                <CodeEditor
                    style={{flexGrow: 2}}
                    key={props.qId}
                    editable={props.editable}
                    value={code}
                    onChange={onCodeChange}
                    qId={props.qId}
                    userMetaData={props.userMetaData}
                />
                <RunButtonRow
                    runCode={runCode}
                    isDisabled={isRunning || isPyodideLoading}
                />
            </div>
            <div className='d-flex flex-column h-100'>

                <Console output={output}/>
            </div>
        </SplitPane>
    }
    return <>
        <SplitPane
            minSize={200}
            maxSize={-200}
            defaultSize={450}
            split="horizontal"
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
                <RunButtonRow
                    runCode={runCode}
                    isDisabled={isRunning || isPyodideLoading}
                />
                <Console output={output}/>

            </div>
        </SplitPane>
    </>

}

const RunButtonRow = (props) => {
    return <div className='d-flex flex-row'>
        <button
            onClick={() => props.runCode('__test_agent_single_game()')}
            style={{width: '160px'}}
            className="btn btn-light "
            disabled={props.isDisabled}
        >
            <FaPlay/> Run One Game
        </button>
        <button
            onClick={() => props.runCode('__test_agent()')}
            style={{width: '150px'}}
            className="btn btn-primary "
            disabled={props.isDisabled}
        >
            <FaVial/> Test Agent
        </button>
    </div>
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