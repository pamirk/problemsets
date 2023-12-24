import React, {useEffect, useRef, useState} from "react";

import {useDocumentDataOnce} from "react-firebase-hooks/firestore";
import firebase from "firebase";
import deepEqual from 'fast-deep-equal'


import {v4 as uuidv4} from "uuid";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-textmate";
import "ace-builds/src-min-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/snippets/python";
import Swal from "sweetalert2";

// tiptap
import {EditorContent, useEditor} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

import {RunnableCode} from "./extensions/RunnableCode.jsx";
import {InlineTex} from "./extensions/InlineTex.jsx";
import {BlockTex} from "./extensions/BlockTex.jsx";

// yjs
import './TipTap.scss';
import {ButtonBar} from "./ButtonBar";
import {useDebounce} from "use-debounce";

export const TipTapNoColab = ({
  editable,
  firebaseDocPath,
  user,
  contentKey
}) => {

  console.log('asdf')

  // listen to changes to the firebase document path
  const [serverData, serverDataLoading, serverDataError] = useDocumentDataOnce(
    firebase.firestore().doc(firebaseDocPath)
  );

  if (!firebaseDocPath) {
    return <>No firebaseDocPath</>;
  }

  if (serverDataLoading) return <></>;
  if (serverDataError) return <p>Error loading data</p>;

  // might have to inject a value
  let initialData = serverData ? serverData[contentKey] : ''
  console.log(contentKey)
  console.log(initialData)
  return (
    <TipTapWithData
      serverData={initialData}
      firebaseDocPath={firebaseDocPath}
      editable={editable}
      user={user}
    />
  );
};

/**
 * This is the actual editor
 */
const TipTapWithData = ({ serverData, editable, firebaseDocPath, user}) => {

  const [cachedContent, setCachedContent] = useState(serverData)

  // we dont want to write when the data first loads
  // useRef object will persist for the full lifetime of the component.
  const isFirstDebounce = useRef(); 
  useEffect(() => {
    // starts false! 
    isFirstDebounce.current = false
  },[])
  
  // debouncedExplanation is a lagged version of currExplanation (by 250ms). When it changes, we'll update the database with the explanation
  const [debouncedContent] = useDebounce(cachedContent, 250);

  // Whenever our debouncedContent changes, we need to update the database
  useEffect(() => {
    if (debouncedContent) {
      
      // only save if this isn't the data we just loaded from the db
      // option for optimization: you could short circuit the deepequal.
      // dont save if there hasn't been a change
      let isOriginal = deepEqual(serverData,debouncedContent)
      let shouldSave = !isOriginal && editable
      if(!isOriginal && editable) {
        isFirstDebounce.current = false
      }
      if(shouldSave) {
        console.log('saving...')
        isFirstDebounce.current = false
        firebase.firestore().doc(firebaseDocPath).set(
          { 
            comment: cachedContent,
            lastEdit: new Date()
           },
          { merge: true }
        )
        .catch(() => {
          // note that this is not fired when the internet is turned off!! 
          // https://stackoverflow.com/questions/60850409/firebase-set-object-in-firestore-never-catches-errors
          alert('error')
        })
      }
    }
  }, [debouncedContent]);

  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // The Collaboration extension comes with its own history handling
        // (you don't undo other peoples changes)
        history: false,
      }),
      InlineTex,
      BlockTex,
      RunnableCode,
      Placeholder.configure({
        placeholder: "Write something …",
      }),
      Image.configure({
        inline: false,
      })
    ],
    editable: editable,
    content:serverData
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
      editor.chain().focus().insertContent("").run();
    }
  }, [editable]);

  useEffect(() => {
    if (!editor) return;
    editor.on("update", ({ editor }) => {
      let json = editor.getJSON();
      let html = editor.getHTML();
      let text = editor.getText();
      setCachedContent(json)
    });
  }, [editor]);

  const uploadImg = (file) => {
    const storage = firebase.storage();
    const storageRef = storage.ref();
    const folder = user.uid;
    const uuid = uuidv4();
    const uploadTask = storageRef.child(folder + "/" + uuid).put(file);

    uploadTask.on(
      firebase.storage.TaskEvent.STATE_CHANGED,
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        console.log(progress, snapshot.bytesTransferred, snapshot.totalBytes);
        if (progress == 100) {
          Swal.fire({
            title: `Uploading image: Complete`,
            toast: true,
            timer: 2000,
            showConfirmButton: false,
            timerProgressBar: true,
            showClass: {
              popup: "none",
            },
          });
        } else {
          Swal.fire({
            title: `Uploading image: ${progress}%`,
            toast: true,
            timer: 10000,
            showClass: {
              popup: "none",
            },
            showConfirmButton: false,
          });
        }
      },
      (error) => {
        throw error;
      },
      () => {
        uploadTask.snapshot.ref.getDownloadURL().then((url) => {
          insertImage(url);
        });
      }
    );
  };

  const onInsertImage = () => {
    Swal.fire({
      title: "Select image",
      input: "file",
      inputAttributes: {
        accept: "image/*",
        "aria-label": "Upload your profile picture",
      },
    }).then((e) => {
      const file = e.value;
      if (file) {
        uploadImg(file);
      }
    });
  };

  const insertImage = (imgUrl) => {
    editor.chain().focus().insertContent(`<img src="${imgUrl}"></img>`).run();
  };

  return (
    <div className="tiptapWrapper">
      <ButtonBar
        editor={editor}
        editable={editable}
        onInsertImage={onInsertImage}
      />
      <div className={editable ? "editor" : ""}>
        <EditorContent 
            editor={editor} 
        />
      </div>
    </div>
  );
};

