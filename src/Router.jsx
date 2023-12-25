// import firebase from "firebase";
import {BrowserRouter} from "react-router-dom";
import {Route, Switch} from "react-router";
import {HomeRedirect} from "./HomeRedirect";
import {Authenticated} from "./components/general/auth/Authenticated";
import {Home} from "./home/Home";
import {GradingHome} from './grading/GradingHome.jsx'
import {GradingPage} from './grading/GradingPage'
import {GradingStudent} from './grading/GradingStudent'
import PyodideProvider from "./components/pyodide/PyodideProvider";
import {GradingStudentSummary} from "./grading/GradingStudentSummary.jsx";
import {PSetPage} from "./pset/PSetPage.jsx"
import {PSetPrint} from "./pset/PSetPrint.jsx"
import {PSetHistory} from './pset/PSetHistory.jsx'
import {PeerTeach} from "./peerTeach/PeerTeach.jsx";
import {PSetHome} from "./pset/PSetHome.jsx"
import {PeerLearnPage} from "./components/colearning/PeerLearnPage.jsx";

export const Router = () => {
    console.log("Router");
    return (
        <BrowserRouter>
            <Switch>
                <Route path="/grading/:qtrId/:psetId/:qId/:studentId">
                    <PyodideProvider> <Authenticated component={GradingStudent}/> </PyodideProvider>
                </Route>
                <Route path="/grading/:qtrId/:psetId/:qId">
                    <Authenticated component={GradingPage}/>
                </Route>
                <Route path="/studentSummary/:qtrId/:psetId/:qId">
                    <Authenticated component={GradingStudentSummary}/>
                </Route>
                <Route path="/grading/:qtrId/:psetId">
                    <Authenticated component={GradingHome}/>
                </Route>
                <Route path="/history/:qtrId/:psetId/:qId/:forcedStudentId?">
                    <PyodideProvider>
                        <Authenticated component={PSetHistory}/>
                    </PyodideProvider>
                </Route>
                <Route path="/peerTeach/:qtrId/:psetId/:roomId/">
                    <PyodideProvider>
                        <Authenticated component={PeerTeach}/>
                    </PyodideProvider>
                </Route>
                <Route path="/:qtrId/:psetId/print">
                    <Authenticated component={PSetPrint}/>
                </Route>
                <Route path="/:qtrId/:psetId/:qId/:forcedStudentId?">
                    <PyodideProvider>
                        <Authenticated component={PSetPage}/>
                    </PyodideProvider>
                </Route>
                <Route path="/:qtrId/:psetId/">
                    <Authenticated component={PSetHome}/>
                </Route>
                <Route path="/:qtrId/:psetId/peerlearnpage">
                    <Authenticated component={PeerLearnPage}/>
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

