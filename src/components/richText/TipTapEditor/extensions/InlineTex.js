import React, {createRef, useEffect, useRef} from 'react';
import useState from 'react-usestateref';
import firebase from "firebase";


import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-textmate';
import 'ace-builds/src-min-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/snippets/python';
import {FaICursor, FaPlay, FaStop, FaTerminal} from 'react-icons/fa';

import katex from 'katex';


// tiptap
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { isEmpty } from '@firebase/util';

/**
 * Notes: Controlling the cursor is very important. Specifically, when you set
 * the tex, you need to reset the cursor position.
 */

export const InlineTex = Node.create({
    name: 'inline-tex',
    inline: true,
    group: 'inline',
    atom: true,
    selectable:false,
    addAttributes() {
        return {
          rawTex: {
            default: '',
          },
          editing: {
            default:  true
          }
        }
      },
      
    
      parseHTML() {
        return [
          {
            tag: 'inline-tex',
          },
        ]
      },
    
      renderHTML({ HTMLAttributes }) {
        return ['inline-tex', mergeAttributes(HTMLAttributes)]
      },
    
      addNodeView() {
        return ReactNodeViewRenderer(RenderInlineTex)
      },
  })

export const RenderInlineTex = (props) => {
  
  
  let rawTex = props.node.attrs.rawTex
  let selected = props.node.attrs.editing
  const [isEditable, setIsEditable, editableRef] = useState(props.editor.isEditable)
  useEffect(() => {
    props.editor.on('transaction', () => {
        if(props.editor.isEditable != editableRef.current) {
          setIsEditable(props.editor.isEditable)
        }
      })
  }, [])

  const setSelected = (newValue) => {
    

    // ignore this if you are not editable
    if(!isEditable && newValue) {
      return
    }

    // make sure that editing isn't turned off for 
    // empty latex
    if(newValue || rawTex.trim() != '') {
      props.updateAttributes({
        editing:newValue
      })
    }
  }
  const onInputChange = (event) => {
    const newValue = event.target.value
    props.updateAttributes({
      rawTex: newValue
    })
  }

  const onBlur = () => {
    setSelected(false)
    props.editor.commands.focus()
  }

  const inputKeyDown = (event) => {
    if (event.key === 'Enter') {
      onBlur()
    }
    if (event.key === 'Tab') {
      onBlur()
    }
  }

  if(selected && isEditable) {
    let inputLength = rawTex.length > 0 ? rawTex.length : 3
    return (
      <NodeViewWrapper as="span">
        <ControlledInput 
          style={INPUT_STYLE}
          value={rawTex}
          onChange={e => onInputChange(e)}
          autoFocus
          size={inputLength}
          onKeyDown={(e) => inputKeyDown(e)}
          onBlur={() => onBlur()}
        ></ControlledInput>
      </NodeViewWrapper>
    )
  }
  return (
      <NodeViewWrapper as="span" >
        <RenderedInlineKatex 
          content={rawTex}
          onClick={() => setSelected(true)}/>
      </NodeViewWrapper>
  )
}

export const RenderedInlineKatex = (props) => {
  const [hasError, setHasError] = useState(false)
  const containerRef = createRef();
  useEffect(() => {
    if (containerRef.current && props.content) {
      try {
        katex.render(props.content, containerRef.current, {displayMode: false});
      } catch (error) {
        setHasError(true)
      }
    }
  }, [props.content]);

  let wrapperClass = '';
  if(hasError) {
    return <span className="badge bg-danger" onClick={props.onClick}>tex error</span>
  }
  if(props.content.trim() == '') {
    return <span className="badge bg-info" onClick={props.onClick}>empty tex</span>
  }
  return <span className={wrapperClass} ref={containerRef} onClick={props.onClick} />
};

const INPUT_STYLE = {
  fontFamily:'monospace'
}

// This class is a wrapper around input which keeps track of cursor position
const ControlledInput = (props) => {

  const { value, onChange, ...rest } = props;
  const [cursor, setCursor] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
     const input = ref.current;
     if (input) input.setSelectionRange(cursor, cursor);
  }, [ref, cursor, value]);

  const handleChange = (e) => {
     setCursor(e.target.selectionStart);
     onChange && onChange(e);
  };

  return <input ref={ref} autoFocus value={value} onChange={handleChange} {...rest} />;
};
