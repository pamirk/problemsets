import React from 'react';
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-textmate";
import "ace-builds/src-min-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/snippets/python";

export function PSetPrint(props) {


    return <div className="container-fluid" style={{background: '#f7f7f7', minHeight: '100vh'}}>
        <div className='row'>
            <div className='col'>

                <div style={{maxWidth: 720, padding: '20px', background: 'white', minHeight: '100vh'}}>
                    {/* <center><h2>PSet 1</h2></center> */}
                    {/* <hr/> */}
                    <div className="alert alert-primary mt-2"><b>Auto Submission:</b> In the PSet App you don't have to
                        hit "submit"
                        for your work to get uploaded -- we already have it. Any change you make up until the deadline
                        will automatically update your submission.
                        When the deadline hits you will no longer be able to edit your answers.
                    </div>
                    <hr/>
                </div>
            </div>
        </div>
    </div>
}
