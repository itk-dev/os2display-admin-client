import { React, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Col, Form, Row, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import SearchBox from "../../util/search-box/search-box";
import ContentBody from "../../util/content-body/content-body";
import { useGetV1MediaQuery } from "../../../redux/api/api.generated";
import "../../media/media-list.scss";
import Pagination from "../../util/paginate/pagination";
import FilePreview from "./file-preview";

/**
 * The media list component.
 *
 * @param {object} props - The props.
 * @param {boolean} props.multiple - Is the list in multiple mode? This will
 *   enable checkbox for each element.
 * @param {Function} props.onItemClick - Handler when item is clicked.
 * @param {Array} props.selectedMediaIds - List of selected media ids.
 * @returns {object} - The media list.
 */
function MediaSelectorList({ multiple, selectedMediaIds, onItemClick }) {
  // Translations
  const { t } = useTranslation("common");

  const pageSize = 10;

  // State
  const [media, setMedia] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [title, setTitle] = useState("");

  // Get method
  const { data: mediaData, isLoading } = useGetV1MediaQuery({ page, title });

  /** Set loaded data into form state. */
  useEffect(() => {
    if (mediaData) {
      const mappedData = mediaData["hydra:member"].map((mediaItem) => {
        return { ...mediaItem };
      });
      setMedia(mappedData);
      setTotalItems(mediaData["hydra:totalItems"]);
    }
  }, [mediaData]);

  /** @param {number} selectedPage - The selected page. */
  const updateUrlAndChangePage = (selectedPage) => {
    setPage(selectedPage);
  };

  /**
   * Sets search text.
   *
   * @param {string} newSearchText Updates the search text state and url.
   */
  const handleSearch = (newSearchText) => {
    setTitle(newSearchText);
  };

  return (
    <>
      <ContentBody>
        <Row className="mt-2 mb-2">
          <Col sm={12} md={6}>
            <SearchBox
              showLabel
              value={title}
              onChange={handleSearch}
              helpText={t("media-list.search-help-text")}
            />
          </Col>
        </Row>
        {isLoading && (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className="m-1"
            />
            {t("media-list.loading-messages.loading-media")}
          </>
        )}
        {!isLoading && (
          <div className="row row-cols-2 row-cols-sm-3 row-cols-xl-4 row-cols-xxl-5 media-list">
            {media.map((data) => {
              const selected = selectedMediaIds.includes(data["@id"]);

              return (
                <div key={data["@id"]} className="col mb-3">
                  <div
                    className={`card bg-light h-100 media-item +
                  ${selected ? " selected" : ""}`}
                  >
                    <button
                      type="button"
                      className="media-item-button"
                      onClick={() => onItemClick(data)}
                    >
                      <FilePreview fileEntry={data} />
                    </button>

                    {multiple && (
                      <Form.Check
                        type="checkbox"
                        checked={selected}
                        tabIndex={-1}
                        aria-label={t("media-list.checkbox-form-aria-label")}
                        readOnly
                      />
                    )}

                    <div className="card-body">
                      <div className="row align-items-center">
                        <div className="col-auto">
                          <h2 className="h6">{data.title}</h2>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col">
                          <span className="small">{data.description}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ContentBody>
      <Pagination
        itemsCount={totalItems}
        pageSize={pageSize}
        currentPage={page}
        onPageChange={updateUrlAndChangePage}
      />
    </>
  );
}

MediaSelectorList.defaultProps = {
  multiple: false,
};

MediaSelectorList.propTypes = {
  selectedMediaIds: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  onItemClick: PropTypes.func.isRequired,
  multiple: PropTypes.bool,
};

export default MediaSelectorList;
