// import firebase from "firebase";
import {BrowserRouter} from "react-router-dom";
import {Route, Switch} from "react-router";
import {HomeRedirect} from "./HomeRedirect.jsx";
import { Authenticated } from "./components/general/auth/Authenticated";

export const Router = () => {

    return (
        <BrowserRouter>
            <Switch>

                <Route path="/:qtrId">
                    <Authenticated />
                </Route>

                <Route path="/">
                    <HomeRedirect/>
                </Route>

            </Switch>
        </BrowserRouter>
    );
};

