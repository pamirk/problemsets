// import firebase from "firebase";
import {BrowserRouter} from "react-router-dom";
import {Route, Switch} from "react-router";
import {HomeRedirect} from "./HomeRedirect.jsx";

export const Router = () => {

    return (
        <BrowserRouter>
            <Switch>
                <Route path="/">
                    <HomeRedirect/>
                </Route>

            </Switch>
        </BrowserRouter>
    );
};

