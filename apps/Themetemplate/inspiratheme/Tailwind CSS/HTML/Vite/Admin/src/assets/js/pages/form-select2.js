/**
 * Template Name: Inspinia - Admin & Dashboard Template
 * By (Author): WebAppLayers
 * Module/App (File Name): Form Select2
 */

import $ from "jquery"

window.jQuery = window.$ = $

import select2 from "select2"
select2(window, jQuery)

if (jQuery().select2) {
    $('[data-toggle="select2"]').select2()
}
