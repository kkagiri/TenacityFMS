/**
 * Template Name: Inspinia - Admin & Dashboard Template
 * By (Author): WebAppLayers
 * Module/App (File Name): Plugins Masonry
 */

setTimeout(() => {
    document.querySelectorAll("[data-masonry]").forEach((grid) => {
        new Masonry(grid, JSON.parse(grid.getAttribute("data-masonry")))
    })
}, 100)
