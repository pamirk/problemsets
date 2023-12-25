import React, {useContext, useEffect, useRef, useState} from 'react'
import SplitPane from "react-split-pane";
import 'ace-builds/src-noconflict/ace';
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-textmate";
import "ace-builds/src-min-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/snippets/python";
import {FaPlay} from "react-icons/fa";
import {CodeEditor} from './CodeEditor.jsx';
import {PyodideContext} from '../pyodide/PyodideProvider';
import {v4 as uuidv4} from 'uuid';
import {Scatter} from 'react-chartjs-2';
import {Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Tooltip,} from 'chart.js';

import {useExplanationDebounced} from '../general/database/ExplanationDebouncer';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);


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

export const CodeGraphSplit = (props) => {
    const {
        isPyodideLoading
    } = useContext(PyodideContext)

    const graphRef = useRef()

    let starterCode = props.questionInfo['starter']
    let [code, isExplanationLoading, loadingError, onCodeChange] = useExplanationDebounced(props.firebaseDocPath, true, starterCode, props.sessionId)


    let [output, setOutput] = useState('')
    let [isRunning, setIsRunning] = useState(false)
    let [graphData, setGraphData] = useState([])

    let gameCode = props.questionInfo.game

    useEffect(() => {
        if (graphData.length == 0) return
        let chart = graphRef.current
        chart.data.datasets = sanitizeGraphData(graphData)
        chart.update();
        console.log('yo')
    }, [graphData])

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
                window.pyodide.runPython(gameCode)
                window.pyodide.runPythonAsync('__run()')
                    .then((result) => {
                        var stdout = window.pyodide.runPython("sys.stdout.getvalue()")
                        var graphDataProxy = window.pyodide.globals.get("__graphDataSets")
                        var graphData = graphDataProxy.toJs()
                        setOutput(stdout)
                        setGraphData(graphData)
                        setIsRunning(false)
                        if (result == 100 && !props.currIsCorrect) {
                            props.submitAnswer(result)
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

    if (isExplanationLoading) {
        return <></>
    }

    if (loadingError) {
        return <>Error loading answer</>
    }

    if (props.focusMode) {
        return <SplitPane
            minSize={400}
            maxSize={-400}
            defaultSize={'50%'}
            split="vertical"
        >
            <div className="d-flex flex-column h-100">
                <CodeEditor
                    key={props.qId + props.key}
                    editable={props.editable}
                    value={code}
                    onChange={onCodeChange}
                    qId={props.qId}
                    userMetaData={props.userMetaData}
                    style={{flexGrow: 2}}
                    focusMode={props.focusMode}
                />
                <RunButtonRow runCode={runCode} disabled={isRunning || isPyodideLoading}/>
            </div>
            <div className="d-flex flex-column h-100">
                <Graph
                    output={output}
                    graphData={graphData}
                    graphRef={graphRef}
                    focusMode={props.focusMode}
                />
            </div>
        </SplitPane>
    }

    return <>
        <SplitPane
            minSize={50}
            maxSize={400}
            defaultSize={400}
            split="horizontal"
            className='standardAnswerPane'
        >

            <CodeEditor
                key={props.qId + props.key}
                editable={props.editable}
                value={code}
                onChange={onCodeChange}
                qId={props.qId}
                userMetaData={props.userMetaData}
                focusMode={props.focusMode}
            />
            <div className="d-flex flex-column h-100" style={{overflowY: 'hidden'}}>
                <RunButtonRow runCode={runCode} disabled={isRunning || isPyodideLoading}/>
                <Graph
                    output={output}
                    graphData={graphData}
                    graphRef={graphRef}
                />
            </div>
        </SplitPane>
    </>

}

const Graph = (props) => {
    let graphOptions = options
    if (props.focusMode) {
        graphOptions.aspectRatio = 1.2
    }
    return <div ref={props.graphRef} className="consoleBox" style={{overflowY: 'scroll', flexGrow: 2}}>
        <pre className="m-0" style={{fontFamily: 'monaco'}}>
            {props.output}
        </pre>
        <Scatter
            ref={props.graphRef}
            data={format}
            options={options}
            style={{flexGrow: 2}}
        />
    </div>
}

/**
 * graphData is of the format 'label
 */
function sanitizeGraphData(rawInput) {
    console.log(rawInput)
    let graphDatasets = []
    let colorIndex = 0
    for (const dataset of rawInput) {
        graphDatasets.push({
            'label': dataset.get('label'),
            'data': sanitizeGraphDataset(dataset.get('data')),
            'backgroundColor': getGraphColor(colorIndex)
        })
        colorIndex += 1
    }
    return graphDatasets
}

function getGraphColor(colorIndex) {
    if (colorIndex == 0) return 'blue'
    if (colorIndex == 1) return 'green'
    if (colorIndex == 2) return 'purple'
    if (colorIndex == 3) return 'red'
}

function sanitizeGraphDataset(rawDataset) {
    let graphData = []
    for (const point of rawDataset) {
        graphData.push({
            'x': point.get('x'),
            'y': point.get('y')
        })
    }
    return graphData
}

const format = {
    datasets: [
        {
            data: [{}],
            backgroundColor: 'blue',
            label: ''
        },
    ],
};

const options = {
    animation: {
        duration: 0
    },
    plugins: {
        legend: {
            display: true
        }
    },
}


const RunButtonRow = (props) => {
    return <button
        onClick={() => props.runCode()}
        style={{width: '120px'}}
        className="btn btn-primary "
        disabled={props.disabled}
    >
        <FaPlay/> {'Run'}
    </button>
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


export const useContainerDimensions = myRef => {
    const getDimensions = () => {
        if (!myRef.current) {
            return {
                width: 0,
                height: 0
            }
        }

        let size = {
            width: myRef.current.offsetWidth,
            height: myRef.current.offsetHeight
        }
        return size
    }

    const [dimensions, setDimensions] = useState(getDimensions())

    useEffect(() => {
        const handleResize = () => {
            setDimensions(getDimensions())
        }

        if (myRef.current) {
            setDimensions(getDimensions())
        }

        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [myRef])

    return dimensions;
};
