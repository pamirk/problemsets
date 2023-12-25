import React, {createRef, useEffect} from 'react';
import useState from 'react-usestateref';


import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/ace';
import 'ace-builds/src-noconflict/mode-latex';
import 'ace-builds/src-noconflict/theme-textmate';
import 'ace-builds/src-noconflict/theme-terminal';
import 'ace-builds/src-min-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/snippets/python';

import katex from 'katex';


// tiptap
import {NodeViewWrapper, ReactNodeViewRenderer} from '@tiptap/react'
import {mergeAttributes, Node} from '@tiptap/core'
import {FaTimes} from 'react-icons/fa';

export const BlockTex = Node.create({
    name: 'block-tex',
    inline: false,
    group: 'block',
    atom: true,
    draggable: true,
    selectable: true,
    code: true,
    addAttributes() {
        return {
            rawTex: {
                default: '\\begin{aligned}\n\n\\end{aligned}',
            },
            showEditor: {
                default: true
            }
        }
    },

    parseHTML() {
        return [
            {
                tag: 'block-tex',
            },
        ]
    },

    renderHTML({HTMLAttributes}) {
        return ['block-tex', mergeAttributes(HTMLAttributes)]
    },

    addNodeView() {
        return ReactNodeViewRenderer(RenderBlockTex)
    },
})

export const RenderBlockTex = (props) => {

    let rawTex = props.node.attrs.rawTex
    let showEditor = props.node.attrs.showEditor

    // we should not need this. workaround beacuse "editable" is not reactive
    const [isEditable, setIsEditable, editableRef] = useState(props.editor.isEditable)
    useEffect(() => {
        props.editor.on('transaction', () => {
            if (props.editor.isEditable != editableRef.current) {
                setIsEditable(props.editor.isEditable)
            }
        })
    }, [])


    const setShowEditor = (newValue) => {
        // ignore this if you are not editable
        if (!isEditable && newValue) {
            return
        }

        if (newValue || rawTex.trim() != '') {

            props.updateAttributes({
                showEditor: newValue
            })
        }
    }
    const onInputChange = (newLatex) => {
        props.updateAttributes({
            rawTex: newLatex
        })
    }

    const onClick = () => {
        if (!showEditor) {
            setShowEditor(true)

        }
    }

    return (
        <NodeViewWrapper onClick={(e) => onClick(e)} spellCheck="false">
            <CodeSnippet
                showEditor={showEditor && isEditable}
                value={rawTex}
                onChange={(e) => onInputChange(e)}
                editable={isEditable}
            />
            <CompiledLatex latexValue={rawTex} showEditor={showEditor && isEditable}/>
            {(showEditor && isEditable) && (
                <ButtonRow
                    showEditor={showEditor}
                    setShowEditor={(e) => setShowEditor(e)}
                />
            )}
        </NodeViewWrapper>
    );
}
const CompiledLatex = (props) => {
    let shownLatex = props.latexValue;
    let invalidTeX = true;
    let invalidTeXMessage = '';
    try {
        katex.__parse(props.latexValue);
        invalidTeX = false;
    } catch (e) {
        // latex failed to compile. Save the error.
        const msg = e.message
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace('KaTeX', 'LaTeX');
        shownLatex = '';
        invalidTeXMessage = msg;
    }
    if (!props.showEditor) {
        if (invalidTeX) {
            return (
                <div className="purpleBox">
                    <i>Invalid Latex Block. Click to edit</i>
                </div>
            );
        } else if (isBlockEmpty(props.latexValue)) {
            return (
                <div className="purpleBox">
                    <i>Empty LaTeX Block. Click to edit</i>
                </div>
            );
        }
    }
    return (
        <>
            <KatexOutput content={shownLatex} editMode={props.showEditor}/>
            {invalidTeX && (
                <div style={{color: 'orchid', width: '100%'}}>
                    <i>
                        {invalidTeXMessage}
                        <br/>
                        Rendering last valid compile
                    </i>
                </div>
            )}
        </>
    );
};


const CodeSnippet = (props) => {
    if (!props.showEditor) return <></>;
    // <input
    //   value={props.value}
    //   onChange={(e) => props.onChange(e.target.value)}
    //   />
    return (
        <div>
            <AceEditor
                mode="latex"
                value={props.value}
                onChange={(e) => props.onChange(e)}
                width="100%"
                minHeight="200px"
                fontSize="14px"
                cursorStart={1}
                highlightActiveLine={false}
                showGutter={true}
                display={'none'}
                wrapEnabled={true}
                maxLines={Infinity}
                spellCheck="false"
                readOnly={!props.editable}
            />
        </div>
    );
};


export const KatexOutput = (props) => {
    const containerRef = createRef();
    useEffect(() => {
        if (containerRef.current && props.content) {
            katex.render(props.content, containerRef.current, {displayMode: true});
        }
    }, [props.content]);

    let wrapperClass = '';
    if (props.editMode) {
        wrapperClass = 'purpleBox';
    }
    return (
        <div className={wrapperClass} ref={containerRef} onClick={props.onClick}/>
    );
};


const ButtonRow = (props) => {
    const onClick = (e) => {
        e.stopPropagation();
        props.setShowEditor(false);
    };

    return (
        <>
            <button
                onClick={(e) => onClick(e)}
                className="btn btn-light btn-sm"
                disabled={props.disabled}
            >
                <FaTimes/> Close Block Editor
            </button>
        </>
    );
};

function isBlockEmpty(content) {
    if (!content) return true;
    let result = content.replace('\\begin{aligned}', '');
    result = result.replace('\\end{aligned}', '');
    result = result.trim();
    return result === '';
}
  