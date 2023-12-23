// import firebase from "firebase";
import {useParams} from "react-router-dom";
import {useDocumentData,} from "react-firebase-hooks/firestore";
import {auth, firestore} from "../firebaseApp.js";

export const Home = (props) => {
    let userName = props.user.displayName

    let {qtrId} = useParams();


    // needed to find the next student ungraded
    var [classData, classDataLoading, classDataLoadingErr] = useDocumentData(
        firestore.doc(`class/${qtrId}/public/classData`)
    );

    if (classDataLoading) {
        return <></>
    }

    return <HomeWithData
        userName={userName}
        classData={classData}
        qtrId={qtrId}
    />
}

const HomeWithData = (props) => {
    console.log(props.classData)
    return <>
        <div className="container">
            <div className="row">
                <div className="col">
                    <div className="d-flex flex-column align-items-center">
                        <h1>CS109 Problem Set App</h1>
                        <h2> {props.classData.title}</h2>
                        <h2>Welcome {props.userName}
                            <button
                                className="btn btn-primary"
                                onClick={() => auth().signOut()}
                            >Logout
                            </button>
                        </h2>

                        <hr style={{width: '500px'}}/>


                        <div>
                            {props.classData.psets.map(function (pset, i) {
                                return <a
                                    key={i}
                                    className="btn btn-primary"
                                    style={{marginRight: '5px'}}
                                    href={`/${props.qtrId}/${pset.psetId}/`}
                                >{pset.title}</a>
                            })}

                            <br/><br/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
}
