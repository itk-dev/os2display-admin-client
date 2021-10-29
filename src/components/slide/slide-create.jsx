import { React, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import set from "lodash.set";
import { useParams } from "react-router";
import {
  usePostMediaCollectionMutation,
  usePostV1SlidesMutation,
} from "../../redux/api/api.generated";
import SlideForm from "./slide-form";

/**
 * The slide create component.
 *
 * @returns {object} The slide create page.
 */
function SlideCreate() {
  const { t } = useTranslation("common");
  const { id } = useParams();
  const headerText = t("slide-create.create-slide-header");
  const [mediaFields, setMediaFields] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittingMedia, setSubmittingMedia] = useState([]);
  const [loadedMedia, setLoadedMedia] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Initialize to empty slide object.
  const [formStateObject, setFormStateObject] = useState({
    title: "",
    description: "",
    templateInfo: [],
    duration: null,
    content: {},
    media: [],
  });

  const [
    PostV1Slides,
    { isLoading: isSaving, error: saveError, isSuccess: isSaveSuccess },
  ] = usePostV1SlidesMutation();

  // @TODO: Handle errors.
  const [
    PostV1MediaCollection,
    { data: mediaData, isSuccess: isSaveMediaSuccess },
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
      [template] = value;
    }

    setSelectedTemplate(template);
    handleInput({
      target: { id: targetId, value: { "@id": template["@id"] } },
    });
  };

  /**
   * Update content field for id/value.
   *
   * @param {object} props The props.
   * @param {object} props.target The field and value that should be updated.
   */
  function handleContent({ target }) {
    const localFormStateObject = { ...formStateObject };
    set(localFormStateObject.content, target.id, target.value);
    setFormStateObject(localFormStateObject);
  }

  /**
   * Handle change to a media.
   *
   * @param {string} fieldName The field name.
   */
  function handleMedia(fieldName) {
    setMediaFields([...new Set([...mediaFields, fieldName])]);
  }

  /** Handles submit. */
  function handleSubmit() {
    const newSubmittingMedia = [];

    // Setup submittingMedia list.
    mediaFields.forEach((fieldName) => {
      if (
        Object.prototype.hasOwnProperty.call(formStateObject.content, fieldName)
      ) {
        const contentField = formStateObject.content[fieldName];
        contentField.forEach((element) => {
          const formData = new FormData();
          formData.append("file", element.file);
          formData.append("title", element.title);
          formData.append("description", element.description);
          formData.append("license", element.license);
          // @TODO: Should these be optional in the API?
          formData.append("modifiedBy", "");
          formData.append("createdBy", "");
          newSubmittingMedia.push(formData);
        });
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

        // Submit media.
        PostV1MediaCollection({ body: media });
      } else {
        // All media have been submitted. Submit slide.
        const saveData = {
          id,
          slideSlideInput: JSON.stringify({
            title: formStateObject.title,
            description: formStateObject.description,
            templateInfo: formStateObject.templateInfo,
            duration: formStateObject?.content?.duration
              ? parseInt(formStateObject.content.duration, 10)
              : null,
            content: formStateObject.content,
            media: formStateObject.media,
          }),
        };

        PostV1Slides(saveData);
      }
    }
  }, [submittingMedia.length, submitting]);

  /** Submitted media is successful. */
  useEffect(() => {
    if (submitting) {
      if (isSaveMediaSuccess) {
        const newMediaFields = [...mediaFields];
        const firstMediaField = newMediaFields.shift();
        setMediaFields(newMediaFields);

        const newFormStateObject = { ...formStateObject };
        newFormStateObject.media.push(mediaData["@id"]);
        newFormStateObject.content[firstMediaField] = mediaData["@id"];
        setFormStateObject(newFormStateObject);

        const newLoadedMedia = { ...loadedMedia };
        newLoadedMedia[mediaData["@id"]] = mediaData;
        setLoadedMedia(newLoadedMedia);

        // Move to next media to upload.
        const newList = submittingMedia.slice(1);
        setSubmittingMedia(newList);
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
          loadedMedia={loadedMedia}
          isLoading={false}
          isSaveSuccess={isSaveSuccess}
          isSaving={submitting || isSaving}
          errors={saveError || false}
        />
      )}
    </>
  );
}

export default SlideCreate;
