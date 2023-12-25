import {FaUsers} from "react-icons/fa";
import {useNumOnline} from "../general/realtime/NumOnline.js";
import {MenuItem} from 'react-pro-sidebar';


export const NumOnlineMenuItem = (props) => {
    const { collapsed } = props
    // const numOnline = <NumOnlineBadge collapsed={collapsed}/>;
    const [numOnline] = useNumOnline();
    return (
      <div style={{textAlign: "center", fontSize: '0.95em', margin: '2px', color: "white"}}>
        <FaUsers style={{color: "#00c0ff"}}/> {numOnline} {collapsed ? '' :'online'}
      </div>
    )

  }

  export const PeopleOnline = (props) => {
    const { collapsed } = props
    const [numOnline] = useNumOnline();
    return (
        <MenuItem>
        {
            collapsed ? <span>{numOnline}</span> : <span>{numOnline} online</span>
        }
        </MenuItem>
    )
  }