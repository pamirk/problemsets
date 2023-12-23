import firebase from "firebase/app";
import "firebase/auth";
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";
import {auth} from "../../../firebaseApp.js";
import {useParams} from 'react-router';


export const Login = () => {
    // check if this is the public class

    // localhost:3000/public/lecture1/splash

    // get the url parameters
    const {qtrId} = useParams()
    if (qtrId === 'public') {
        return LoginPublic()
    }

    return (
        <div className="d-flex flex-column align-items-center">
            loading...
            <StyledFirebaseAuth
                uiConfig={{
                    signInOptions: [
                        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
                        {
                            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
                            signInMethod: firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD
                        }
                    ],
                    signInFlow: 'redirect',
                    immediateFederatedRedirect: true
                }}
                firebaseAuth={auth()}
            />
        </div>
    );
};

export const LoginPublic = () => {

    return (
        <div className="d-flex flex-column align-items-center">

            <img
                src={process.env.PUBLIC_URL + "/stanford.png"}
                style={{width: "300px", backgroundColor: "white"}}
                alt="Stanford Logo"
            />
            <h1>CS109 Public Pset App
            </h1>
            <h3 style={{color: 'grey'}}>{'Sign-up or Login'}</h3>
            <p>Version 1.0.0</p>
            <StyledFirebaseAuth
                uiConfig={{
                    signInOptions: [
                        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
                        {
                            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
                            signInMethod: firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD
                        }
                    ],
                }}
                firebaseAuth={auth()}
            />
            <div style={{maxWidth: "500px"}} className="text-center">
                <hr className="mt-5 mb-5"/>

                <h5 style={{textAlign: "center"}}>Don't have an account?</h5>
                <p>
                    Click on one of the buttons above and it will make an account for you
                </p>
            </div>
        </div>
    );
};


// const LoginPublic = () => {
//   return <div className="d-flex flex-column align-items-center">
//   <Loading/>
//   <StyledFirebaseAuth
//     uiConfig={{
//       signInOptions: [
//         {
//           provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
//           customParameters: {
//             hd: 'stanford.edu',
//             auth_type: 'reauthenticate',
//             prompt: 'select_account'
//           },
//           providerName:'Stanford',
//           buttonColor:'red',
//           iconUrl:'https://identity.stanford.edu/wp-content/uploads/2020/07/SU_SealColor_web3-1.png'
//         }
//       ],
//       signInFlow: 'redirect'
//     }}
//     firebaseAuth={auth()}
//   />
// </div>
// }
