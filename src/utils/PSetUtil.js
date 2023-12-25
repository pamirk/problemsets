export const checkIsPastDeadline = function (publicPsetData, studentPsetData) {
    let currTime = new Date()
    // user might not have this... field set
    if (studentPsetData.extension) {
        const personalDueDate = new Date(studentPsetData.extension.dueDate);
        return (currTime.getTime() > personalDueDate.getTime())
    } else {
        // check if it is past the grace period.
        let gracePeriodDeadline = getGracePeriodDeadline(publicPsetData)
        return (currTime.getTime() > gracePeriodDeadline.getTime())
    }
}
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

export const getPreviousQuestionId = function (qId, publicQuestionInfo) {
    for (var i = 0; i < publicQuestionInfo.length; i++) {
        let currQ = publicQuestionInfo[i]
        if (currQ['qId'] == qId) {
            if (i == 0) {
                return 'splash'
            }
            let lastQ = publicQuestionInfo[i - 1]
            return lastQ['qId']
        }
    }
    return ''
}
export const getNextQuestionId = function (qId, publicQuestionInfo) {
    for (var i = 0; i < publicQuestionInfo.length; i++) {
        let currQ = publicQuestionInfo[i]
        if (currQ['qId'] == qId) {
            if (i == publicQuestionInfo.length - 1) {
                return 'submit'
            }
            let lastQ = publicQuestionInfo[i + 1]
            return lastQ['qId']
        }
    }
    return ''
}