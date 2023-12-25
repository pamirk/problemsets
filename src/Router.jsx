// import firebase from "firebase";
import {BrowserRouter} from "react-router-dom";
import {Route, Switch} from "react-router";
import {HomeRedirect} from "./HomeRedirect";
import {Authenticated} from "./components/general/auth/Authenticated";
import {Home} from "./home/Home";
import {GradingPage} from './grading/GradingPage'
import {GradingStudent} from './grading/GradingStudent'
import PyodideProvider from "./components/pyodide/PyodideProvider";

export const Router = () => {

    return (
        <BrowserRouter>
            <Switch>
                <Route path="/grading/:qtrId/:psetId/:qId/:studentId">
                    <PyodideProvider> <Authenticated component={GradingStudent}/> </PyodideProvider>
                </Route>
                <Route path="/grading/:qtrId/:psetId/:qId">
                    <Authenticated component={GradingPage}/>
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

