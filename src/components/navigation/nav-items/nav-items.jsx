import { React, useContext, useEffect } from "react";
import { Nav } from "react-bootstrap";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDesktop,
  faStream,
  faPhotoVideo,
  faPlusCircle,
  faCog,
} from "@fortawesome/free-solid-svg-icons";
import ListContext from "../../../context/list-context";
import UserContext from "../../../context/user-context";
import useModal from "../../../context/modal-context/modal-context-hook";
import RestrictedNavRoute from "./restricted-nav-route";
import "./nav-items.scss";

/**
 * The nav items.
 *
 * @returns {object} Nav items
 */
function NavItems() {
  const { t } = useTranslation("common");
  const { setSelected } = useModal();
  const context = useContext(UserContext);
  const { page, createdBy, isPublished } = useContext(ListContext);
  const { pathname } = useLocation();

  // Reset list context and selected on page change.
  useEffect(() => {
    setSelected([]);
    if (page) {
      page.set(1);
    }
    if (createdBy) {
      createdBy.set("all");
    }
    if (isPublished) {
      isPublished.set(undefined);
    }
  }, [pathname]);

  return (
    <>
      {context.accessConfig?.get && (
        <>
          <Nav.Item>
            <NavLink
              id="nav-items_content_slides"
              className={({ isActive }) =>
                `nav-link ${isActive ? "disabled" : ""}`
              }
              to="/slide/list"
            >
              <FontAwesomeIcon className="me-2" icon={faPhotoVideo} />
              {t("nav-items.content-slides")}
            </NavLink>
            <Link className="nav-add-new" to="/slide/create">
              <FontAwesomeIcon className="ms-3" icon={faPlusCircle} />
            </Link>
          </Nav.Item>
          <Nav.Item className="nav-second-level">
            <NavLink
              id="nav-items_content_media"
              className={({ isActive }) =>
                `nav-link ${isActive ? "disabled" : ""}`
              }
              to="/media/list"
            >
              {t("nav-items.content-media")}
            </NavLink>
          </Nav.Item>
          <Nav.Item>
            <NavLink
              id="nav-items_playlists_playlists"
              className={({ isActive }) =>
                `nav-link ${isActive ? "disabled" : ""}`
              }
              to="/playlist/list"
            >
              <FontAwesomeIcon className="me-2" icon={faStream} />
              {t("nav-items.playlists-playlists")}
            </NavLink>
            <Link className="nav-add-new" to="/playlist/create">
              <FontAwesomeIcon className="ms-3" icon={faPlusCircle} />
            </Link>
          </Nav.Item>
          <RestrictedNavRoute roles={context.accessConfig.get.campaign.roles}>
            <Nav.Item className="nav-second-level">
              <NavLink
                id="nav-items_content_media"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "disabled" : ""}`
                }
                to="/campaign/list"
              >
                {t("nav-items.playlists-campaigns")}
              </NavLink>
            </Nav.Item>
          </RestrictedNavRoute>
          <RestrictedNavRoute roles={context.accessConfig.get.shared.roles}>
            <Nav.Item className="nav-second-level">
              <NavLink
                id="nav-items_content_shared_playlists"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "disabled" : ""}`
                }
                to="/shared/list"
              >
                {t("nav-items.shared-playlists")}
              </NavLink>
            </Nav.Item>
          </RestrictedNavRoute>
          <RestrictedNavRoute roles={context.accessConfig.get.campaign.roles}>
            <Nav.Item>
              <NavLink
                id="nav-items_screens_screens"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "disabled" : ""}`
                }
                to="/screen/list"
              >
                <FontAwesomeIcon className="me-2" icon={faDesktop} />
                {t("nav-items.screens-screens")}
              </NavLink>
              <Link className="nav-add-new" to="/screen/create">
                <FontAwesomeIcon className="ms-3" icon={faPlusCircle} />
              </Link>
            </Nav.Item>
          </RestrictedNavRoute>
          <RestrictedNavRoute roles={context.accessConfig.get.groups.roles}>
            <Nav.Item className="nav-second-level">
              <NavLink
                id="nav-items_screens_groups"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "disabled" : ""}`
                }
                to="/group/list"
              >
                {t("nav-items.screens-groups")}
              </NavLink>
            </Nav.Item>
          </RestrictedNavRoute>
          <RestrictedNavRoute roles={context.accessConfig.get.settings.roles}>
            <Nav.Item>
              <NavLink
                id="nav-items_settings"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "disabled" : ""}`
                }
                to="/themes/list"
              >
                <FontAwesomeIcon className="me-2" icon={faCog} />
                {t("nav-items.configuration")}
              </NavLink>
            </Nav.Item>
          </RestrictedNavRoute>
          <RestrictedNavRoute roles={context.accessConfig.get.settings.roles}>
            <Nav.Item className="nav-second-level">
              <NavLink
                id="nav-items_configuration_themes"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "disabled" : ""}`
                }
                to="/themes/list"
              >
                {t("nav-items.configuration-themes")}
              </NavLink>
            </Nav.Item>
          </RestrictedNavRoute>
        </>
      )}
    </>
  );
}

export default NavItems;
