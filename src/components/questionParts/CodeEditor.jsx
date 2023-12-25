import React from 'react';
import AceEditor from "react-ace";
import 'ace-builds/src-noconflict/ace';
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-textmate";
import "ace-builds/src-min-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/snippets/python";

export const CodeEditor = (props) => {

    // ace is not great for screen readers
    let screenReader = props.userMetaData && props.userMetaData.screenReader
    if (screenReader) {
        function textAreaChange(e) {
            let newValue = e.target.value
            props.onChange(newValue)
        }

        return <textarea
            className="screenReaderEditor"
            key={props.qId}
            type="text"
            value={props.value}
            onChange={(e) => textAreaChange(e)}
            style={{width: '100%', flexGrow: 2}}
        ></textarea>
    }


    return <AceEditor
        mode="python"
        key={props.qId}
        value={`${props.value}`}
        onChange={(e) => props.onChange(e)}
        width="100%"
        mode="python"
        fontSize="13px"
        enableBasicAutocompletion={true}
        enableLiveAutocompletion={true}
        enableSnippets={true}
        readOnly={!props.editable}
        wrapEnabled={true}
        maxLines={props.focusMode ? null : Infinity}
        style={{width: '100%', flexGrow: 2}}
    />
}