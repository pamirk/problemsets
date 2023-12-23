import {useDocumentDataOnce} from "react-firebase-hooks/firestore";
import {Redirect} from "react-router";
import {firestore} from "./firebaseApp.js";

export const HomeRedirect = () => {
    const [appData, isLoading] = useDocumentDataOnce(firestore.doc(`global/app`))
    if (isLoading) {
        return <></>
    }
    const qtrId = appData.currentTerm
    console.log(qtrId)
    return <Redirect
        to={`/${qtrId}`}
    />
}