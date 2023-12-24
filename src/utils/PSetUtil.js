export const getQuestionInfo = function (qId, publicQuestionInfo) {
    for (var i = 0; i < publicQuestionInfo.length; i++) {
        let q = publicQuestionInfo[i]
        if (q['qId'] == qId) {
            q['index'] = i + 1
            return q
        }
        // the question might have subparts!
        if (q['subparts']) {
            for (var j = 0; j < q['subparts'].length; j++) {
                let s = q['subparts'][j]
                if (s['qId'] == qId) {
                    s['index'] = i + 1
                    return s
                }
            }
        }
    }
    return null;
}

export const isEditorActive = function () {
    let activeClass = document.activeElement.className
    return activeClass.includes('DraftEditor')
        || activeClass.includes('TeXInput')
        || activeClass.includes('form-control')
        || activeClass.includes('screenReaderEditor')
        || activeClass.includes('consoleBox')
        || activeClass.includes('resourceInput')
        || activeClass.includes('ProseMirror')
}
