import  {useEffect, useRef, useState} from "react";

import {useDocumentDataOnce} from "react-firebase-hooks/firestore";
import firebase from "firebase"


import {useDebounce} from "use-debounce";
import {v4 as uuidv4} from "uuid";
import * as awarenessProtocol from "y-protocols/awareness.js";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-textmate";
import "ace-builds/src-min-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/snippets/python";

import Swal from "sweetalert2";

// tiptap
import {EditorContent, Extension, useEditor} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

import {RunnableCode} from "./extensions/RunnableCode.jsx";
import {InlineTex} from "./extensions/InlineTex.jsx";
import {BlockTex} from "./extensions/BlockTex.jsx";

// yjs
import * as Y from "yjs";
import {WebrtcProvider} from "y-webrtc";
import {firestore} from "../../../firebaseApp.js";

import './TipTap.scss';
import {ButtonBar} from "./ButtonBar";

export const WEBRTC_PROVIDERS = [
  'wss://y-webrtc-eu.fly.dev'
  // 'wss://y-webrtc-signaling-eu.herokuapp.com',
];

/**
 * Props:
 * editable: boolean. Can you edit the doc?
 * firebaseDocPath: string. Where in the firebase should we write the doc? We use our own
 *    format for this doc path, so I would recommend a doc that isn't used for anything else
 * onServerWrite: function with one parameter. An optional function which is called each time
 *    we write to the server. This can be used to do something like update a search index. It
 *    will be passed a JSON containing the content of the editor. Why use the JSON? If you
 *    want to highlight a found string in the editor, you will need the JSON format. Note, if
 *    you have multiple clients connected to the same document, only one of them will be in
 *    charge up updating the database.
 *
 *
 * TipTap is the *best* editor I have found. It is built off of ProseMirror, is
 * actively supported and just works so well. It also has principled support
 * for collaborative editing and for creating custom components.
 *
 * Collaboration:
 * Collaboration is built off the amazing yjs library. yjs can be backed by either
 * webrtc either serverlessly, or with a server. The server is the recommended option
 * however it doesn't work well with firebase. For the time being I am having the clients
 * take turns being the centralized server.
 * The "truth" is the webrtc yjs object. However this truth needs to be saved to the db
 * and loaded when a new editing room is created. Who should save? who should load?
 * The great idea is to use the following protocol:
 * whomever has the lowest sessionId is in charge of backing up to the firebase.
 * whomever is first to open the document is in charge of loading from the firebase.
 *
 * Loading / saving to the database:
 * Loading: set the editor content. This will propogate to future yjs connections
 * Saving: save the json of the editor content
 *
 * Notes on YJS and firebase:
 * https://github.com/yjs/yjs/issues/189
 *
 * I thought this conversation was very helpful:
 * https://discuss.yjs.dev/t/persisting-to-db-could-it-be-this-easy/358/3
 *
 * "awareness" is an important concept! Its used for things like...
 * knowing who else is online
 * keeping track of their cursor position etc
 *
 * Known issues:
 * - Cant drag/drop code
 */

export const TipTap = (props) => {

  const {
    editable,
    firebaseDocPath,
    user
  } = props

  // this component is not reactive to
  // firebaseDocPath changing, or collaborative changing
  // if either of those change, we need to force react
  // to re-create this component. We do that by giving
  // the component a unique key based on the two components

  
  

  if (!firebaseDocPath) {
    return <>No firebaseDocPath</>;
  }

  // force the component to un-mount if any of these change
  const uniqueKey = `${firebaseDocPath}-${editable}`
  return <TipTapSafe {...props} key={uniqueKey}/>

}

const TipTapSafe = ({
  editable,
  firebaseDocPath,
  user
}) => {

  // listen to changes to the firebase document path
  const [serverData, serverDataLoading, serverDataError] = useDocumentDataOnce(
    firestore.doc(firebaseDocPath)
  );
  if (serverDataLoading) return <></>;
  if (serverDataError) return <p>Error loading data</p>;

  return (
    <TipTapWithData
      serverData={serverData}
      firebaseDocPath={firebaseDocPath}
      editable={editable}
      user={user}
    />
  );
};

/**
 * Main job is to control multiple editors
 */
