
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
