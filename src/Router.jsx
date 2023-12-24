// import firebase from "firebase";
import {BrowserRouter} from "react-router-dom";
import {Route, Switch} from "react-router";
import {HomeRedirect} from "./HomeRedirect.jsx";
import {Authenticated} from "./components/general/auth/Authenticated";
import {Home} from "./home/Home.jsx";
import {GradingStudent} from './grading/GradingStudent.jsx'
import PyodideProvider from "./components/pyodide/PyodideProvider.jsx";

export const Router = () => {

    return (
        <BrowserRouter>
            <Switch>
                <Route path="/grading/:qtrId/:psetId/:qId/:studentId">
                    <PyodideProvider> <Authenticated component={GradingStudent}/> </PyodideProvider>
                </Route>
                <Route path="/:qtrId">
                    <Authenticated component={Home}/>
                </Route>

                <Route path="/">
                    <HomeRedirect/>
                </Route>

            </Switch>
        </BrowserRouter>
    );
};

