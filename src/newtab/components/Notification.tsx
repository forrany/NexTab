import React, { useRef } from "react"
import { CSSTransition } from "react-transition-group"
import { IAppState } from "../state/state"
import { CL } from "../helpers/classNameHelper"
import IconProgress from "../icons/progress.svg"
import { CheckCircleIcon } from "../icons/CheckCircleIcon"

export const Notification = React.memo((props: {
  notification: IAppState["notification"];
}) => {
  const refEl = useRef<HTMLDivElement>(null)
  
  // Basic heuristic: If not loading and not error -> Success
  const isSuccess = !props.notification.isLoading && !props.notification.isError && props.notification.visible;

  return (
    <div className="notification-box">
      <CSSTransition
        nodeRef={refEl}
        in={props.notification.visible}
        timeout={300}
        classNames="notification"
        unmountOnExit
      >
        <div className={CL("notification", {
          "notification__error": props.notification.isError
        })} ref={refEl}>
          {
            props.notification.isLoading && <span style={{display: 'flex', alignItems: 'center', color: '#0066FF'}}><IconProgress className="spin"/></span>
          }
          {
             isSuccess && <span style={{color: '#52c41a', display: 'flex', alignItems: 'center'}}><CheckCircleIcon/></span>
          }
          <span>{props.notification.message}</span>
          {
            props.notification.button
              ? <span className="notification__button"
                      onClick={props.notification.button.onClick}>
                {props.notification.button.text}</span>
              : null
          }
        </div>
      </CSSTransition>
    </div>
  )
})
