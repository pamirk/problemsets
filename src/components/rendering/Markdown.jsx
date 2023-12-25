import React from "react";
import {unified} from "unified";
import markdown from "remark-parse";
import remarkGfm from 'remark-gfm'
import rehypePrism from 'rehype-prism'
import remark2rehype from "remark-rehype";
import rehype2react from "rehype-react";
import math from "remark-math";
import rehypeKatex from "rehype-katex"
import rehypeStringify from 'rehype-stringify'
import {hashString} from 'react-hash-string'
import Prism from 'prismjs'
import 'katex/dist/katex.min.css'
import 'prismjs/themes/prism.css'
import 'prismjs/components/prism-python.min.js'

var processor = unified()
    .use(markdown)
    .use(math)
    .use(remarkGfm)


    .use(remark2rehype, {sanitize: false})

    .use(rehypeKatex)
    .use(rehypePrism)
    .use(rehypeStringify)
    .use(rehype2react, {sanitize: false, createElement: React.createElement});

class Markdown extends React.Component {
    constructor() {

        super();
        this.prevHash = hashString('')
        this.cached = ''
    }

    componentDidMount() {
        Prism.highlightAll();
    }

    render() {
        if (this.props.textOnlyMode) {
            return this.props.text
        }

        let currHash = hashString(this.props.text)
        if (currHash == this.prevHash) {
            return <div className="markdownView">
                {this.cached}
            </div>
        }
        this.prevHash = currHash;
        this.cached = processor.processSync(this.props.text).result

        return (
            <div className="markdownView">
                {
                    this.cached
                }
            </div>
        );
    }
}

export default Markdown;
