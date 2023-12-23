import {createContext, useEffect, useState} from 'react'

// this is akin to a global variable state
export const PyodideContext = createContext()

const loadPyodide = async (setPyodideLoadingState) => {
    if (window.pyodide) {
        console.log('init pyodid scopes')
        initPyodideScopes()
        return window.pyodide
    }
    if (window.startedLoading) {
        console.log('started loading')
        // this is a strange place to be...
        // sometimes you dont actually finish loading...
        return false
    }
    console.log('loading pyodide!')

    // so that the API matches the unthrow version
    window.setHandlers = () => {
    }
    window.raisePyodideStopFlag = () => {
    }

    window.startedLoading = true
    // console.log('loading python...')
    setPyodideLoadingState('Loading python...')

    window.pyodide = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/"
    });

    // If you want more libraries included, you have to load them here
    await window.pyodide.loadPackage("numpy");
    await window.pyodide.loadPackage("scipy")
    initPyodideScopes()

    await window.pyodide.runPythonAsync(`
from js import document
import sys
import io


import copy
pyodide_scopes = {
 "copy": copy,
 "init_vars": copy.copy(globals()),
 "current_scope": "",
 "next_scope_number": 0,
 "scopes": {}
}
pyodide_scopes['init_vars']['pyodide_scopes'] = pyodide_scopes
del copy

# capture standard output
sys.stdout = io.StringIO()
__name__ = "__main__"
`
    );


    console.log('pyodide ready')
    setPyodideLoadingState('ready')
    return window.pyodide;
}

const initPyodideScopes = () => {
    window.pyodide.runPython(`\
  import copy
  pyodide_scopes = {
   "copy": copy,
   "init_vars": copy.copy(globals()),
   "current_scope": "",
   "next_scope_number": 0,
   "scopes": {}
  }
  pyodide_scopes['init_vars']['pyodide_scopes'] = pyodide_scopes
  del copy
  `)
    // console.log('pyodide scopes initialized', new Date())
}

export default function PyodideProvider({children}) {


    const [pyodideLoadingState, setPyodideLoadingState] = useState('loading')

    useEffect(() => {
        loadPyodide(setPyodideLoadingState)
    }, [])

    return (
        <PyodideContext.Provider
            value={{
                pyodideLoadingState
            }}
        >
            {children}
        </PyodideContext.Provider>
    )
}

function getInitCode() {
    return `from js import document
import sys
import io
# capture standard output
sys.stdout = io.StringIO()
__name__ = "__main__"
`
}