export const TipTapWithData = ({
  editable,
  firebaseDocPath,
  serverData,
  user
}) => {

  // test cases
  const docPathRef = useRef(firebaseDocPath)
  const editableRef = useRef(editable)
  useEffect(() => {
    if(!firebaseDocPath) {
      throw new Error("firebaseDocPath is null in TipTapSafe")
    }
    if(docPathRef.current !== firebaseDocPath) {
      throw new Error("firebaseDocPath changed in TipTapSafe")
    }
    if(editableRef.current !== editable) {
      throw new Error("editable changed in TipTapSafe")
    }
  }, [firebaseDocPath, editable])

  let [webProvider, setWebProvider] = useState(null);

  // for writing to the firebase. ready changes are the json to save
  // which gets debounced to prevent too many writes.
  const [readyChanges, setReadyChanges] = useState(null);
  const [debouncedChanges] = useDebounce(readyChanges, 500);

  const isLoggingUser = (awareness) => {
    /**
     * GOAL: I would like this to alternate answers among users to add some
     * robustness
     * Ways that I could possibly do this include:
     *  - take the time and mod it by half a second, and use this
     *    to chose which person should write (edit: wont work)
     *  - in the awareness dicitonary, we could record the last time
     *    that the person wrote to the database. Person who is supposed
     *    to write is the one who has written the least recently (with
     *    some code to manage ties and to manage users who never write)
     *  - everyone debounces every 250 * N_USERS ms and we somehow make
     *    sure that they are well stratified (edit: wont work)
     */

    // are you in charge of saving to the database?
    let states = awareness.getStates();

    let userArray = Array.from(states).map((state) => state);

    let minUserId = awareness.clientID;
    for (let currUser of userArray) {
      let userId = currUser[0];
      if (userId < minUserId) {
        minUserId = userId;
      }
    }
    return minUserId == awareness.clientID;
  };

  const onUpdate = (json, html, text) => {
    // the underlying json has changed
    if (isLoggingUser(webProvider.awareness)) {
      setReadyChanges(json);
    }
  };

  useEffect(() => {
    if(!editable){return}
    // this is where we write to the database
    if (debouncedChanges) {
      let docArray = Y.encodeStateAsUpdateV2(webProvider.doc);
      let encodingStr = 'V2'

      let docBlob = firebase.firestore.Blob.fromUint8Array(docArray);
      console.log(docArray.length, 'size')
      firebase.firestore().doc(firebaseDocPath).set({
          content: debouncedChanges,
          ydoc: docBlob,
          lastEdit: new Date(),
          size:docArray.length,
          version:encodingStr
        },
        { merge: true }
      )
      .catch((error) => {

        Swal.fire({
          icon: "error",
          title: "Failed to save to server",
          position: "top-end",
          text: error.message,
        });
      });
    }
  }, [debouncedChanges]);

  // Constructor
  useEffect(() => {
    let roomName = getUniqueProviderRoom(firebaseDocPath);
    let ydoc = new Y.Doc();

    if (serverData && serverData.ydoc) {
      // load a ydoc from the data if it has one
      // be careful: dont try and inject from the json
      // that can lead to strange sync issues with yjs
      let docBlob = serverData.ydoc;
      let docArray = docBlob.toUint8Array();

      console.log('firebaseDocPath', firebaseDocPath)

      let useV2 = false
      if(serverData.version) {
        useV2 = serverData.version === 'V2'
      }
      if(useV2) {
        console.log('loading using v2')
        Y.applyUpdateV2(ydoc, docArray);
      } else {
        console.log('loading using v1')
        Y.applyUpdate(ydoc, docArray)
      }
      
      
    }

    let awareness = new awarenessProtocol.Awareness(ydoc);
    const provider = new WebrtcProvider(roomName, ydoc, {
      signaling: WEBRTC_PROVIDERS,
      awareness,
    });

    setWebProvider(provider);

    return () => {
      provider.destroy()
    };
  }, []);

  // wait until you are ready...
  if (!webProvider) {
    return <>loading...</>;
  }

  return (
    <TipTapWithDoc
      onUpdate={onUpdate}
      serverData={serverData}
      provider={webProvider}
      editable={editable}
      user={user}
    />
  );
};

// for the cursors of collaborative users
const USER_COLORS = [
  "#958DF1",
  "#F98181",
  "#FBBC88",
  "#FAF594",
  "#70CFF8",
  "#94FADB",
  "#B9F18D",
];
const random_color = () => {
  const index = Math.floor(Math.random() * USER_COLORS.length);
  return USER_COLORS[index];
};

/**
 * This is the actual editor
 */
const TipTapWithDoc = ({ provider, onUpdate, editable, user }) => {
  const editorRef = useRef()
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
      }),
      // Register the document with Tiptap
      Collaboration.configure({
        document: provider.doc,
      }),
      // Register the collaboration cursor extension
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: user.displayName,
          color: random_color()
        },
      }),
      Extension.create({
        addKeyboardShortcuts() {
          return {
            'Ctrl-4': () => {
              insertInlineLaTex()
              // editor.chain().focus().insertContent("<inline-tex></inline-tex>").run()
            }
          }
        },
      }),
    ],
    editable: editable,
  });
  editorRef.current = editor

  const insertInlineLaTex = () => {
    editorRef.current.chain().focus().insertContent("<inline-tex></inline-tex>").run()
    return true
  }

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
      onUpdate(json, html, text);
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
      <div 
        className={"tiptapContentWrapper " +(editable ? "editor editableWrapper" : "")}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

const getUniqueProviderRoom = (firebaseUrl) => {
  const SALT = "cs109psetapp25041989";
  return SALT + firebaseUrl.replaceAll("/", "-");
};