/**
 * Template Name: Inspinia - Admin & Dashboard Template
 * By (Author): WebAppLayers
 * Module/App (File Name): Form Fileupload
 */

import Dropzone from "dropzone"
import * as FilePond from "filepond"
import FilePondPluginImagePreview from "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.js"
import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation/dist/filepond-plugin-image-exif-orientation.min.js"
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size/dist/filepond-plugin-file-validate-size.min.js"
import FilePondPluginFileEncode from "filepond-plugin-file-encode/dist/filepond-plugin-file-encode.min.js"

class FileUpload {
    constructor() {
        this.init()
    }

    init() {
        if (typeof Dropzone === "undefined") {
            console.warn("Dropzone is not loaded.")
            return
        }

        Dropzone.autoDiscover = false

        const dropzones = document.querySelectorAll('[data-plugin="dropzone"]')
        if (dropzones) {
            dropzones.forEach((dropzoneEl) => {
                const actionUrl = dropzoneEl.getAttribute("action") || "/"
                const previewContainer = dropzoneEl.dataset.previewsContainer
                const uploadPreviewTemplate = dropzoneEl.dataset.uploadPreviewTemplate

                const options = {
                    url: actionUrl,
                    acceptedFiles: "image/*",
                }

                if (previewContainer) {
                    options.previewsContainer = previewContainer
                }

                if (uploadPreviewTemplate) {
                    const template = document.querySelector(uploadPreviewTemplate)
                    if (template) {
                        options.previewTemplate = template.innerHTML
                    }
                }

                try {
                    new Dropzone(dropzoneEl, options)
                } catch (e) {
                    console.error("Dropzone initialization failed:", e)
                }
            })
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new FileUpload()

    if (typeof FilePond !== "undefined") {
        // FilePond Plugins
        try {
            FilePond.registerPlugin(FilePondPluginImagePreview, FilePondPluginImageExifOrientation, FilePondPluginFileValidateSize, FilePondPluginFileEncode)
        } catch (e) {
            console.warn("FilePond plugins registration failed:", e)
        }

        // multiple-file inputs
        const multiInputs = document.querySelectorAll("input.filepond-input-multiple")
        multiInputs.forEach((input) => {
            FilePond.create(input)
        })

        // circle-style FilePond inputs
        const circleInputs = document.querySelectorAll("input.filepond-input-circle")
        circleInputs.forEach((input) => {
            FilePond.create(input, {
                imageCropAspectRatio: "1:1",
                imageResizeTargetWidth: 200,
                imageResizeTargetHeight: 200,
                stylePanelLayout: "compact circle",
                styleLoadIndicatorPosition: "center bottom",
                styleProgressIndicatorPosition: "right bottom",
                styleButtonRemoveItemPosition: "left bottom",
                styleButtonProcessItemPosition: "right bottom",
                allowImagePreview: true,
                imagePreviewHeight: 100,
                labelIdle: `<svg  xmlns="http://www.w3.org/2000/svg"  width="32"  height="32"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round" class="text-default-400"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2" /><path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>`,
            })
        })
    } else {
        console.warn("FilePond is not loaded.")
    }
})
