export const Console = ({output, showTitle}) => {
    return <>
        {
            showTitle &&
            <div className='d-flex justify-content-between'>
                <b>Console</b>
                <span>
                    
                </span>
            </div>
        }

        <div className="consoleBox" style={{overflowY: 'scroll', flexGrow: 2, paddingBottom: 0}}>
            <div id="canvas"></div>
            <pre className="m-0" style={{fontFamily: 'monaco'}}>{output}</pre>
        </div>
    </>
}