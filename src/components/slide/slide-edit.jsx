import { React, useEffect, useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import set from "lodash.set";
import dayjs from "dayjs";
import { ulid } from "ulid";
import {
  useGetV1SlidesByIdQuery,
  usePostMediaCollectionMutation,
  usePutV1SlidesByIdMutation,
  api,
} from "../../redux/api/api.generated";
import SlideForm from "./slide-form";
import idFromUrl from "../util/helpers/id-from-url";

/**
 * The slide edit component.
 *
 * @returns {object} The slide edit page.
 */
function SlideEdit() {
  const { t } = useTranslation("common");
  const { id } = useParams();
  const dispatch = useDispatch();
  const headerText = t("slide-edit.edit-slide-header");
  const [formStateObject, setFormStateObject] = useState();
  const [getTheme, setGetTheme] = useState(true);
  const [getTemplate, setGetTemplate] = useState(true);
  const [mediaFields, setMediaFields] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittingMedia, setSubmittingMedia] = useState([]);
  const [mediaData, setMediaData] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState();

  const [
    PutV1Slides,
    { isLoading: isSaving, error: saveError, isSuccess: isSaveSuccess },
  ] = usePutV1SlidesByIdMutation();

  const {
    data: getSlideData,
    error: getSlideError,
    isLoading: getSlideIsLoading,
  } = useGetV1SlidesByIdQuery({ id });

  // @TODO: Handle errors.
  const [
    PostV1MediaCollection,
    { data: savedMediaData, isSuccess: isSaveMediaSuccess },
  ] = usePostMediaCollectionMutation();

  /**
   * Set state on change in input field
   *
   * @param {object} props - The props.
   * @param {object} props.target - Event target.
   */
  function handleInput({ target }) {
    const localFormStateObject = { ...formStateObject };
    set(localFormStateObject, target.id, target.value);
    setFormStateObject(localFormStateObject);
  }

  /**
   * Select template.
   *
   * @param {object} props - The props.
   * @param {object} props.target - The target.
   */
  const selectTemplate = ({ target }) => {
    const { value, id: targetId } = target;
    let template = null;

    if (value.length > 0) {
      template = value.shift();
    }

    setSelectedTemplate(template);
    handleInput({
      target: { id: targetId, value: { "@id": template["@id"] } },
    });
  };

  /**
   * Select theme.
   *
   * @param {object} props - The props.
   * @param {object} props.target - The target.
   */
  const selectTheme = ({ target }) => {
    const { value, id: targetId } = target;
    let themeId = "";
    if (value.length > 0) {
      themeId = value[0]["@id"];
    }
    setSelectedTheme(value);
    handleInput({
      target: { id: targetId, value: themeId },
    });
  };

  /**
   * Update content field for id/value.
   *
   * @param {object} props - The props.
   * @param {object} props.target - The target.
   */
  function handleContent({ target }) {
    // Convert numbers
    const value =
      target.type === "number" ? target.valueAsNumber : target.value;
    const localFormStateObject = { ...formStateObject };
    set(localFormStateObject.content, target.id, value);
    setFormStateObject(localFormStateObject);
  }

  useEffect(() => {
    // Load template if set, getTemplate because if not, it runs on every time formstateobject is changed
    if (
      formStateObject?.templateInfo &&
      Object.prototype.hasOwnProperty.call(
        formStateObject.templateInfo,
        "@id"
      ) &&
      getTemplate
    ) {
      dispatch(
        api.endpoints.getV1TemplatesById.initiate({
          id: idFromUrl(formStateObject.templateInfo["@id"]),
        })
      )
        .then((result) => {
          const template = result.data;
          setGetTemplate(false);
          setSelectedTemplate(template);
        })
        .catch(() => {
          // @TODO: Handle error.
        });
    }

    // Load theme if set, getTheme because if not, it runs on every time formstateobject is changed
    if (formStateObject?.theme && getTheme) {
      dispatch(
        api.endpoints.getV1ThemesById.initiate({
          id: idFromUrl(formStateObject.theme),
        })
      )
        .then((result) => {
          const theme = result.data;
          setGetTheme(false);
          setSelectedTheme([theme]);
        })
        .catch(() => {
          // @TODO: Handle error.
        });
    }
  }, [formStateObject]);

  /** Set loaded data into form state. */
  useEffect(() => {
    if (getSlideData) {
      const localFormStateObject = JSON.parse(JSON.stringify(getSlideData));

      // Make sure content is an object.
      if (localFormStateObject.content instanceof Array) {
        localFormStateObject.content = {};
      }

      // Upload media already added to the slide.
      const promises = [];

      localFormStateObject.media.forEach((media) => {
        promises.push(
          dispatch(
            api.endpoints.getV1MediaById.initiate({ id: idFromUrl(media) })
          )
        );
      });

      Promise.all(promises).then((results) => {
        const newMediaData = { ...mediaData };

        results.forEach((result) => {
          newMediaData[result.data["@id"]] = { ...result.data };
        });

        setMediaData(newMediaData);
      });

      // Set published to format accepted by bootstrap date component
      if (localFormStateObject.published.from) {
        localFormStateObject.published.from = dayjs(
          localFormStateObject.published.from
        ).format("YYYY-MM-DDTHH:mm");
      }
      if (localFormStateObject.published.to) {
        localFormStateObject.published.to = dayjs(
          localFormStateObject.published.to
        ).format("YYYY-MM-DDTHH:mm");
      }
      setFormStateObject(localFormStateObject);
    }
  }, [getSlideData]);

  /**
   * Handle change to a media.
   *
   * @param {string} fieldName The field name.
   */
  function handleMedia({ target }) {
    const fieldValue = target.value;
    const fieldId = target.id;
    const localFormStateObject = { ...formStateObject };
    const localMediaData = { ...mediaData };

    // Set field as a field to look into for new references.
    setMediaFields([...new Set([...mediaFields, fieldId])]);

    const newField = [];

    // Handle each entry in field.
    if (Array.isArray(fieldValue)) {
      fieldValue.forEach((entry) => {
        // New file.
        if (entry.file && entry.file instanceof File) {
          if (!Array.isArray(localFormStateObject.content[fieldId])) {
            localFormStateObject.content[fieldId] = [];
          }

          // Create a tempId for the media.
          const tempId = entry.tempId ?? `TEMP--${ulid(new Date().getTime())}`;

          newField.push(tempId);

          const newEntry = { ...entry };
          newEntry.tempId = tempId;
          set(localMediaData, tempId, newEntry);
        }
        // Previously selected file.
        else if (typeof entry === 'string') {
          newField.push(entry);
        }
        // Previously uploaded file.
        else {
          newField.push(entry["@id"]);

          if (!localMediaData.hasOwnProperty(entry["@id"])) {
            set(localMediaData, entry["@id"], entry);

            localFormStateObject.media.push(entry["@id"]);
          }
        }
      });
    }

    set(localFormStateObject.content, fieldId, newField);
    set(localFormStateObject, 'media', [...new Set([...localFormStateObject.media])]);

    setFormStateObject(localFormStateObject);
    setMediaData(localMediaData);
  }

  /** Handles submit. */
  function handleSubmit() {
    const newSubmittingMedia = [];

    // Setup submittingMedia list.
    mediaFields.forEach((fieldName) => {
      if (
        Object.prototype.hasOwnProperty.call(formStateObject.content, fieldName)
      ) {
        const fieldData = formStateObject.content[fieldName];

        if (Array.isArray(fieldData)) {
          fieldData.forEach((mediaId) => {
            const entry = mediaData[mediaId];

            if (entry.file && entry.file instanceof File) {
              newSubmittingMedia.push({ fieldName, entry, tempId: mediaId });
            }
          });
        }
      }
    });

    // Trigger submitting hooks.
    setSubmitting(true);
    setSubmittingMedia(newSubmittingMedia);
  }

  /** Handle submitting. */
  useEffect(() => {
    if (submitting) {
      if (submittingMedia.length > 0) {
        const media = submittingMedia[0];
        const { entry } = media;

        // Submit media.
        const formData = new FormData();
        formData.append("file", entry.file);
        formData.append("title", entry.title);
        formData.append("description", entry.description);
        formData.append("license", entry.license);
        // @TODO: Should these be optional in the API?
        formData.append("modifiedBy", "");
        formData.append("createdBy", "");

        PostV1MediaCollection({ body: formData });
      } else {
        // All media have been submitted. Submit slide.

        // Set published.
        const from = formStateObject.published.from
          ? new Date(formStateObject.published.from).toISOString()
          : null;
        const to = formStateObject.published.to
          ? new Date(formStateObject.published.to).toISOString()
          : null;

        // Construct data for submitting.
        const saveData = {
          id,
          slideSlideInput: JSON.stringify({
            title: formStateObject.title,
            theme: formStateObject.theme,
            description: formStateObject.description,
            templateInfo: formStateObject.templateInfo,
            duration: formStateObject?.content?.duration
              ? parseInt(formStateObject.content.duration, 10)
              : null,
            content: formStateObject.content,
            media: formStateObject.media,
            published: {
              from,
              to,
            },
          }),
        };

        PutV1Slides(saveData);
      }
    }
  }, [submittingMedia.length, submitting]);

  /** Submitted media is successful. */
  useEffect(() => {
    if (submitting) {
      if (isSaveMediaSuccess) {
        const newSubmittingMedia = [...submittingMedia];
        const submittedMedia = newSubmittingMedia.shift();

        const newFormStateObject = { ...formStateObject };
        newFormStateObject.media.push(savedMediaData["@id"]);

        // Replace TEMP-- id with real id.
        newFormStateObject.content[submittedMedia.fieldName] =
          newFormStateObject.content[submittedMedia.fieldName].map((mediaId) =>
            mediaId === submittedMedia.tempId ? savedMediaData["@id"] : mediaId
          );
        setFormStateObject(newFormStateObject);

        const newMediaData = { ...mediaData };
        newMediaData[savedMediaData["@id"]] = savedMediaData;
        setMediaData(newMediaData);

        // Save new list.
        setSubmittingMedia(newSubmittingMedia);
      }
    }
  }, [isSaveMediaSuccess]);

  /** Handle submitting is done. */
  useEffect(() => {
    if (isSaveSuccess) {
      setSubmitting(false);
    }
  }, [isSaveSuccess]);

  return (
    <>
      {formStateObject && (
        <SlideForm
          slide={formStateObject}
          headerText={`${headerText}: ${formStateObject?.title}`}
          handleInput={handleInput}
          handleContent={handleContent}
          handleMedia={handleMedia}
          handleSubmit={handleSubmit}
          selectTemplate={selectTemplate}
          selectedTemplate={selectedTemplate}
          mediaData={mediaData}
          isLoading={getSlideIsLoading}
          isSaveSuccess={isSaveSuccess}
          isSaving={submitting || isSaving}
          errors={getSlideError || saveError || false}
          selectTheme={selectTheme}
          selectedTheme={selectedTheme}
          mediaFields={mediaFields}
        />
      )}
    </>
  );
}

export default SlideEdit;
