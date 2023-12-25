export const checkIsAdmin = function (userMetaData) {
    if (!userMetaData) {
        // you might not have any metadata
        return false
    }
    if (!userMetaData.role) {
        // you might not have a role
        return false
    } else {
        // and you might not be admin
        return userMetaData.role === 'admin'
    }
}
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
