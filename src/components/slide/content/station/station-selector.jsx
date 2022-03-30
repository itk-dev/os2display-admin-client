import { React, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import MultiSelectComponent from '../../../util/forms/multiselect-dropdown/multi-dropdown';

/**
 * A multiselect and table for groups.
 *
 * @param {string} props The props.
 * @param {string} props.name The name for the input
 * @param {string} props.id The id used for the get.
 * @param {string} props.helpText Helptext for dropdown.
 * @returns {object} Select groups table.
 */
function StationSelector({ onChange, name, helpText, label, value }) {
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState("");

  /**
   * Adds group to list of groups.
   *
   * @param {object} props - The props.
   * @param {object} props.target - The target.
   */
  function handleAdd({ target }) {
    const { value, id: localId } = target;
    onChange({
      target: { id: localId, value: value },
    });
  }

  /**
   * Fetches data for the multi component
   *
   * @param {string} filter - The filter.
   */
  function onFilter(filter) {
    setSearchText(filter);
  }


  useEffect(() => {
      fetch(`https://xmlopen.rejseplanen.dk/bin/rest.exe/location?input=user%20i${searchText}?&format=json`)
        .then((response) => response.json())
        .then((data) => {
          if (data && data.LocationList) {
          setData(data.LocationList.StopLocation)
        }
        })
        .catch(() =>{}
        );
  }, [searchText]);

  return (
    <>
      {data && (
        <>
          <MultiSelectComponent
            options={data}
            handleSelection={handleAdd}
            name={name}
            selected={value}
            filterCallback={onFilter}
            label={label}
          />
          <small>{helpText}</small>
        </>
      )}
    </>
  );
}

StationSelector.defaultProps = {
  id: "",
};

StationSelector.propTypes = {
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  id: PropTypes.string,
  helpText: PropTypes.string.isRequired,
};

export default StationSelector;
