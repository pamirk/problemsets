import {FaAlignCenter, FaImage, FaPython, FaSquareRootAlt,} from "react-icons/fa";

export const ButtonBar = ({editor, editable, onInsertImage}) => {
    if (!editable) return <></>;
    return (
        <div
            className="d-flex"
            style={{
                top: "0",
                background: "white",
                border: "1px solid lightgrey",
                borderRadius: "5px 5px 0px 0px",
                maxWidth: '670px'
            }}
        >

            <BlockLatexButton editor={editor}/>
            <InlineLatexButton editor={editor}/>
            <PythonButton editor={editor}/>
            <ImageButton editor={editor} onInsertImage={onInsertImage}/>


        </div>
    );
};


function InlineLatexButton({editor}) {
    return <button onClick={() =>
        editor
            .chain()
            .focus()
            .insertContent("<inline-tex></inline-tex>")
            .run()
    } className="btn btn-sm btn-light">
        <FaSquareRootAlt/> Inline LaTeX
    </button>
}

function ImageButton({editor, onInsertImage}) {
    return <button onClick={() => onInsertImage()} className="btn btn-sm btn-light">
        <FaImage/> Image
    </button>
}

function PythonButton({editor}) {
    return <button
        onClick={() =>
            editor
                .chain()
                .focus()
                .insertContent("<runnable-code></runnable-code>")
                .run()
        }
        className="btn btn-sm btn-light "
    >
        <FaPython/> Python
    </button>
}

function BlockLatexButton({editor}) {
    return <button onClick={() => editor
        .chain()
        .focus()
        .insertContent("<block-tex></block-tex>")
        .run()} className="btn btn-sm btn-light">
        <FaAlignCenter/> Block LaTeX
    </button>;
}