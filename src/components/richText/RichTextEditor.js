/**
 * Component: RichTextEditor.
 * text can be changed (and edit bar is rendered) if editable is true
 * reads/writes to a given firebaseDocPath. Loads the default RTE which currently is...
 * TipTapEditor
 *
 * Props:
 * - value
 * - editable
 */
import {TipTap} from './TipTapEditor/TipTap.jsx'
import {TipTapNoColab} from './TipTapEditor/TipTapNoColab.jsx';

export const RichTextEditor = ({
    user,
    editable,
    firebaseDocPath,
    collaborative=true,
    contentKey='content'
  }) => {

  if(!firebaseDocPath) {
    return <>Missing firebasedocpath</>
  }
  if(!collaborative){
    return <TipTapNoColab
      firebaseDocPath={firebaseDocPath}
      editable={editable}
      user={user}
      contentKey={contentKey}
    /> 
  }
  return <TipTap
    firebaseDocPath={firebaseDocPath}
    editable={editable}
    user={user}
  />
};
