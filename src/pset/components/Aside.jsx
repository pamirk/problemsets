import React, {useState} from 'react';
import {Menu, MenuItem, ProSidebar, SidebarContent, SidebarFooter, SidebarHeader, SubMenu,} from 'react-pro-sidebar';
import {Link, useParams} from "react-router-dom";
import {FaCheck, FaChevronLeft, FaChevronRight, FaFlag, FaHome, FaUser} from 'react-icons/fa';
import "bootstrap/dist/css/bootstrap.min.css";
import {auth} from "../../firebaseApp.js";
import {NumOnlineMenuItem} from '../../components/colearning/NumOnlineMenuItem.jsx';
import {useQueueStatus} from '../../components/colearning/PeerLearnPage.jsx';


/***
 * dont forget that this library can do submenus
 *
 *
 */

export const Aside = ({user, studentPsetData, toggled, setToggled, publicPsetData}) => {
    const [collapsed, setCollapsed] = useState(true);
    let corrects = studentPsetData['corrects']
    let publicQuestionInfo = publicPsetData['questionInfo']
    return <AsideWithData
        user={user}
        toggled={toggled}
        collapsed={collapsed}
        corrects={corrects}
        publicPsetData={publicPsetData}
        publicQuestionInfo={publicQuestionInfo}
        setCollapsed={setCollapsed}
        setToggled={setToggled}
    />
}

const AsideWithData = ({
                           user,
                           corrects,
                           publicQuestionInfo,
                           publicPsetData,
                           toggled,
                           setToggled,
                           collapsed,
                           setCollapsed
                       }) => {
    let {qtrId, psetId, qId} = useParams();
    const queueStatus = useQueueStatus(qtrId);
    const isOpen = queueStatus && queueStatus['isOpen']
    return (<>

            <ProSidebar
                toggled={toggled}
                onToggle={setToggled}
                collapsed={collapsed}
                breakPoint="md"
                style={{height: '100vh'}}
            >

                <SidebarHeader>
                    <h4 style={{
                        textAlign: 'center',
                        paddingBottom: '0px',
                        marginTop: '10px',
                        marginBottom: '0px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {collapsed ? publicPsetData['sidebarShort'] : publicPsetData['sidebarLong']}
                    </h4>

                    <Menu iconShape="round">
                        <MenuItem
                            icon={<span><FaHome/></span>}
                            active={qId === 'splash'}
                        >
                            Home
                            <Link to={`/${qtrId}/${psetId}/splash`}/>
                        </MenuItem>

                    </Menu>

                </SidebarHeader>
                <SidebarContent>
                    <QuestionLinks
                        publicQuestionInfo={publicQuestionInfo}
                        corrects={corrects}
                        collapsed={collapsed}
                        psetId={psetId}
                        qtrId={qtrId}
                    />
                </SidebarContent>

                <SidebarFooter>

                    <Menu iconShape="circle">

                        {/* <OverlayTrigger
      placement="right"
      delay={{ show: 250, hide: 0 }}
      overlay={collapsed ? <Tooltip>{'Learn with others'}</Tooltip> : <></>}
      >
        <MenuItem
          icon = {<span><FaHandshake/></span>}
          active = {qId === 'peerlearnpage'}
          className={isOpen ? "searching" : ""}
        >
          {collapsed ? '' : 'Learn with Others'}
          <Link to={`/${qtrId}/${psetId}/peerlearnpage`}/>

        </MenuItem>
      </OverlayTrigger> */}

                        <MenuItem
                            icon={<span><FaFlag/></span>}
                            active={qId === 'submit'}
                        >
                            Submit
                            <Link to={`/${qtrId}/${psetId}/submit`}/>
                        </MenuItem>


                        <SubMenu title="User" icon={<FaUser/>}>
                            <MenuItem
                                icon={<span>All Psets</span>}
                            >
                                <Link to={`/${qtrId}`}/>
                            </MenuItem>
                            <MenuItem
                                onClick={() => {
                                    deleteAllCookies()
                                    auth().signOut()
                                }}
                                icon={<span>Logout</span>}
                            ></MenuItem>
                        </SubMenu>

                        <MenuItem
                            icon={collapsed ? <FaChevronRight/> : <FaChevronLeft/>}
                            onClick={() => setCollapsed(!collapsed)}
                        >
                            {collapsed ? 'Expand' : 'Minimize'}

                        </MenuItem>

                    </Menu>
                </SidebarFooter>

                <SidebarFooter>
                    <NumOnlineMenuItem collapsed={collapsed}/>
                </SidebarFooter>

            </ProSidebar>
        </>
    )
}

const QuestionLinks = ({publicQuestionInfo, corrects, collapsed, qtrId, psetId}) => {
    let currIndex = 0
    let lastBaseName = '' // notice when a subpart is finished
    return <>
        <Menu iconShape="circle">
            {
                publicQuestionInfo.map(function (question, index) {

                    let qId = question.qId
                    let parts = qId.split('__')
                    let currBaseName = parts[0]
                    if (currBaseName != lastBaseName) {
                        currIndex += 1
                    }
                    let iconText = currIndex
                    if (qId.includes('__')) {
                        let subpartTag = parts[1]
                        iconText += subpartTag
                    }
                    lastBaseName = currBaseName


                    return <QuestionMenuItem
                        key={index}
                        questionInfo={question}
                        corrects={corrects}
                        iconText={iconText}
                        collapsed={collapsed}
                        qtrId={qtrId}
                        psetId={psetId}
                    />
                })
            }
        </Menu>
    </>

}

const QuestionMenuItem = ({questionInfo, qtrId, psetId, collapsed, corrects, iconText}) => {
    let itemQId = questionInfo['qId']
    let {qId} = useParams();
    let isActive = itemQId == qId
    // if its in the correct dictionary and has the value true
    let isCorrect = itemQId in corrects && corrects[itemQId]
    var suffix = <span/>
    var collapsedSuffix = <span/>
    if (isCorrect) {
        suffix = <span className="badge bg-success rounded-pill"><FaCheck/></span>
        if (collapsed) {
            collapsedSuffix = <span
                className="position-absolute top-50 ml-4 start-50 translate-middle-y badge rounded-pill bg-success"><FaCheck/><span
                className="visually-hidden">correct</span></span>
        }
    }
    return (
        <MenuItem
            active={isActive}
            icon={<span>{iconText}{collapsedSuffix}</span>}
            suffix={suffix}
        >
            {questionInfo['title']}
            <Link to={`/${qtrId}/${psetId}/${itemQId}`}/>
        </MenuItem>
    )
}

const SubpartMenuItem = ({questionInfo, qtrId, psetId, collapsed, corrects, index}) => {
    return (
        <SubMenu title="Components" icon={<span>5</span>}>
            <MenuItem icon={<span>a</span>}></MenuItem>
            <MenuItem icon={<span>b</span>}></MenuItem>
        </SubMenu>
    )
}

function getInitials(name) {
    if (!name) return ''
    return name.split(" ").map((n) => n[0]).join("");
}

function deleteAllCookies() {
    // NOTE: this was an attempt to make logout actually log-out of stanford
    // but it didn't work. Consider deleting this whole function...
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}